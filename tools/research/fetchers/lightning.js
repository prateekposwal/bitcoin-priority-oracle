var https = require('https');

function fetch(url) {
  return new Promise(function(resolve) {
    try {
      var u = new URL(url);
      var opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', timeout: 15000, headers: { 'User-Agent': 'BitcoinSahiResearch/1.0' } };
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

  var lnd = await fetch('https://github.com/lightningnetwork/lnd/releases');
  if (lnd.ok && lnd.body.indexOf('v0.') > -1) {
    var re = /href="\/lightningnetwork\/lnd\/releases\/tag\/([^"]+)"/g;
    var m = re.exec(lnd.body);
    findings.push(m ? 'LND latest: ' + m[1] : 'LND releases available');
  }

  var cln = await fetch('https://github.com/ElementsProject/lightning/releases');
  if (cln.ok) {
    var re = /href="\/ElementsProject\/lightning\/releases\/tag\/([^"]+)"/g;
    var m = re.exec(cln.body);
    findings.push(m ? 'CLN latest: ' + m[1] : 'CLN releases available');
  }

  var mempoolLn = await fetch('https://mempool.space/api/v1/lightning/statistics/latest');
  if (mempoolLn.ok) {
    try {
      var data = JSON.parse(mempoolLn.body);
      var s = data.latest || data;
      findings.push('LN Network: ' + (s.node_count || '?') + ' nodes, ' + (s.channel_count || '?') + ' channels, ' + ((s.total_capacity || 0) / 100000000).toFixed(1) + ' BTC capacity');
    } catch (e) {}
  }

  var delving = await fetch('https://delvingbitcoin.org/c/lightning/');
  if (delving.ok) {
    findings.push('Delving Bitcoin Lightning discussions active');
  }

  return { agent: 'Lightning Network', findings: findings.length > 0 ? findings : ['No new findings this cycle'], timestamp: new Date().toISOString() };
}

module.exports = { run: run };
