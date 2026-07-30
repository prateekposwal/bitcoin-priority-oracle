var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');
var STATE_FILE = path.resolve(__dirname, '..', '..', 'captured-data', 'node-geo-state.json');
var RPC_ARGS = '-rpcuser=bsahi -rpcpassword=bsahi';
var BITCOIN_CLI = process.env.HOME + '/.local/bin/bitcoin-cli';
var GEO_DELAY = 150;
var MAX_SAMPLE = 1000;

var state = { totalGeoLocated: 0, countries: {}, lastRun: null };

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {}
}

function saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch (e) {}
}

function sqlQuery(sql) {
  try {
    var tmp = '/tmp/bsahi-geo-q-' + Date.now() + '.sql';
    fs.writeFileSync(tmp, '.mode json\n' + sql);
    var r = child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmp + '"', { encoding: 'utf8', timeout: 10000 });
    try { fs.unlinkSync(tmp); } catch (e) {}
    try { return JSON.parse(r); } catch (e) { return []; }
  } catch (e) { return []; }
}

function sqlExec(sql) {
  try {
    var tmp = '/tmp/bsahi-geo-' + Date.now() + '.sql';
    fs.writeFileSync(tmp, sql);
    child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmp + '"', { encoding: 'utf8', timeout: 10000 });
    try { fs.unlinkSync(tmp); } catch (e) {}
  } catch (e) {}
}

function bitcoinCli(method, params) {
  try {
    var cmd = BITCOIN_CLI + ' ' + RPC_ARGS + ' ' + method;
    if (params) cmd += ' ' + params;
    return JSON.parse(child_process.execSync(cmd, { encoding: 'utf8', timeout: 15000, shell: '/bin/zsh', maxBuffer: 10 * 1024 * 1024 }));
  } catch (e) { console.error('bitcoinCli error:', e.message); return null; }
}

function fetchGeo(ip) {
  return new Promise(function(resolve) {
    try {
      var req = http.get('http://ip-api.com/json/' + ip + '?fields=query,country,countryCode,city,isp,lat,lon', function(res) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() {
          try { resolve(JSON.parse(body)); }
          catch (e) { resolve(null); }
        });
      });
      req.on('error', function() { resolve(null); });
      req.setTimeout(3000, function() { req.destroy(); resolve(null); });
      req.end();
    } catch (e) { resolve(null); }
  });
}

function sleep(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }

async function run() {
  loadState();
  console.log('═══ Node Geo-Location Agent ═══');

  var addresses = bitcoinCli('getnodeaddresses', '0');
  if (!addresses || !Array.isArray(addresses)) {
    console.log('Bitcoin Core offline or no addresses');
    return;
  }

  // Filter to IPv4 and shuffle for representative sample
  var ipv4 = [];
  var seen = {};
  for (var i = 0; i < addresses.length; i++) {
    var addr = addresses[i].address || '';
    if (addr.indexOf(':') === -1 && addr.indexOf('.') > -1 && !seen[addr]) {
      ipv4.push(addr);
      seen[addr] = true;
    }
  }

  console.log('Known nodes: ' + addresses.length + ' (' + ipv4.length + ' IPv4)');

  // Shuffle
  for (var i = ipv4.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = ipv4[i]; ipv4[i] = ipv4[j]; ipv4[j] = tmp;
  }

  var toSample = Math.min(MAX_SAMPLE, ipv4.length);
  var geoLocated = 0;

  sqlExec("CREATE TABLE IF NOT EXISTS node_geo (ip TEXT PRIMARY KEY, country TEXT, country_code TEXT, city TEXT, isp TEXT, lat REAL, lon REAL, captured_at TEXT DEFAULT (datetime('now')))");

  for (var i = 0; i < toSample; i++) {
    var ip = ipv4[i];
    await sleep(GEO_DELAY);
    var geo = await fetchGeo(ip);
    if (geo && geo.country) {
      sqlExec("INSERT OR REPLACE INTO node_geo (ip, country, country_code, city, isp, lat, lon) VALUES ('" + ip.replace(/'/g,"''") + "','" + geo.country.replace(/'/g,"''") + "','" + (geo.countryCode||'').replace(/'/g,"''") + "','" + (geo.city||'').replace(/'/g,"''") + "','" + (geo.isp||'').replace(/'/g,"''") + "'," + (geo.lat||0) + "," + (geo.lon||0) + ")");
      state.countries[geo.country] = (state.countries[geo.country] || 0) + 1;
      geoLocated++;
      state.totalGeoLocated++;
    }
    if (i % 50 === 0 && i > 0) {
      saveState();
      console.log('  ' + i + '/' + toSample + ' (' + geoLocated + ' geo-located)');
    }
  }

  state.lastRun = Date.now();
  saveState();
  console.log('Done: ' + geoLocated + ' nodes geo-located across ' + Object.keys(state.countries).length + ' countries');
}

function getCountryDistribution() {
  var data = sqlQuery("SELECT country, COUNT(*) as c FROM node_geo GROUP BY country ORDER BY c DESC");
  return data;
}

if (require.main === module) { run().catch(function(e) { console.log('Error:', e.message); }); }
module.exports = { run: run, getCountryDistribution: getCountryDistribution };
