#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var spoolMod = require('./spool.js');
var vc = require('./validate-capture.js');

var ROOT = path.join(__dirname, '..', '..', 'captured-data');
var INGESTED_LOG = path.join(ROOT, 'spool', 'ingested.log');
var VIOLATIONS_LOG = path.join(ROOT, 'spool', 'schema-violations.log');
var FILE_RE = /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/;

function resolveOpts(opts) {
  opts = opts || {};
  return {
    root: opts.root || ROOT,
    ingestedLog: opts.ingestedLog || INGESTED_LOG,
    violationsLog: opts.violationsLog || VIOLATIONS_LOG
  };
}

function loadIngested(o) {
  if (!fs.existsSync(o.ingestedLog)) return new Set();
  var out = new Set();
  var raw = fs.readFileSync(o.ingestedLog, 'utf8');
  raw.split('\n').forEach(function(line) {
    if (!line.trim()) return;
    try { out.add(JSON.parse(line).file); } catch (e) {}
  });
  return out;
}

function markIngested(spool, file, entries, o) {
  var rec = { file: file, ingestedAt: new Date().toISOString(), entries: entries };
  fs.appendFileSync(o.ingestedLog, JSON.stringify(rec) + '\n');
}

function scanFiles(o) {
  var out = [];
  var rootFiles = fs.readdirSync(o.root).filter(function(f) { return FILE_RE.test(f); });
  rootFiles.forEach(function(f) { out.push(f); });
  var backfillRoot = path.join(o.root, 'backfill');
  if (fs.existsSync(backfillRoot)) {
    var days = fs.readdirSync(backfillRoot).filter(function(d) { return fs.statSync(path.join(backfillRoot, d)).isDirectory(); });
    days.forEach(function(day) {
      var dayDir = path.join(backfillRoot, day);
      fs.readdirSync(dayDir).filter(function(f) { return FILE_RE.test(f); }).forEach(function(f) {
        out.push(path.join('backfill', day, f));
      });
    });
  }
  return out.sort();
}

function readCapture(rel, o) {
  var full = path.join(o.root, rel);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function ingestOnce(spool, opts) {
  var o = resolveOpts(opts);
  var ingested = loadIngested(o);
  var files = scanFiles(o);
  var pending = files.filter(function(f) { return !ingested.has(f); });
  if (pending.length === 0) return Promise.resolve({ scanned: files.length, ingested: 0, newFiles: 0, failed: [], validated: 0, violated: 0, quarantined: 0 });

  var results = { scanned: files.length, ingested: 0, newFiles: pending.length, failed: [], validated: 0, violated: 0, quarantined: 0 };

  function next() {
    if (pending.length === 0) return Promise.resolve(results);
    var file = pending.shift();
    var base = path.basename(file);
    var m = FILE_RE.exec(base);
    var cycleTs = m[1] + '_' + m[2];
    var day = m[1];
    var data;
    try { data = readCapture(file, o); }
    catch (e) {
      results.failed.push({ file: file, error: 'parse: ' + e.message });
      return next();
    }
    var endpoints = data.endpoints || {};
    var keys = Object.keys(endpoints);
    var ops = keys.map(function(key) {
      var wr = vc.wrapAndValidate(key, endpoints[key], { cycleTs: cycleTs, producer: 'spool-bridge' });
      if (wr.ok) {
        return spool.enqueue(key, wr.payload, { captureTime: cycleTs, day: day, producer: 'spool-bridge' })
          .then(function(r) { if (r.ok) results.validated++; return r; });
      }
      results.violated++;
      return vc.quarantine(spool, wr.payload, wr.reasons)
        .then(function(r) { if (r.ok) results.quarantined++; })
        .then(function() {
          return spool.updateCursor(key, cycleTs, new Error('schemaViolation: ' + wr.reasons.join('; ')), { advance: false });
        })
        .then(function() { vc.logViolation(key, cycleTs, wr.reasons, 'spool-bridge', file, o.violationsLog); });
    });
    return Promise.all(ops).then(function() {
      markIngested(spool, file, keys.length, o);
      results.ingested++;
      return next();
    }).catch(function(e) {
      results.failed.push({ file: file, error: String(e) });
      return next();
    });
  }
  return next();
}

function bridgeOnce(opts) {
  return spoolMod.init().then(function(spool) {
    return ingestOnce(spool, opts);
  });
}

function run() {
  bridgeOnce().then(function(results) {
    console.log('bridge: scanned=' + results.scanned + ' newFiles=' + results.newFiles + ' ingested=' + results.ingested +
      ' validated=' + results.validated + ' violated=' + results.violated + ' failed=' + results.failed.length);
    results.failed.forEach(function(f) { console.log('  FAILED ' + f.file + ': ' + f.error); });
    process.exit(results.failed.length ? 1 : 0);
  }).catch(function(e) {
    console.error('bridge error: ' + e.stack);
    process.exit(1);
  });
}

var isMain = require.main === module;
if (isMain) run();
module.exports = { ingestOnce: ingestOnce, bridgeOnce: bridgeOnce, run: run, resolveOpts: resolveOpts, FILE_RE: FILE_RE };
