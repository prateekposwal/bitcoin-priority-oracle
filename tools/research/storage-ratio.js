var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var https = require('https');

var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');
var RPC_ARGS = '-rpcuser=bsahi -rpcpassword=bsahi';

var CONFIG = {
  nodeCostPerYear: 925,
  estimatedNodeCount: 60000,
  yearsOfStorage: 10,
  avgBlockSizeBytes: 1500000,
};

function sqlQuery(sql) {
  try {
    var tmpFile = '/tmp/bsahi-sr-' + Date.now() + '.sql';
    fs.writeFileSync(tmpFile, '.mode json\n' + sql);
    var result = child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmpFile + '"', { encoding: 'utf8', timeout: 10000 });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    try { return JSON.parse(result); } catch (e) { return []; }
  } catch (e) { return []; }
}

function bitcoinCli(method, params) {
  try {
    var cmd = '~/.local/bin/bitcoin-cli ' + RPC_ARGS + ' ' + method;
    if (params) cmd += ' ' + params;
    return JSON.parse(child_process.execSync(cmd, { encoding: 'utf8', timeout: 15000, shell: '/bin/zsh' }));
  } catch (e) { return null; }
}

function computeRatio(txFeeSats, txBytes, replicationFactor, costPerBytePerYear, years, btcPriceUsd) {
  if (!txFeeSats || !txBytes || txBytes === 0) return null;
  btcPriceUsd = btcPriceUsd || 64000;
  var storageCostPerNode = txBytes * costPerBytePerYear * years;
  var totalNetworkCostUsd = storageCostPerNode * replicationFactor;
  var feeUsd = (txFeeSats / 100000000) * btcPriceUsd;
  return { ratio: totalNetworkCostUsd > 0 ? (feeUsd / totalNetworkCostUsd) : 0, storageCostUsd: totalNetworkCostUsd, feeUsd: feeUsd, feeBtc: txFeeSats / 100000000, txBytes: txBytes };
}

function computeFromFeeHistory() {
  var results = [];
  var captures = sqlQuery("SELECT json_data FROM captures WHERE source='fee_history' ORDER BY captured_at DESC LIMIT 1");
  if (!captures || captures.length === 0) return results;
  try {
    var data = JSON.parse(captures[0].json_data);
    if (!Array.isArray(data)) return results;

    var costPerBytePerYear = CONFIG.nodeCostPerYear / (CONFIG.avgBlockSizeBytes * 365.25 * 24 * 6 / CONFIG.yearsOfStorage);
    var replicationFactor = CONFIG.estimatedNodeCount;

    for (var i = 0; i < data.length; i++) {
      var entry = data[i];
      var avgFees = entry.avgFees || 0;
      var btcPrice = entry.USD || 64000;
      var ratio = computeRatio(avgFees, CONFIG.avgBlockSizeBytes, replicationFactor, costPerBytePerYear, CONFIG.yearsOfStorage, btcPrice);
      if (ratio) {
        results.push({
          height: entry.avgHeight,
          ratio: ratio.ratio,
          storageCostUsd: ratio.storageCostUsd,
          feeUsd: ratio.feeUsd,
          feeBtc: ratio.feeBtc,
          txBytes: ratio.txBytes,
        });
      }
    }
  } catch (e) {}
  return results;
}

function computeFromBlockStats() {
  var results = [];
  var blocks = sqlQuery("SELECT height, avg_fee_sats, size, fee_percentiles FROM block_stats ORDER BY height DESC LIMIT 10");
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    var size = b.size || CONFIG.avgBlockSizeBytes;
    var costPerBytePerYear = CONFIG.nodeCostPerYear / (size * 365.25 * 24 * 6 / CONFIG.yearsOfStorage);
    var replicationFactor = CONFIG.estimatedNodeCount;
    var ratio = computeRatio(b.avg_fee_sats, size, replicationFactor, costPerBytePerYear, CONFIG.yearsOfStorage);
    if (ratio) {
      results.push({
        height: b.height,
        ratio: ratio.ratio,
        storageCostBtc: ratio.storageCost,
        feeBtc: ratio.feeBtc,
        txBytes: size,
        feePercentiles: b.fee_percentiles,
      });
    }
  }
  return results;
}

function generateReport() {
  var feeHistoryRatios = computeFromFeeHistory();
  var blockStatsRatios = computeFromBlockStats();

  var lines = [];
  lines.push('# Storage Cost Coverage Ratio Report');
  lines.push('Generated: ' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
  lines.push('');
  lines.push('## Thesis');
  lines.push('');
  lines.push('Bitcoin\'s fee market prices short-term competition for block inclusion. This report measures');
  lines.push('whether those fees also cover the long-term storage burden imposed on the network.');
  lines.push('');
  lines.push('**Storage Cost Coverage Ratio** = Transaction Fee (BTC) / (Bytes × Replication Factor × Cost per Byte per Year × Years)');
  lines.push('');
  lines.push('A ratio > 1.0 means the fee exceeds estimated storage cost. A ratio < 1.0 means the network');
  lines.push('subsidizes storage beyond what the fee covers.');
  lines.push('');

  lines.push('## Parameters');
  lines.push('');
  lines.push('| Parameter | Value |');
  lines.push('|-----------|-------|');
  lines.push('| Node cost per year | $' + CONFIG.nodeCostPerYear + ' |');
  lines.push('| Estimated full nodes | ' + CONFIG.estimatedNodeCount.toLocaleString() + ' |');
  lines.push('| Storage horizon | ' + CONFIG.yearsOfStorage + ' years |');
  lines.push('| Avg block size | ' + (CONFIG.avgBlockSizeBytes / 1000000).toFixed(1) + ' MB |');
  lines.push('');

  if (feeHistoryRatios.length > 0) {
    var ratios = feeHistoryRatios.map(function(r) { return r.ratio; });
    var avgRatio = ratios.reduce(function(a, b) { return a + b; }, 0) / ratios.length;
    var minRatio = Math.min.apply(null, ratios);
    var maxRatio = Math.max.apply(null, ratios);

    lines.push('## Results (from 24h fee history)');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push('| Blocks sampled | ' + feeHistoryRatios.length + ' |');
    lines.push('| Avg coverage ratio | ' + avgRatio.toFixed(4) + ' |');
    lines.push('| Min ratio | ' + minRatio.toFixed(4) + ' |');
    lines.push('| Max ratio | ' + maxRatio.toFixed(4) + ' |');
    lines.push('| Interpretation | ' + (avgRatio > 1 ? 'Fees EXCEED storage cost' : 'Fees BELOW storage cost') + ' |');
    lines.push('');

    var below1 = ratios.filter(function(r) { return r < 1; }).length;
    var pctBelow = (below1 / ratios.length * 100).toFixed(1);
    lines.push('- ' + pctBelow + '% of blocks have fees covering less than 1× the estimated 10-year storage cost');
    lines.push('');

    lines.push('### Ratio Distribution (last 24h)');
    lines.push('');
    lines.push('```');
    var buckets = [0, 0.1, 0.5, 1, 2, 5, 10, Infinity];
    var bucketLabels = ['<0.1', '0.1-0.5', '0.5-1', '1-2', '2-5', '5-10', '10+'];
    for (var b = 0; b < buckets.length - 1; b++) {
      var count = ratios.filter(function(r) { return r >= buckets[b] && r < buckets[b + 1]; }).length;
      var bar = '';
      for (var bi = 0; bi < Math.round(count / ratios.length * 50); bi++) bar += '█';
      lines.push(bucketLabels[b].padEnd(8) + ' ' + bar + ' (' + count + ')');
    }
    lines.push('```');
    lines.push('');
  }

  if (blockStatsRatios.length > 0) {
    lines.push('## Results (from Bitcoin Core block stats)');
    lines.push('');
    lines.push('| Height | Ratio | Fee (BTC) | Storage Cost (BTC) | Size |');
    lines.push('|--------|-------|-----------|-------------------|------|');
    for (var i = 0; i < blockStatsRatios.length; i++) {
      var r = blockStatsRatios[i];
      lines.push('| ' + r.height + ' | ' + r.ratio.toFixed(4) + ' | ' + r.feeBtc.toFixed(6) + ' | ' + r.storageCostBtc.toFixed(6) + ' | ' + (r.txBytes / 1000).toFixed(0) + ' KB |');
    }
    lines.push('');
  }

  lines.push('## Discussion');
  lines.push('');
  if (feeHistoryRatios.length > 0) {
    var avgR = feeHistoryRatios.reduce(function(a, b) { return a + b.ratio; }, 0) / feeHistoryRatios.length;
    if (avgR > 1) {
      lines.push('Average ratio of ' + avgR.toFixed(2) + ' suggests that current fees generally cover the estimated');
      lines.push(CONFIG.yearsOfStorage + '-year storage cost across the network. However, this is an average —');
      lines.push('individual blocks with low fee volume may fall below the threshold.');
    } else {
      lines.push('Average ratio of ' + avgR.toFixed(2) + ' suggests that current fees do NOT fully cover the estimated');
      lines.push(CONFIG.yearsOfStorage + '-year storage cost across the network. The difference represents an');
      lines.push('unpriced externality borne by node operators.');
    }
  }
  lines.push('');
  lines.push('### Caveats');
  lines.push('');
  lines.push('- Node count is estimated (60K). Actual count varies.');
  lines.push('- Node costs vary by hardware, bandwidth, electricity.');
  lines.push('- Storage horizon of ' + CONFIG.yearsOfStorage + ' years is an assumption. Some nodes prune earlier, some keep archival data forever.');
  lines.push('- Block size is averaged. Individual blocks vary significantly.');
  lines.push('- This model does not account for bandwidth costs of block propagation.');
  lines.push('');
  lines.push('## Next Steps');
  lines.push('');
  lines.push('- Feed per-block UTXO growth data from Bitcoin Core (getblockstats → utxo_size_inc)');
  lines.push('- Track ratio over time to identify trends across fee regimes');
  lines.push('- Correlate with BIP-110 signaling data to measure impact of data restrictions');
  lines.push('- Publish as reproducible research note');
  lines.push('');
  lines.push('---');
  lines.push('*Bitcoin Sahi Research — Storage Cost Coverage Ratio*');

  var reportDir = path.resolve(__dirname, '..', '..', 'reports', 'research');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  var dateStr = new Date().toISOString().slice(0, 10);
  var filePath = path.join(reportDir, 'storage-ratio-' + dateStr + '.md');
  fs.writeFileSync(filePath, lines.join('\n'));

  return { filePath: filePath, blocks: feeHistoryRatios.length, avgRatio: feeHistoryRatios.length > 0 ? (feeHistoryRatios.reduce(function(a, b) { return a + b.ratio; }, 0) / feeHistoryRatios.length).toFixed(4) : 'N/A', belowThreshold: feeHistoryRatios.length > 0 ? (feeHistoryRatios.filter(function(r) { return r.ratio < 1; }).length / feeHistoryRatios.length * 100).toFixed(1) + '%' : 'N/A' };
}

if (require.main === module) {
  var result = generateReport();
  console.log('Storage Cost Coverage Ratio Report');
  console.log('  File: ' + result.filePath);
  console.log('  Blocks sampled: ' + result.blocks);
  console.log('  Avg ratio: ' + result.avgRatio);
  console.log('  Below 1.0: ' + result.belowThreshold);
}

module.exports = { generateReport: generateReport, computeRatio: computeRatio, computeFromFeeHistory: computeFromFeeHistory };
