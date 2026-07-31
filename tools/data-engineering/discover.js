var https = require('https');
var fs = require('fs');
var path = require('path');

var discoveredCache = null;

// Discovery allowlist (S3/flagged fix): only known-good Bitcoin data sources may
// stage. Blocks junk github-repos and random blogs from polluting staging/.
var ALLOWED_HOSTS = [
  'mempool.space', 'blockstream.info', 'blockchain.info', 'api.coingecko.com',
  'api.coindesk.com', 'bitcoinvisuals.com', '1ml.com', 'bitnodes.io', 'lnbits.com',
  'chain.api.btc.com', 'api.coinpaprika.com', 'api.alternative.me', 'api.blockchair.com',
  'bitcoinops.org', 'delvingbitcoin.org'
];
var MIN_CONFIDENCE = 0.7;

function isStageable(d) {
  if (!d || typeof d !== 'object') return false;
  if (d.type !== 'api') return false;
  if (!(d.confidence >= MIN_CONFIDENCE)) return false;
  try { return ALLOWED_HOSTS.indexOf(new URL(d.url).hostname) !== -1; } catch (e) { return false; }
}

var KNOWN_ENDPOINTS = [
  { name: 'Mempool Space', url: 'https://mempool.space/api/', type: 'api', category: 'general' },
  { name: 'Blockstream', url: 'https://blockstream.info/api/', type: 'api', category: 'general' },
  { name: 'Blockchain Info', url: 'https://blockchain.info/', type: 'api', category: 'general' },
  { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/', type: 'api', category: 'price' },
  { name: 'CoinDesk', url: 'https://api.coindesk.com/v1/', type: 'api', category: 'price' },
  { name: 'BitcoinVisuals', url: 'https://bitcoinvisuals.com/api/', type: 'api', category: 'lightning' },
  { name: '1ML', url: 'https://1ml.com/', type: 'api', category: 'lightning' },
  { name: 'Bitnodes', url: 'https://bitnodes.io/api/', type: 'api', category: 'network' },
  { name: 'LNBits', url: 'https://lnbits.com/api/', type: 'api', category: 'lightning' },
  { name: 'BTC.com', url: 'https://chain.api.btc.com/v3/', type: 'api', category: 'blocks' },
];

function fetch(url, timeout) {
  return new Promise(function(resolve) {
    timeout = timeout || 10000;
    try {
      var u = new URL(url);
      var opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', timeout: timeout, headers: { 'User-Agent': 'BitcoinSahiDataEngine/1.0' } };
      var start = Date.now();
      var req = https.request(opts, function(res) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, latency: Date.now() - start, body: body, contentType: res.headers['content-type'] || '' });
        });
      });
      req.on('error', function(e) { resolve({ ok: false, status: 0, latency: Date.now() - start, error: e.message }); });
      req.on('timeout', function() { req.destroy(); resolve({ ok: false, status: 0, latency: Date.now() - start, error: 'timeout' }); });
      req.end();
    } catch (e) { resolve({ ok: false, status: 0, latency: 0, error: e.message }); }
  });
}

function searchForNewSources() {
  var discovered = [];
  // GitHub repo search removed (S3/flagged): it produced only junk github-repo
  // entries at confidence 0.5. Discovery is now known-endpoint testing only.
  return checkKnownEndpoints()
    .then(function(knownResults) {
      knownResults.forEach(function(r) { discovered.push(r); });
      discovered = discovered.filter(isStageable);
      discoveredCache = discovered.slice();
      return discovered;
    })
    .catch(function() {
      return checkKnownEndpoints().then(function(knownResults) {
        var filtered = knownResults.filter(isStageable);
        discoveredCache = filtered.slice();
        return filtered;
      });
    });
}

function checkKnownEndpoints() {
  var results = [];
  var tasks = KNOWN_ENDPOINTS.map(function(ep) {
    return testEndpoint(ep.url).then(function(testResult) {
      if (testResult.ok) {
        results.push({
          name: ep.name,
          url: ep.url,
          type: ep.type,
          category: ep.category,
          confidence: Math.min(0.5 + (testResult.latency < 2000 ? 0.3 : 0) + (testResult.sampleSize > 0 ? 0.2 : 0), 1.0),
          description: ep.name + ' API at ' + ep.url,
        });
      }
      return null;
    });
  });
  return Promise.all(tasks).then(function() { return results; });
}

function testEndpoint(url) {
  return fetch(url, 10000).then(function(res) {
    var sampleSize = 0;
    if (res.body && typeof res.body === 'string') {
      sampleSize = Buffer.byteLength(res.body, 'utf-8');
    }
    return {
      ok: res.ok,
      status: res.status,
      latency: res.latency,
      contentType: res.contentType || '',
      sampleSize: sampleSize,
    };
  });
}

function getAllDiscovered() {
  if (discoveredCache) {
    return discoveredCache.slice();
  }
  var staticList = KNOWN_ENDPOINTS.map(function(ep) {
    return { name: ep.name, url: ep.url, type: ep.type, category: ep.category, confidence: 0.0, description: ep.name + ' API at ' + ep.url };
  });
  return staticList.filter(isStageable);
}

function findNewEndpoints(currentEndpoints) {
  var currentUrls = {};
  if (Array.isArray(currentEndpoints)) {
    currentEndpoints.forEach(function(ep) {
      if (ep && ep.url) currentUrls[ep.url.replace(/\/+$/, '')] = true;
      if (ep && ep.key) currentUrls['https://mempool.space/api/v1/' + ep.key] = true;
    });
  }
  var all = getAllDiscovered();
  var newOnes = [];
  all.forEach(function(d) {
    var normalizedUrl = d.url.replace(/\/+$/, '');
    if (!currentUrls[normalizedUrl] && isStageable(d)) {
      newOnes.push(d);
    }
  });
  return newOnes;
}

module.exports = { searchForNewSources: searchForNewSources, testEndpoint: testEndpoint, findNewEndpoints: findNewEndpoints, getAllDiscovered: getAllDiscovered, isStageable: isStageable, ALLOWED_HOSTS: ALLOWED_HOSTS, MIN_CONFIDENCE: MIN_CONFIDENCE };
