#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var spoolMod = require('./spool.js');

var ROOT = path.join(__dirname, '..', '..', 'captured-data');
var INGESTED_LOG = path.join(ROOT, 'spool', 'ingested.log');
var FILE_RE = /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/;

function loadIngested() {
  if (!fs.existsSync(INGESTED_LOG)) return new Set();
  var out = new Set();
  var raw = fs.readFileSync(INGESTED_LOG, 'utf8');
  raw.split('\n').forEach(function(line) {
    if (!line.trim()) return;
    try { out.add(JSON.parse(line).file); } catch (e) {}
  });
  return out;
}

function markIngested(spool, file, entries) {
  var rec = { file: file, ingestedAt: new Date().toISOString(), entries: entries };
  fs.appendFileSync(INGESTED_LOG, JSON.stringify(rec) + '\n');
}

function scanFiles() {
  var out = [];
  var rootFiles = fs.readdirSync(ROOT).filter(function(f) { return FILE_RE.test(f); });
  rootFiles.forEach(function(f) { out.push(f); });
  var backfillRoot = path.join(ROOT, 'backfill');
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

function readCapture(rel) {
  var full = rel.startsWith('backfill') ? path.join(ROOT, rel) : path.join(ROOT, rel);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function ingestOnce(spool) {
  var ingested = loadIngested();
  var files = scanFiles();
  var pending = files.filter(function(f) { return !ingested.has(f); });
  if (pending.length === 0) return Promise.resolve({ scanned: files.length, ingested: 0, newFiles: 0, failed: [] });

  var results = { scanned: files.length, ingested: 0, newFiles: pending.length, failed: [] };

  function next() {
    if (pending.length === 0) return Promise.resolve(results);
    var file = pending.shift();
    var base = path.basename(file);
    var m = FILE_RE.exec(base);
    var cycleTs = m[1] + '_' + m[2];
    var day = m[1];
    var data;
    try { data = readCapture(file); }
    catch (e) {
      results.failed.push({ file: file, error: 'parse: ' + e.message });
      return next();
    }
    var endpoints = data.endpoints || {};
    var keys = Object.keys(endpoints);
    var ops = keys.map(function(key) {
      return spool.enqueue(key, endpoints[key], { captureTime: cycleTs, day: day, producer: 'spool-bridge' });
    });
    return Promise.all(ops).then(function() {
      markIngested(spool, file, keys.length);
      results.ingested++;
      return next();
    }).catch(function(e) {
      results.failed.push({ file: file, error: String(e) });
      return next();
    });
  }
  return next();
}

function bridgeOnce() {
  return spoolMod.init().then(function(spool) {
    return ingestOnce(spool);
  });
}

function run() {
  bridgeOnce().then(function(results) {
    console.log('bridge: scanned=' + results.scanned + ' newFiles=' + results.newFiles + ' ingested=' + results.ingested + ' failed=' + results.failed.length);
    results.failed.forEach(function(f) { console.log('  FAILED ' + f.file + ': ' + f.error); });
    process.exit(results.failed.length ? 1 : 0);
  }).catch(function(e) {
    console.error('bridge error: ' + e.stack);
    process.exit(1);
  });
}

var isMain = require.main === module;
if (isMain) run();
module.exports = { ingestOnce: ingestOnce, bridgeOnce: bridgeOnce, run: run };
