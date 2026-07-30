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
  { key: 'block_height',    url: 'https://blockstream.info/api/blocks/tip/height' },
  { key: 'coinpaprika',     url: 'https://api.coinpaprika.com/v1/coins/btc-bitcoin' },
  { key: 'fear_greed',      url: 'https://api.alternative.me/fng/' },
  { key: 'blockchair',      url: 'https://api.blockchair.com/bitcoin/stats' },
  { key: 'mining_pools',    url: 'https://mempool.space/api/v1/mining/pools/weekly' },
  { key: 'difficulty',      url: 'https://mempool.space/api/v1/difficulty-adjustment' }
];

var results = {};
var remaining = ENDPOINTS.length;
var errors = [];

function fetchEndpoint(ep) {
  var u = new URL(ep.url);
  var opts = {
    hostname: u.hostname,
    path: u.pathname + u.search,
    method: 'GET',
    timeout: 15000,
    headers: { 'User-Agent': 'BitcoinSahi/1.0' }
  };

  var req = https.request(opts, function(res) {
    var body = '';
    res.on('data', function(c) { body += c; });
    res.on('end', function() {
      try {
        results[ep.key] = { status: res.statusCode, data: JSON.parse(body), fetchedAt: new Date().toISOString() };
      } catch (e) {
        results[ep.key] = { status: res.statusCode, data: body, fetchedAt: new Date().toISOString() };
      }
      done();
    });
  });

  req.on('error', function(e) {
    errors.push(ep.key + ': ' + e.message);
    results[ep.key] = { status: 0, error: e.message, fetchedAt: new Date().toISOString() };
    done();
  });

  req.on('timeout', function() {
    req.destroy();
    errors.push(ep.key + ': timeout');
    results[ep.key] = { status: 0, error: 'timeout', fetchedAt: new Date().toISOString() };
    done();
  });

  req.end();
}

function done() {
  remaining--;
  if (remaining > 0) return;
  writeResults();
}

function writeResults() {
  var now = new Date();
  var ts = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') + '-' +
    String(now.getMinutes()).padStart(2, '0') + '-' +
    String(now.getSeconds()).padStart(2, '0');

  var outDir = path.join(__dirname, '..', 'captured-data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  var payload = {
    captureTime: now.toISOString(),
    endpoints: results,
    errors: errors.length > 0 ? errors : undefined
  };

  var filePath = path.join(outDir, ts + '.json');
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  console.log('Captured ' + Object.keys(results).length + '/' + ENDPOINTS.length + ' endpoints to ' + filePath);
  if (errors.length > 0) console.log('Errors: ' + errors.join(', '));
}

ENDPOINTS.forEach(fetchEndpoint);
