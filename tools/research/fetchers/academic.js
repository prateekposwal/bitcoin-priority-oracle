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

function extractArxivTitles(html) {
  var titles = [];
  var re = /<span class="title mathjax">([^<]+)<\/span>/g;
  var m;
  while ((m = re.exec(html)) !== null) titles.push(m[1].trim());
  return titles.slice(0, 5);
}

function extractScholarTitles(html) {
  var titles = [];
  var re = /<h3[^>]*><a[^>]*>([^<]+)<\/a><\/h3>/g;
  var m;
  while ((m = re.exec(html)) !== null) titles.push(m[1].trim());
  return titles.slice(0, 5);
}

async function run() {
  var findings = [];

  var arxiv = await fetch('https://arxiv.org/search/?searchtype=all&query=bitcoin+fee+market&start=0');
  if (arxiv.ok) {
    var titles = extractArxivTitles(arxiv.body);
    if (titles.length > 0) {
      findings.push('arXiv papers on Bitcoin fee markets: ' + titles.slice(0, 2).join(' | '));
    }
  }

  var arxiv2 = await fetch('https://arxiv.org/search/?searchtype=all&query=blockchain+storage+cost&start=0');
  if (arxiv2.ok) {
    var titles2 = extractArxivTitles(arxiv2.body);
    if (titles2.length > 0) {
      findings.push('arXiv papers on blockchain storage: ' + titles2.slice(0, 2).join(' | '));
    }
  }

  var arxiv3 = await fetch('https://arxiv.org/search/?searchtype=all&query=UTXO+externality&start=0');
  if (arxiv3.ok) {
    var titles3 = extractArxivTitles(arxiv3.body);
    if (titles3.length > 0) {
      findings.push('arXiv papers on UTXO externalities: ' + titles3.slice(0, 2).join(' | '));
    }
  }

  return { agent: 'Academic Research', findings: findings.length > 0 ? findings : ['No new papers found this cycle'], timestamp: new Date().toISOString() };
}

module.exports = { run: run };
