#!/usr/bin/env node
// BSAHI — 13 Alert Dispatcher
// Runs fee forecast + threshold alerts from spool history; self-heals a missing
// index by rebuilding from SQLite. Replaces the raw execFile calls in agent.js
// Step 7b (after compact). Alerts delivered via webhook_config.json.
var path = require('path');
var fs = require('fs');
var { exec } = require('child_process');

var REPO = path.resolve(__dirname, '..', '..');
var STATE_FILE = path.join(REPO, 'captured-data', 'alert-dispatcher-state.json');

function log(msg) {
  var line = '[' + new Date().toISOString().replace('T', ' ').slice(0, 19) + '] [alert-dispatcher] ' + msg;
  console.log(line);
  try { fs.appendFileSync(path.join(REPO, 'captured-data', 'de-server.log'), line + '\n'); } catch (e) {}
}

function indexExists(source) {
  var dir = path.join(REPO, 'captured-data', 'spool', 'index', source);
  return fs.existsSync(dir) && fs.readdirSync(dir).some(function(f) { return f.endsWith('.jsonl'); });
}

function run() {
  var spoolStats = null;
  return require('../data-engineering/spool.js').init().then(function(spool) { return spool.stats(); }).then(function(st) {
    spoolStats = st;
    // Self-heal: if fees index missing but SQLite has rows, rebuild
    if (!indexExists('fees')) {
      try {
        var db = require('../db/init.js');
        var count = db.query("SELECT COUNT(*) AS c FROM captures WHERE source = 'fees'");
        var n = count && count[0] ? count[0].c : 0;
        if (n > 0) {
          log('fees index missing but SQLite has ' + n + ' rows — rebuilding index');
          exec('node ' + path.join(__dirname, 'spool-cli.js') + ' rebuild-index', { cwd: REPO, timeout: 120000, maxBuffer: 64 * 1024 * 1024 }, function(err, stdout) {
            if (stdout) log(stdout.trim().split('\n').pop());
            if (err) log('rebuild-index error: ' + err.message.slice(0, 80));
          });
        }
      } catch (e) { log('self-heal check error: ' + e.message); }
    }
    return st;
  }).then(function() {
    // Run forecast + alerts (read index, now preserved by compact)
    return new Promise(function(resolve) {
      exec('python3 ' + path.join(REPO, 'tools', 'fee_forecast.py'), { cwd: REPO, timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, function() {
        exec('python3 ' + path.join(REPO, 'tools', 'alert_webhook.py') + ' --spool', { cwd: REPO, timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, function() {
          resolve();
        });
      });
    });
  }).then(function() {
    var state = { lastRun: new Date().toISOString(), spoolAccountingOk: spoolStats ? spoolStats.accountingOk : null, pending: spoolStats ? spoolStats.totals.pending : null };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    log('cycle complete');
  });
}

if (require.main === module) {
  run().then(function() { process.exit(0); }).catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { run: run };
