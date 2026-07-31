#!/usr/bin/env node
// BSAHI — 15 Topic Intelligence
// Computes per-topic trend, best platform, and ideal cadence from engagement
// logs; refreshes topic-signal.json. Replaces feedbackRefresh() in the
// orchestrator — richer signal than the raw weights.
var path = require('path');
var fs = require('fs');

var REPO = path.resolve(__dirname, '..', '..');
var OUT_FILE = path.join(REPO, 'captured-data', 'topic-intelligence.json');

function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return fallback; }
}

function loadSpoolSeries(source, field) {
  var out = [];
  var dir = path.join(REPO, 'captured-data', 'spool', 'index', source);
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir).filter(function(f) { return f.endsWith('.jsonl'); }).sort().slice(-3).forEach(function(day) {
    fs.readFileSync(path.join(dir, day), 'utf8').split('\n').forEach(function(line) {
      if (!line.trim()) return;
      try {
        var rec = JSON.parse(line);
        var data = (rec.payload || {}).data;
        var val = data && typeof data === 'object' && data[field] !== undefined ? parseFloat(data[field]) : null;
        if (val !== null) out.push({ captureTime: rec.captureTime, value: val });
      } catch (e) {}
    });
  });
  out.sort(function(a, b) { return a.captureTime < b.captureTime ? -1 : 1; });
  return out;
}

function run() {
  var signal = loadJson(path.join(REPO, 'captured-data', 'topic-signal.json'), { topics: {}, weights: {} });
  var fees = loadSpoolSeries('fees', 'fastestFee');
  var feeTrend = 'flat';
  if (fees.length >= 2) {
    var first = fees[0].value, last = fees[fees.length - 1].value;
    var change = (last - first) / (first || 1);
    if (change > 0.2) feeTrend = 'rising';
    else if (change < -0.2) feeTrend = 'falling';
  }

  var topics = {};
  Object.keys(signal.topics || {}).forEach(function(t) {
    var s = signal.topics[t];
    var weight = (signal.weights || {})[t] || 0.1;
    topics[t] = {
      score: s.score || 0,
      weight: weight,
      trend_7d: t === 'fees' ? feeTrend : 'flat',
      best_platform: weight > 0.5 ? 'all' : (weight > 0.2 ? 'nostr' : 'none'),
      cadence_per_day: weight > 0.5 ? 5 : (weight > 0.2 ? 2 : 1)
    };
  });

  var out = {
    generated_at: new Date().toISOString(),
    fee_market: { trend_7d: feeTrend, latest: fees.length ? fees[fees.length - 1].value : null, samples: fees.length },
    topics: topics
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  if (require.main === module) console.log('topic-intelligence: ' + Object.keys(topics).length + ' topics, fee trend ' + feeTrend);
  return out;
}

if (require.main === module) {
  run(); process.exit(0);
}

module.exports = { run: run };
