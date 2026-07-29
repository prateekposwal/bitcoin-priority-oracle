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

function parseGitHubReleases(html) {
  var releases = [];
  var re = /href="\/bitcoin\/bitcoin\/releases\/tag\/v([^"]+)"/g;
  var m;
  while ((m = re.exec(html)) !== null) releases.push(m[1]);
  return releases.slice(0, 5);
}

function parseDelvingPosts(html) {
  var posts = [];
  var re = /<a\s+href="\/t\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  var m;
  while ((m = re.exec(html)) !== null) posts.push({ title: m[2], url: 'https://delvingbitcoin.org/t/' + m[1] });
  return posts.slice(0, 5);
}

async function run() {
  var findings = [];

  var gh = await fetch('https://github.com/bitcoin/bitcoin/releases');
  if (gh.ok) {
    var releases = parseGitHubReleases(gh.body);
    if (releases.length > 0) findings.push('Recent releases: ' + releases.join(', '));
  }

  var bips = await fetch('https://github.com/bitcoin/bips');
  if (bips.ok) {
    var bipMatch = bips.body.match(/bip-\d+/gi);
    var recentBips = bipMatch ? bipMatch.slice(0, 5).join(', ') : 'none found';
    findings.push('Active BIP discussions in repo');
  }

  var delving = await fetch('https://delvingbitcoin.org/');
  if (delving.ok) {
    var posts = parseDelvingPosts(delving.body);
    if (posts.length > 0) {
      findings.push('Delving Bitcoin posts: ' + posts.map(function(p) { return p.title; }).slice(0, 3).join(' | '));
    }
  }

  var optech = await fetch('https://bitcoinops.org/en/newsletters/');
  if (optech.ok) {
    findings.push('Bitcoin Optech newsletters available');
  }

  return { agent: 'Bitcoin Core & Protocol', findings: findings.length > 0 ? findings : ['No new findings this cycle'], timestamp: new Date().toISOString() };
}

module.exports = { run: run };
