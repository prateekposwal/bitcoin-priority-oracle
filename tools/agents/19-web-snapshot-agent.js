#!/usr/bin/env node
// BSAHI — 19 Web Snapshot Agent
// Generates the public snapshot for the GH-Actions tier from the local spool +
// tools data (richer than the runner-safe fallback). Writes docs/data/*.json,
// optionally auto-commits via plain git. Runs 30-min via launchd.
var path = require('path');
var fs = require('fs');
var { exec } = require('child_process');

var REPO = path.resolve(__dirname, '..', '..');
var DATA_DIR = path.join(REPO, 'data');
var STATE_FILE = path.join(REPO, 'captured-data', 'web-snapshot-state.json');

function loadJson(p, fb) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fb; } }
function sha1(s) { return require('crypto').createHash('sha1').update(s).digest('hex'); }

function writeOnChange(name, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  var p = path.join(DATA_DIR, name);
  var blob = JSON.stringify(data, null, 2) + '\n';
  var changed = true;
  if (fs.existsSync(p)) {
    try { changed = sha1(fs.readFileSync(p, 'utf8')) !== sha1(blob); } catch (e) {}
  }
  if (changed) fs.writeFileSync(p, blob);
  return changed;
}

function run() {
  // Forecast (spool-backed)
  var fc = loadJson(path.join(REPO, 'tools', 'fee_forecast.json'), null);
  // Alerts
  var alerts = loadJson(path.join(REPO, 'tools', 'alerts.json'), { alerts: [] });
  // Fee history from spool index
  var history = [];
  var idxDir = path.join(REPO, 'captured-data', 'spool', 'index', 'fees');
  if (fs.existsSync(idxDir)) {
    fs.readdirSync(idxDir).filter(function(f) { return f.endsWith('.jsonl'); }).sort().slice(-7).forEach(function(day) {
      fs.readFileSync(path.join(idxDir, day), 'utf8').split('\n').forEach(function(line) {
        if (!line.trim()) return;
        try {
          var rec = JSON.parse(line);
          var data = (rec.payload || {}).data;
          if (data && data.fastestFee !== undefined) {
            history.push({ date: rec.captureTime ? rec.captureTime.slice(0, 10) : null, fastestFee: data.fastestFee });
          }
        } catch (e) {}
      });
    });
  }
  // Posts count
  var postLog = loadJson(path.join(REPO, 'captured-data', 'post-log.json'), { posts: [] });

  // Live price / height / mempool from the latest data-engine mirror (the local
  // capture agent has them; previously hardcoded null meant the public snapshot
  // served empty price/height on the rich path).
  var latestMirror = loadJson(path.join(REPO, 'captured-data', 'latest.json'), null);
  var mirror = {};
  try {
    var capDir = path.join(REPO, 'captured-data');
    var files = fs.existsSync(capDir) ? fs.readdirSync(capDir).filter(function(f) { return /^\d{4}-\d{2}-\d{2}_/.test(f) && f.endsWith('.json'); }).sort() : [];
    if (files.length) mirror = loadJson(path.join(capDir, files[files.length - 1]), {});
  } catch (e) {}
  var ep = mirror.endpoints || {};
  function epData(key) { return (ep[key] && ep[key].data) || null; }
  var price = epData('btc_price');
  var height = epData('block_height');
  var mempool = epData('mempool');

  var snapshot = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    freshness_min: 0,
    fees: fc && fc.latest_fastest_fee !== undefined ? { fastestFee: fc.latest_fastest_fee } : {},
    btc_price: (price && price.USD) || null,
    block_height: (typeof height === 'object') ? (height.block_height !== undefined ? height.block_height : (height.height !== undefined ? height.height : null)) : height,
    mempool_tx: (mempool && mempool.count) || null,
    forecast: fc ? fc.forecast : [],
    alerts: (alerts && alerts.alerts) || [],
    history: history,
    totalPosts: (postLog.posts || []).length
  };

  writeOnChange('snapshot.json', snapshot);
  writeOnChange('latest.json', { latest: '/data/snapshot.json', generated_at: snapshot.generated_at });
  if (fc) writeOnChange('fee_forecast.json', fc);
  writeOnChange('alerts.json', alerts);
  if (history.length) writeOnChange('fee_history.json', history);

  // Live SCCR dashboard + static API files (/sccr/latest, /sccr/history).
  // Runs the python live writer; its outputs are read below so they ship with
  // this snapshot commit even if the writer writes before we copy.
  try {
    exec('python3 tools/research/sccr_live.py', { cwd: REPO, timeout: 30000 }, function (err, so, se) {
      if (err) { console.error('sccr_live failed:', (se || '').slice(0, 200)); return; }
      ['sccr.json', 'sccr_latest.json', 'sccr_history.json'].forEach(function (f) {
        var d = loadJson(path.join(DATA_DIR, f), null);
        if (d) writeOnChange(f, d);
      });
    });
  } catch (e) { console.error('sccr_live exec error:', e.message); }

  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastRun: new Date().toISOString(), historyPoints: history.length, posts: snapshot.totalPosts }, null, 2));

  // Optional auto-commit — BLOCKING execSync so process.exit(0) cannot kill the child.
  if (process.argv.indexOf('--commit') !== -1) {
    try {
      require('child_process').execSync(
        'git add data/ && git diff --cached --quiet || (git -c user.name="bsahi-snapshot-bot" -c user.email="snapshot@bitcoinsahi.com" commit -m "chore: public snapshot ' + new Date().toISOString().slice(0, 16) + '" && git pull --rebase --autostash origin main && git push)',
        { cwd: REPO, timeout: 120000, stdio: 'inherit' }
      );
    } catch (e) {
      console.error('snapshot commit failed:', e.message);
    }
  }
  if (require.main === module) console.log('web-snapshot: ' + history.length + ' history pts, ' + snapshot.totalPosts + ' posts');
  return snapshot;
}

if (require.main === module) { run(); process.exit(0); }
module.exports = { run: run, writeOnChange: writeOnChange };
