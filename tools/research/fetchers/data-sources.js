var https = require('https');

function fetch(url) {
  return new Promise(function(resolve) {
    try {
      var u = new URL(url);
      var opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', timeout: 10000, headers: { 'User-Agent': 'BitcoinSahiResearch/1.0' } };
      var req = https.request(opts, function(res) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() { resolve({ ok: res.statusCode < 400, status: res.statusCode, body: body }); });
      });
      req.on('error', function() { resolve({ ok: false, body: '' }); });
      req.on('timeout', function() { req.destroy(); resolve({ ok: false, body: '' }); });
      req.end();
    } catch (e) { resolve({ ok: false, body: '' }); }
  });
}

async function run() {
  var findings = [];

  var sources = [
    { name: 'mempool.space fees', url: 'https://mempool.space/api/v1/fees/recommended' },
    { name: 'mempool.space prices', url: 'https://mempool.space/api/v1/prices' },
    { name: 'blockstream height', url: 'https://blockstream.info/api/blocks/tip/height' },
    { name: 'blockchair stats', url: 'https://api.blockchair.com/bitcoin/stats' },
  ];

  var okCount = 0;
  for (var i = 0; i < sources.length; i++) {
    var result = await fetch(sources[i].url);
    if (result.ok) okCount++;
  }

  findings.push('Data source health: ' + okCount + '/' + sources.length + ' endpoints responding');

  var mempoolBlocks = await fetch('https://mempool.space/api/v1/fees/mempool-blocks');
  if (mempoolBlocks.ok) {
    try {
      var blocks = JSON.parse(mempoolBlocks.body);
      findings.push('Mempool blocks: ' + blocks.length + ' blocks in queue');
      if (blocks.length > 0) {
        var last = blocks[blocks.length - 1];
        findings.push('Last mempool block fee range: ' + (last.range ? last.range[0] + '-' + last.range[1] : 'N/A') + ' sat/vB');
      }
    } catch (e) {}
  }

  var diffAdjust = await fetch('https://mempool.space/api/v1/difficulty-adjustment');
  if (diffAdjust.ok) {
    try {
      var diff = JSON.parse(diffAdjust.body);
      if (diff.difficultyChange) findings.push('Difficulty adjustment: ' + diff.difficultyChange.toFixed(1) + '%');
      if (diff.remainingBlocks) findings.push('Blocks until next adjustment: ' + diff.remainingBlocks);
    } catch (e) {}
  }

  return { agent: 'APIs & Data Sources', findings: findings.length > 0 ? findings : ['No new findings this cycle'], timestamp: new Date().toISOString() };
}

module.exports = { run: run };
