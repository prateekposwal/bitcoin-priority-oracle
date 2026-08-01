#!/usr/bin/env node
// BSAHI — 15 Topic Intelligence
// Computes per-topic trend, best platform, and ideal cadence from engagement
// logs; refreshes topic-signal.json. Replaces feedbackRefresh() in the
// orchestrator — richer signal than the raw weights.
var path = require('path');
var fs = require('fs');

var REPO = path.resolve(__dirname, '..', '..');
var OUT_FILE = path.join(REPO, 'captured-data', 'topic-intelligence.json');
var RESEARCH_PRIORITY_FILE = path.join(REPO, 'captured-data', 'research-priority.json');
var ANGLES = require('../../research/angles.js');

function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return fallback; }
}

function clamp01(v) {
  v = parseFloat(v);
  if (isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function latestRatio() {
  try {
    var db = require('../db/init.js');
    var rows = db.query("SELECT title, details, created_at FROM research_findings WHERE title LIKE 'Storage Cost Coverage Ratio:%' ORDER BY id DESC LIMIT 1");
    if (!rows || !rows.length) return null;
    var m = String(rows[0].title).match(/([\d.]+)/);
    // Version: prefer DB details JSON (storage-ratio.js writes it), then the title's (vX.Y.Z),
    // then the canonical spec version. No hardcoded '1.0.0'.
    var version = null;
    try { var d = JSON.parse(rows[0].details || '{}'); version = d.version || null; } catch (e) {}
    if (!version) {
      var vm = String(rows[0].title).match(/\(v([\d.]+)\)/);
      version = vm ? vm[1] : null;
    }
    if (!version) {
      try { version = require('../../research/model-spec.json').version; } catch (e2) {}
    }
    return { value: m ? parseFloat(m[1]) : null, version: version, report_date: String(rows[0].created_at || '').slice(0, 10) };
  } catch (e) { return null; }
}

function computePriorities(signal, ti) {
  return ANGLES.map(function(a) {
    var topic = (ti.topics || {})[a.topic] || {};
    var trend = topic.trend_7d || 'flat';
    var trendBonus = trend === 'rising' ? 0.2 : (trend === 'falling' ? -0.2 : 0);
    var ew = clamp01((signal.weights || {})[a.topic]);
    var gapBoost = a.has_gap ? 1.0 : 0.5;
    var score = Math.round((0.5 * ew + 0.3 * trendBonus + 0.2 * gapBoost) * 10000) / 10000;
    return { angle: a.id, title: a.title, topic: a.topic, persona_owner: a.persona_owner,
             score: score, engagement_weight: Math.round(ew * 10000) / 10000,
             trend_bonus: trendBonus, trend: trend, has_gap: a.has_gap,
             gap_reason: a.source_file ? 'covered by ' + a.source_file : 'no coverage file',
             source_file: a.source_file };
  }).sort(function(x, y) {
    if (y.score !== x.score) return y.score - x.score;
    if (y.engagement_weight !== x.engagement_weight) return y.engagement_weight - x.engagement_weight;
    return x.angle < y.angle ? -1 : 1;
  });
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

  var priorities = computePriorities(signal, out);
  fs.writeFileSync(RESEARCH_PRIORITY_FILE, JSON.stringify({
    generated_at: out.generated_at,
    metrics: { storage_ratio: latestRatio() },
    priorities: priorities
  }, null, 2));

  if (require.main === module) console.log('topic-intelligence: ' + Object.keys(topics).length + ' topics, fee trend ' + feeTrend + '; research-priority: top = ' + (priorities[0] ? priorities[0].angle : 'none') + ' (' + (priorities[0] ? priorities[0].score : 0) + ')');
  return { topics: out, priorities: priorities };
}

if (require.main === module) {
  run(); process.exit(0);
}

module.exports = { run: run, computePriorities: computePriorities };
