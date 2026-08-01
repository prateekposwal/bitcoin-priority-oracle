#!/usr/bin/env node
// BSAHI — 14 Research Content Pipeline
// Enqueues research findings into the spool (research_findings source) and
// emits content briefs for compliant/story/employee publishers. Bridges the
// research -> publishing gap.
// Sources (A+B hybrid): DB research_findings (live, from runner + storage-ratio)
// first; research/*.md + storage-ratio report files as fallback when DB is thin.
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var spoolMod = require('../data-engineering/spool.js');

var REPO = path.resolve(__dirname, '..', '..');
var BRIEFS_FILE = path.join(REPO, 'captured-data', 'content-briefs.json');

function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return fallback; }
}

function loadResearch() {
  try {
    var db = require('../db/init.js');
    return db.query("SELECT * FROM research_findings ORDER BY id DESC LIMIT 20") || [];
  } catch (e) { return []; }
}

function buildBrief(row) {
  var title = row.title || row.finding || '';
  var summary = row.details || row.finding || '';
  var source = row.source || row.agent || 'research';
  var topic = row.category || source;
  return {
    id: 'brief-' + (row.id || Date.now()),
    source: source,
    topic: topic,
    title: String(title).slice(0, 120),
    summary: String(summary).slice(0, 300),
    url: row.url || '',
    confidence: row.confidence != null ? row.confidence : 0.5,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
}

function firstPara(md) {
  var m = String(md).replace(/\r/g, '').split('\n').filter(function(l) {
    return l.trim() && l[0] !== '#' && l[0] !== '-' && l[0] !== '|' && l.indexOf('```') === -1 && l.indexOf('![') === -1;
  });
  return m.length ? m[0].trim().slice(0, 300) : '';
}

function scanResearchFiles() {
  var briefs = [];
  try {
    fs.readdirSync(path.join(REPO, 'research')).forEach(function(f) {
      if (!/\.md$/.test(f)) return;
      if (f === 'architect-notes.md') return; // internal notes, not a brief
      var md = fs.readFileSync(path.join(REPO, 'research', f), 'utf8');
      var m = md.match(/^#\s+(.+)$/m);
      var title = (m && m[1]) || f.replace('.md', '');
      briefs.push({ source: 'research-file', topic: 'research', title: String(title).slice(0, 120), summary: firstPara(md), url: 'research/' + f, confidence: 0.5 });
    });
  } catch (e) {}
  try {
    fs.readdirSync(path.join(REPO, 'reports', 'research')).forEach(function(f) {
      if (f.indexOf('storage-ratio-') !== 0) return;
      var md = fs.readFileSync(path.join(REPO, 'reports', 'research', f), 'utf8');
      var m = md.match(/Avg coverage ratio\s*\|\s*([\d.]+)/);
      var title = m ? 'Storage Cost Coverage Ratio: ' + m[1] : 'Storage Cost Coverage Ratio Report';
      briefs.push({ source: 'storage-ratio', topic: 'storage-externality', title: String(title).slice(0, 120), summary: firstPara(md), url: 'reports/research/' + f, confidence: 0.95 });
    });
  } catch (e) {}
  return briefs;
}

function backfill() {
  // One-time bootstrap: persist .md-derived findings as DB rows (idempotent).
  try {
    var db = require('../db/init.js');
    var mdBriefs = scanResearchFiles();
    var inserted = 0;
    mdBriefs.forEach(function(b) {
      var existing = db.query("SELECT id FROM research_findings WHERE source='" + String(b.source).replace(/'/g, "''") + "' AND title='" + String(b.title).replace(/'/g, "''") + "'");
      if (existing && existing.length) return;
      db.insertResearchFinding(b.source, b.title, b.summary, '', b.confidence, b.topic, b.url, 0);
      inserted++;
    });
    console.log('backfill: ' + inserted + ' findings persisted');
  } catch (e) { console.error('backfill error:', e.message); }
}

function run() {
  var findings = loadResearch();
  var dbBriefs = findings.map(buildBrief);
  // Option B fallback: only when DB is thin (< 20 rows).
  var mdBriefs = dbBriefs.length >= 20 ? [] : scanResearchFiles();
  var seen = {};
  var briefs = [];
  dbBriefs.concat(mdBriefs).forEach(function(b) {
    var key = (b.source + '|' + b.title).toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    briefs.push(b);
  });
  briefs = briefs.slice(0, 20);

  // Storage-ratio history hygiene: the DB keeps v1.0.0 rows for the changelog,
  // but only the LATEST (highest ratio, v2.0.0-tagged) Storage Cost Coverage
  // Ratio finding may be 'pending'. Older ratio rows are marked 'superseded'
  // so the publishing queue never carries stale 0.0149/0.0172/0.0176 pending
  // items (P1.11/P1.12).
  var ratioBriefs = briefs.filter(function(b) { return /^Storage Cost Coverage Ratio:/.test(b.title); });
  if (ratioBriefs.length > 1) {
    var maxRatio = 0;
    ratioBriefs.forEach(function(b) {
      var r = parseFloat(String(b.title).match(/[\d.]+/) || '0') || 0;
      if (r > maxRatio) maxRatio = r;
    });
    var keep = null;
    ratioBriefs.forEach(function(b) {
      var r = parseFloat(String(b.title).match(/[\d.]+/) || '0') || 0;
      var isMax = Math.abs(r - maxRatio) < 1e-9;
      var hasV2 = /v2\.0\.0/.test(b.title);
      if (isMax && hasV2) keep = b;
      else if (isMax && !keep) keep = b;
    });
    ratioBriefs.forEach(function(b) { if (b !== keep) b.status = 'superseded'; });
  }

  // Engagement-driven agenda ordering: top-3 research-priority topics rank first.
  var priorities = loadJson(path.join(REPO, 'captured-data', 'research-priority.json'), { priorities: [] }).priorities || [];
  var rankMap = {};
  priorities.forEach(function(p, i) { rankMap[p.topic] = Math.min(i + 1, 4); });
  var ANGLE_TOPIC_MAP = { 'storage-externality': 'cost', 'research': 'research',
    'fees': 'fees', 'lightning': 'lightning', 'blocks': 'blocks',
    'fork': 'fork', 'economy': 'economy', 'capacity': 'capacity' };
  var scoreByTopic = {};
  priorities.forEach(function(p) { scoreByTopic[p.topic] = p.score; });
  briefs.forEach(function(b) {
    var t = ANGLE_TOPIC_MAP[b.topic] || 'research';
    b.priority_rank = rankMap[t] || 5;
    b.priority_score = t === 'research' ? 0 : (scoreByTopic[t] || 0);
  });
  briefs.sort(function(a, b) { return a.priority_rank - b.priority_rank; });

  fs.writeFileSync(BRIEFS_FILE, JSON.stringify({ generated_at: new Date().toISOString(), briefs: briefs }, null, 2));

  return spoolMod.init().then(function(spool) {
    var now = new Date();
    var ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0');
    return spool.enqueue('research_findings', {
      status: 200,
      data: { findings: findings.slice(0, 20), briefsGenerated: briefs.length },
      fetchedAt: new Date().toISOString()
    }, { captureTime: ts, day: ts.slice(0, 10), producer: 'agent-14', expectedIntervalMinutes: 60 });
  }).then(function(r) {
    if (require.main === module) console.log('research-content-pipeline: ' + (r.ok ? 'enqueued' : 'duplicate') + ', ' + findings.length + ' findings -> ' + briefs.length + ' briefs');
    return { findings: findings.length, briefs: briefs.length };
  });
}

if (require.main === module) {
  if (process.argv[2] === '--backfill') { backfill(); process.exit(0); }
  run().then(function() { process.exit(0); }).catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { run: run, backfill: backfill, scanResearchFiles: scanResearchFiles };
