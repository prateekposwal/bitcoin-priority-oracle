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

  var ghBitcoin = await fetch('https://api.github.com/search/repositories?q=bitcoin+blockchain&sort=stars&per_page=5');
  if (ghBitcoin.ok) {
    try {
      var data = JSON.parse(ghBitcoin.body);
      if (data.items) {
        var repos = data.items.slice(0, 3).map(function(r) { return r.full_name; });
        findings.push('Trending Bitcoin repos: ' + repos.join(', '));
      }
    } catch (e) {}
  }

  var defillama = await fetch('https://api.llama.fi/charts/Bitcoin');
  if (defillama.ok) {
    try {
      var data = JSON.parse(defillama.body);
      findings.push('DeFiLlama Bitcoin data: ' + (data.length || 0) + ' data points');
    } catch (e) {}
  }

  var coinGecko = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
  if (coinGecko.ok) {
    try {
      var data = JSON.parse(coinGecko.body);
      if (data.bitcoin) {
        findings.push('BTC: $' + (data.bitcoin.usd || '?').toLocaleString() + ' (24h: ' + (data.bitcoin.usd_24h_change || 0).toFixed(2) + '%)');
      }
    } catch (e) {}
  }

  return { agent: 'Blockchain General', findings: findings.length > 0 ? findings : ['No new findings this cycle'], timestamp: new Date().toISOString() };
}

module.exports = { run: run };
