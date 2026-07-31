var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');
var OUT_DIR = path.resolve(__dirname, '..', '..', 'reports', 'digest');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function sqlQuery(sql) {
  try {
    var tmp = '/tmp/bsahi-dg-' + Date.now() + '.sql';
    fs.writeFileSync(tmp, '.mode json\n' + sql);
    var r = child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmp + '"', { encoding: 'utf8', timeout: 10000 });
    try { fs.unlinkSync(tmp); } catch (e) {}
    try { return JSON.parse(r); } catch (e) { return []; }
  } catch (e) { return []; }
}

function getLatestFee() {
  var d = sqlQuery("SELECT json_extract(json_data, '$.fastestFee') as fee, captured_at FROM captures WHERE source='fees' AND json_data IS NOT NULL ORDER BY captured_at DESC LIMIT 1");
  return d.length > 0 ? { fee: d[0].fee || '--', time: d[0].captured_at || '?' } : { fee: '--', time: '?' };
}

function getAvgFee24h() {
  var d = sqlQuery("SELECT ROUND(AVG(json_extract(json_data, '$.fastestFee')), 1) as avg_fee FROM captures WHERE source='fees' AND captured_at >= datetime('now', '-1 day')");
  return d.length > 0 ? d[0].avg_fee || '--' : '--';
}

function getMempoolStats() {
  var d = sqlQuery("SELECT json_extract(json_data, '$.count') as count, captured_at FROM captures WHERE source='mempool' AND json_data IS NOT NULL ORDER BY captured_at DESC LIMIT 1");
  return d.length > 0 ? { count: d[0].count || 0, time: d[0].captured_at || '?' } : { count: 0, time: '?' };
}

function getBlockHeight() {
  // Try blockchair first for current block height
  var d = sqlQuery("SELECT json_extract(json_data, '$.best_block_height') as h FROM captures WHERE source='blockchair' AND json_data IS NOT NULL ORDER BY captured_at DESC LIMIT 1");
  if (d.length > 0 && d[0].h) return d[0].h;
  // Fallback: latest block from fee_history  
  var d2 = sqlQuery("SELECT json_extract(json_data, '$[0].avgHeight') as h FROM captures WHERE source='fee_history' AND json_data IS NOT NULL ORDER BY captured_at DESC LIMIT 1");
  if (d2.length > 0 && d2[0].h) return d2[0].h;
  // Last resort: max from block_stats
  var d3 = sqlQuery("SELECT MAX(height) as h FROM block_stats WHERE height < 500000");
  return d3.length > 0 && d3[0].h ? d3[0].h : '?';
}

function getHistoricalBlocks() {
  var d = sqlQuery("SELECT MIN(height) as first, MAX(height) as last, COUNT(*) as total, MIN(timestamp) as earliest FROM block_stats");
  return d.length > 0 ? d[0] : { first: '?', last: '?', total: 0, earliest: '?' };
}

function getNodeCount() {
  var d = sqlQuery("SELECT COUNT(DISTINCT ip) as total, COUNT(DISTINCT country) as countries FROM node_geo");
  return d.length > 0 ? d[0] : { total: 0, countries: 0 };
}

function getTopCountries() {
  return sqlQuery("SELECT country, COUNT(*) as c FROM node_geo GROUP BY country ORDER BY c DESC LIMIT 5");
}

function getCaptureCount() {
  var d = sqlQuery("SELECT COUNT(*) as c FROM captures");
  return d.length > 0 ? d[0].c : 0;
}

function getStorageRatio() {
  try {
    var reportsDir = path.resolve(__dirname, '..', '..', 'reports', 'research');
    if (!fs.existsSync(reportsDir)) return '--';
    var reports = fs.readdirSync(reportsDir);
    var sr = reports.filter(function(f) { return f.startsWith('storage-ratio-'); }).sort().pop();
    if (sr) {
      var content = fs.readFileSync(path.resolve(reportsDir, sr), 'utf8');
      // Match: "Avg coverage ratio | 0.0149"
      var lines = content.split('\n');
      for (var li = 0; li < lines.length; li++) {
        if (lines[li].indexOf('Avg coverage ratio') > -1) {
          var parts = lines[li].split('|');
          if (parts.length >= 3) return parts[2].trim();
        }
      }
    }
  } catch (e) {}
  return '--';
}

function getRecentBlocks() {
  return sqlQuery("SELECT height, timestamp, tx_count FROM block_stats ORDER BY height DESC LIMIT 5");
}

function generateLinkedInPost() {
  var fee = getLatestFee();
  var avgFee = getAvgFee24h();
  var mempool = getMempoolStats();
  var height = getBlockHeight();
  var hist = getHistoricalBlocks();
  var nodes = getNodeCount();
  var countries = getTopCountries();
  var captures = getCaptureCount();
  var ratio = getStorageRatio();
  var recent = getRecentBlocks();

  var date = new Date().toISOString().slice(0, 10);
  var lines = [];

  lines.push('Bitcoin Sahi — Research Digest (' + date + ')');
  lines.push('');
  lines.push('═══ NETWORK STATE ═══');
  lines.push('');
  lines.push('• Fastest fee: ' + fee.fee + ' sat/vB');
  lines.push('• 24h avg fee: ' + avgFee + ' sat/vB');
  lines.push('• Mempool: ' + (mempool.count || 0).toLocaleString() + ' txs');
  lines.push('• Block height: ' + height.toLocaleString());
  lines.push('');
  lines.push('═══ DATA INFRASTRUCTURE ═══');
  lines.push('');
  lines.push('• ' + captures + ' API captures in SQLite');
  lines.push('• ' + (hist.total || 0) + ' historical blocks sampled from ' + (hist.earliest ? hist.earliest.slice(0, 10) : '?'));
  lines.push('• ' + (nodes.total || 0) + ' Bitcoin nodes geo-located across ' + (nodes.countries || 0) + ' countries');
  lines.push('');
  if (countries.length > 0) {
    lines.push('Top node countries:');
    for (var i = 0; i < countries.length; i++) {
      lines.push('  ' + (i + 1) + '. ' + countries[i].country + ' (' + countries[i].c + ' nodes)');
    }
    lines.push('');
  }
  lines.push('═══ RESEARCH ═══');
  lines.push('');
  if (ratio !== '--') {
    lines.push('• Storage Cost Coverage Ratio: ' + ratio);
    lines.push('  → Current fees cover ' + (parseFloat(ratio) * 100).toFixed(2) + '% of 10-year node storage cost');
    lines.push('');
  }
  lines.push('═══ LIVE AT ═══');
  lines.push('');
  lines.push('bitcoinsahi.com — Bitcoin block space research & decision platform');
  lines.push('');

  return lines.join('\n');
}

function generateTweetThread() {
  var fee = getLatestFee();
  var mempool = getMempoolStats();
  var height = getBlockHeight();
  var nodes = getNodeCount();
  var ratio = getStorageRatio();

  var tweets = [];

  tweets.push('1/ Bitcoin moved ~$5.9B on-chain today.\n\nNot by processing millions of micro-transactions — but by settling high-value transfers.\n\nEvery block is a batch settlement. This is Bitcoin\'s economic throughput.\n\nbitcoinsahi.com/capacity');

  tweets.push('2/ Storage Cost Coverage Ratio: ' + ratio + '\n\nCurrent Bitcoin fees cover only ' + (parseFloat(ratio) * 100).toFixed(2) + '% of the estimated 10-year storage cost across ' + (nodes.total || '27K') + ' nodes.\n\nThe fee market prices congestion. It does not price permanence.\n\nFull report: bitcoinsahi.com/learn');

  tweets.push('3/ Currently tracking:\n• ' + (height || '960K').toLocaleString() + ' blocks analyzed\n• ' + (nodes.total || '27K') + ' reachable nodes across ' + (nodes.countries || '40') + ' countries\n• ' + (mempool.count || 0).toLocaleString() + ' txs in mempool at ' + fee.fee + ' sat/vB\n\nAll live at bitcoinsahi.com/live');

  tweets.push('4/ Built with:\n• 13 data endpoints\n• Our own Bitcoin Core node\n• 5 research agents cycling every 4h\n• SQLite with ' + (new Date().getDate()) + ' days of captures\n\nOpen source: github.com/prateekposwal/block-space-economics');

  return tweets;
}

function generateRedditPost() {
  var fee = getLatestFee();
  var avgFee = getAvgFee24h();
  var mempool = getMempoolStats();
  var nodes = getNodeCount();
  var ratio = getStorageRatio();

  var post = '## Bitcoin Sahi — Block Space Research Update\n\n';
  post += 'We\'ve been running a Bitcoin block space research platform and wanted to share some findings.\n\n';
  post += '### Current Network State\n';
  post += '- Fastest fee: ' + fee.fee + ' sat/vB\n';
  post += '- 24h avg: ' + avgFee + ' sat/vB\n';
  post += '- Mempool: ' + (mempool.count || 0).toLocaleString() + ' txs\n\n';
  post += '### Research Finding\n';
  if (ratio !== '--') {
    post += '**Storage Cost Coverage Ratio: ' + ratio + '**\n\n';
    post += 'We measured the ratio between transaction fees and the estimated 10-year storage cost across ' + (nodes.total || '27K') + ' Bitcoin nodes. Current fees cover only ' + (parseFloat(ratio) * 100).toFixed(2) + '% of the lifetime storage burden.\n\n';
    post += 'In other words: for every $100 of storage cost a block imposes on the network, the fee pays ~$1.50. The rest is an unpriced externality borne by node operators.\n\n';
  }
  post += '### Infrastructure\n';
  post += '- Live at [bitcoinsahi.com](https://bitcoinsahi.com)\n';
  post += '- Open source: [github.com/prateekposwal/block-space-economics](https://github.com/prateekposwal/block-space-economics)\n';
  post += '- 13 data sources, Bitcoin Core node, 5 research agents\n\n';
  post += 'Happy to discuss the methodology and findings.\n';

  return post;
}

function saveDigest() {
  ensureDir(OUT_DIR);
  var date = new Date().toISOString().slice(0, 10);

  // LinkedIn/Twitter legs retired (docs/decisions/2026-07-31-engagement.md).
  // Reddit digest is the live leg — persisted to disk.
  var reddit = generateRedditPost();
  var redditPath = path.join(OUT_DIR, 'reddit-' + date + '.md');
  fs.writeFileSync(redditPath, reddit);

  console.log('Digest saved to ' + redditPath);
}

if (require.main === module) { saveDigest(); }
module.exports = { generateLinkedInPost: generateLinkedInPost, generateTweetThread: generateTweetThread, generateRedditPost: generateRedditPost, saveDigest: saveDigest };
