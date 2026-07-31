#!/usr/bin/env node
var spoolMod = require('./spool.js');
var env = require('./envelope.js');
var db = require('../db/init.js');
var path = require('path');
var fs = require('fs');

function num(v) {
  if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
  return v;
}

function tsToIso(captureTime) {
  if (!captureTime) return new Date().toISOString();
  var m = /^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})$/.exec(captureTime);
  if (!m) return new Date().toISOString();
  var d = new Date(m[1] + 'T' + m[2] + ':' + m[3] + ':' + m[4]);
  return d.toISOString();
}

function handler(payload, ctx) {
  var c = env.unwrap(payload);
  var data = c.data;
  if (data && typeof data === 'object' && data.ok === false) data = { error: data.error || 'capture failed' };
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    Object.keys(data).forEach(function(k) { if (typeof data[k] === 'string') data[k] = num(data[k]); });
  }
  var json = JSON.stringify(data !== undefined && data !== null ? data : { error: c.error || 'no data' });
  var capturedAt = c.fetchedAt || tsToIso(ctx.captureTime);
  db.insertCapture(ctx.source, 'spool:' + ctx.id, c.status || (c.error ? 0 : 200), 0, json, '', null, 0);
  return Promise.resolve();
}

function daysOnDisk(spool, source) {
  var p = path.join(spool.dir, 'index', source);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p).filter(function(f) { return f.endsWith('.jsonl'); }).map(function(f) { return f.replace('.jsonl', ''); });
}

function drainAll() {
  return spoolMod.init().then(function(spool) {
    return spool.stats().then(function(st) {
      var sources = Object.keys(st.perSource);
      var ops = sources.map(function(src) {
        var days = daysOnDisk(spool, src);
        return Promise.all(days.map(function(day) {
          return spool.consume(src, day, handler, { consumer: 'db-writer' });
        }));
      });
      return Promise.all(ops);
    });
  });
}

if (require.main === module) {
  drainAll().then(function(results) {
    var processed = results.reduce(function(s, srcResults) { return s + srcResults.reduce(function(a, r) { return a + r.processed; }, 0); }, 0);
    var failed = results.reduce(function(s, srcResults) { return s + srcResults.reduce(function(a, r) { return a + r.failed; }, 0); }, 0);
    console.log('consumer: processed=' + processed + ' failed=' + failed);
    process.exit(0);
  }).catch(function(e) {
    console.error('consumer error: ' + e.stack);
    process.exit(1);
  });
}

module.exports = { drainAll: drainAll, handler: handler };
