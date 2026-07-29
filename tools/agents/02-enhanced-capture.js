var https = require('https');
var fs = require('fs');
var path = require('path');

var ENDPOINTS = [
  { key: 'fees',            url: 'https://mempool.space/api/v1/fees/recommended' },
  { key: 'btc_price',       url: 'https://mempool.space/api/v1/prices' },
  { key: 'mempool',         url: 'https://mempool.space/api/mempool' },
  { key: 'mempool_blocks',  url: 'https://mempool.space/api/v1/fees/mempool-blocks' },
  { key: 'fee_history',     url: 'https://mempool.space/api/v1/mining/blocks/fees/24h' },
  { key: 'lightning',       url: 'https://mempool.space/api/v1/lightning/statistics/latest' },
  { key: 'blocks',          url: 'https://mempool.space/api/blocks?limit=10' },
  { key: 'block_height',    url: 'https://blockstream.info/api/blocks/tip/height' }
];

var ENHANCED_ENDPOINTS = [
  {
    key: 'fee_histogram_detail',
    url: 'https://mempool.space/api/mempool',
    description: 'Full mempool fee distribution histogram for fee pressure analysis'
  },
  {
    key: 'blocks_detail',
    url: 'https://mempool.space/api/v1/mining/blocks/fees/24h',
    description: 'Detailed per-block fee data for trend analysis (144 blocks)'
  },
  {
    key: 'block_heights',
    url: 'https://mempool.space/api/blocks?limit=5',
    description: 'Last 5 blocks with timestamps for block interval computation'
  },
  {
    key: 'mempool_recent_txids',
    url: 'https://mempool.space/api/mempool/recent',
    description: 'Recently confirmed transactions for activity analysis'
  },
  {
    key: 'network_stats',
    url: 'https://mempool.space/api/v1/mining/pools/weekly',
    description: 'Weekly mining pool distribution for network health'
  }
];

var allEndpoints = ENDPOINTS.concat(ENHANCED_ENDPOINTS);

function fetchSingle(ep) {
  return new Promise(function (resolve) {
    var u = new URL(ep.url);
    var opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      timeout: 15000,
      headers: { 'User-Agent': 'BitcoinSahi/2.0-enhanced' }
    };

    var req = https.request(opts, function (res) {
      var body = '';
      res.on('data', function (c) { body += c; });
      res.on('end', function () {
        try {
          resolve({
            key: ep.key,
            status: res.statusCode,
            data: JSON.parse(body),
            fetchedAt: new Date().toISOString()
          });
        } catch (e) {
          resolve({
            key: ep.key,
            status: res.statusCode,
            data: body,
            fetchedAt: new Date().toISOString()
          });
        }
      });
    });

    req.on('error', function (e) {
      resolve({
        key: ep.key,
        status: 0,
        error: e.message,
        fetchedAt: new Date().toISOString()
      });
    });

    req.on('timeout', function () {
      req.destroy();
      resolve({
        key: ep.key,
        status: 0,
        error: 'timeout',
        fetchedAt: new Date().toISOString()
      });
    });

    req.end();
  });
}

function computeDerived(allData) {
  var fees = allData.fees ? allData.fees.data : {};
  var mempool = allData.mempool ? allData.mempool.data : {};
  var mempoolCount = mempool.count || mempool.mempoolTxCount || 0;

  var fastestFee = fees.fastestFee || 0;
  var economyFee = fees.economyFee || fees.minimumFee || 0;

  var derived = {
    mempoolTxPerSecond: mempoolCount / (24 * 60 * 60),
    feeSpread: fastestFee - economyFee,
    feePremium: economyFee > 0 ? fastestFee / economyFee : 0,
    blockTimeEstimate: 600,
    totalEndpointCount: allEndpoints.length,
    successfulEndpointCount: 0,
    erroredEndpointCount: 0
  };

  var blockHeights = allData.block_heights ? allData.block_heights.data : null;
  if (blockHeights && Array.isArray(blockHeights) && blockHeights.length >= 2) {
    var ts0 = new Date(blockHeights[0].timestamp || blockHeights[0].time || 0).getTime();
    var ts1 = new Date(blockHeights[blockHeights.length - 1].timestamp || blockHeights[blockHeights.length - 1].time || 0).getTime();
    if (ts0 > 0 && ts1 > 0 && ts0 !== ts1) {
      var diffMs = Math.abs(ts0 - ts1);
      var intervalSec = diffMs / 1000 / (blockHeights.length - 1);
      derived.blockTimeEstimate = Math.round(intervalSec);
    }
  }

  return derived;
}

function captureEnhanced() {
  var startTime = Date.now();
  var results = {};
  var errors = [];

  var fetchers = allEndpoints.map(function (ep) {
    return fetchSingle(ep).then(function (res) {
      results[res.key] = {
        status: res.status,
        data: res.data,
        fetchedAt: res.fetchedAt
      };
      if (res.error) {
        errors.push(res.key + ': ' + res.error);
      }
    });
  });

  return Promise.all(fetchers).then(function () {
    var derived = computeDerived(results);

    var successCount = 0;
    var errorCount = 0;
    for (var k in results) {
      if (results[k].status >= 200 && results[k].status < 300) successCount++;
      else errorCount++;
    }
    derived.successfulEndpointCount = successCount;
    derived.erroredEndpointCount = errorCount;

    var now = new Date();
    var dateStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    var ts = dateStr + '_' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0');

    var outDir = path.join(__dirname, '..', '..', 'captured-data', 'enhanced', dateStr);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    var payload = {
      captureTime: now.toISOString(),
      captureDurationMs: Date.now() - startTime,
      endpointCount: allEndpoints.length,
      results: results,
      derived: derived,
      errors: errors.length > 0 ? errors : undefined
    };

    var raw = JSON.stringify(payload, null, 2);
    var payloadBytes = Buffer.byteLength(raw, 'utf8');

    payload._metadata = {
      totalPayloadBytes: payloadBytes,
      totalPayloadKB: (payloadBytes / 1024).toFixed(2),
      basicEndpointCount: ENDPOINTS.length,
      enhancedEndpointCount: ENHANCED_ENDPOINTS.length
    };

    raw = JSON.stringify(payload, null, 2);
    payloadBytes = Buffer.byteLength(raw, 'utf8');

    var filePath = path.join(outDir, ts + '.json');
    fs.writeFileSync(filePath, raw);

    console.log('Enhanced capture complete:');
    console.log('  File: ' + filePath);
    console.log('  Endpoints: ' + successCount + '/' + allEndpoints.length + ' successful');
    console.log('  Payload: ' + (payloadBytes / 1024).toFixed(2) + ' KB');
    console.log('  Duration: ' + payload.captureDurationMs + ' ms');
    if (errors.length > 0) {
      console.log('  Errors: ' + errors.join(', '));
    }

    return payload;
  });
}

if (require.main === module) {
  captureEnhanced().catch(function (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { captureEnhanced: captureEnhanced, ENDPOINTS: ENDPOINTS, ENHANCED_ENDPOINTS: ENHANCED_ENDPOINTS };
