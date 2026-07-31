#!/usr/bin/env node
// BSAHI — 05 Derived Metrics Agent (fills the 01-12 numbering gap)
// Reads spool index (single source of truth) and computes first-class
// derived metrics: fee percentiles, block-space utilization, fee-to-vsize
// ratio, trend slope + volatility. Output enqueued into the spool as
// source `derived_metrics` (inherits cursors, staleness, SQLite).
var fs = require('fs');
var path = require('path');
var spoolMod = require('../data-engineering/spool.js');

var SPOOL_INDEX = path.resolve(__dirname, '..', '..', 'captured-data', 'spool', 'index');

function readSpoolSeries(source, field, n, days) {
  var out = [];
  var dir = path.join(SPOOL_INDEX, source);
  if (!fs.existsSync(dir)) return out;
  var dayFiles = fs.readdirSync(dir).filter(function(f) { return f.endsWith('.jsonl'); }).sort().slice(-(days || 7));
  dayFiles.forEach(function(day) {
    var lines = fs.readFileSync(path.join(dir, day), 'utf8').split('\n');
    lines.forEach(function(line) {
      if (!line.trim()) return;
      try {
        var rec = JSON.parse(line);
        var data = (rec.payload || {}).data;
        var val = null;
        if (data && typeof data === 'object' && data[field] !== undefined) val = parseFloat(data[field]);
        else if (data && data.latest && data.latest[field] !== undefined) val = parseFloat(data.latest[field]);
        if (val !== null && isFinite(val)) out.push({ captureTime: rec.captureTime, value: val });
      } catch (e) {}
    });
  });
  out.sort(function(a, b) { return a.captureTime < b.captureTime ? -1 : 1; });
  return out.slice(-(n || 100));
}

function percentiles(values) {
  var sorted = values.slice().sort(function(a, b) { return a - b; });
  function pct(p) {
    if (!sorted.length) return 0;
    var idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx];
  }
  return { p10: pct(0.10), p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90) };
}

function slope(values) {
  var n = values.length;
  if (n < 2) return 0;
  var xs = [];
  for (var i = 0; i < n; i++) xs.push(i);
  var sx = xs.reduce(function(a, b) { return a + b; }, 0);
  var sy = values.reduce(function(a, b) { return a + b; }, 0);
  var sxy = 0, sxx = 0;
  for (var j = 0; j < n; j++) { sxy += xs[j] * values[j]; sxx += xs[j] * xs[j]; }
  var denom = n * sxx - sx * sx;
  return denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
}

function stddev(values) {
  var n = values.length;
  if (n < 2) return 0;
  var mean = values.reduce(function(a, b) { return a + b; }, 0) / n;
  var variance = values.reduce(function(a, b) { return a + (b - mean) * (b - mean); }, 0) / n;
  return Math.sqrt(variance);
}

function latestBlocks() {
  var dir = path.join(SPOOL_INDEX, 'blocks');
  if (!fs.existsSync(dir)) return null;
  var dayFiles = fs.readdirSync(dir).filter(function(f) { return f.endsWith('.jsonl'); }).sort();
  for (var i = dayFiles.length - 1; i >= 0; i--) {
    var lines = fs.readFileSync(path.join(dir, dayFiles[i]), 'utf8').split('\n');
    for (var j = lines.length - 1; j >= 0; j--) {
      if (!lines[j].trim()) continue;
      try {
        var rec = JSON.parse(lines[j]);
        var data = (rec.payload || {}).data;
        if (Array.isArray(data) && data.length && data[0].weight !== undefined) return data;
      } catch (e) {}
    }
  }
  return null;
}

function latestMempoolBlocks() {
  var dir = path.join(SPOOL_INDEX, 'mempool_blocks');
  if (!fs.existsSync(dir)) return null;
  var dayFiles = fs.readdirSync(dir).filter(function(f) { return f.endsWith('.jsonl'); }).sort();
  for (var i = dayFiles.length - 1; i >= 0; i--) {
    var lines = fs.readFileSync(path.join(dir, dayFiles[i]), 'utf8').split('\n');
    for (var j = lines.length - 1; j >= 0; j--) {
      if (!lines[j].trim()) continue;
      try {
        var rec = JSON.parse(lines[j]);
        var data = (rec.payload || {}).data;
        if (Array.isArray(data) && data.length && data[0].blockVSize !== undefined) return data;
      } catch (e) {}
    }
  }
  return null;
}

function compute() {
  var fees = readSpoolSeries('fees', 'fastestFee', 200, 7);
  var feeVals = fees.map(function(f) { return f.value; });
  var pct = percentiles(feeVals);
  var trend = slope(feeVals);
  var vol = feeVals.length > 1 ? stddev(feeVals) / (feeVals.reduce(function(a, b) { return a + b; }, 0) / feeVals.length) : 0;

  var blockSpaceUtil = null;
  var mpb = latestMempoolBlocks();
  if (mpb && mpb.length) {
    var vsizeSum = mpb.reduce(function(s, b) { return s + (b.blockVSize || 0); }, 0);
    blockSpaceUtil = Math.round(vsizeSum / (mpb.length * 4e6) * 1000) / 10;
  }

  var feeToVsize = null;
  var blocks = latestBlocks();
  if (blocks && blocks.length && blocks[0].weight) {
    feeToVsize = Math.round(blocks[0].weight / 4e6 * 1000) / 10;
  }

  return {
    capturedAt: new Date().toISOString(),
    sources: { fees: fees.length, blocks: blocks ? blocks.length : 0 },
    fees: {
      p10: Math.round(pct.p10 * 100) / 100,
      p25: Math.round(pct.p25 * 100) / 100,
      p50: Math.round(pct.p50 * 100) / 100,
      p75: Math.round(pct.p75 * 100) / 100,
      p90: Math.round(pct.p90 * 100) / 100,
      trend_sat_vB_per_capture: Math.round(trend * 10000) / 10000,
      volatility: Math.round(vol * 10000) / 10000
    },
    block_space: {
      utilization_pct: blockSpaceUtil,
      next_block_weight_util_pct: feeToVsize
    },
    mempool_blocks_sampled: mpb ? mpb.length : 0
  };
}

function run() {
  var metrics = compute();
  return spoolMod.init().then(function(spool) {
    var now = new Date();
    var ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0');
    return spool.enqueue('derived_metrics', { status: 200, data: metrics, fetchedAt: new Date().toISOString() }, { captureTime: ts, day: ts.slice(0, 10), producer: 'agent-05' });
  }).then(function(r) {
    if (require.main === module) console.log('derived-metrics: enqueued ' + (r.ok ? 'ok' : 'duplicate') + ' — ' + JSON.stringify(metrics.fees));
    return metrics;
  });
}

if (require.main === module) {
  run().then(function() { process.exit(0); }).catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { run: run, compute: compute };
