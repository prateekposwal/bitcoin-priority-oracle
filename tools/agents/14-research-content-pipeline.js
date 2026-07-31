#!/usr/bin/env node
// BSAHI — 14 Research Content Pipeline
// Enqueues research findings into the spool (research_findings source) and
// emits content briefs for compliant/story/employee publishers. Bridges the
// research -> publishing gap (compliant-content/story-content currently read
// captured-data/backfill, not the spool).
var path = require('path');
var fs = require('fs');
var spoolMod = require('../data-engineering/spool.js');

var REPO = path.resolve(__dirname, '..', '..');
var BRIEFS_FILE = path.join(REPO, 'captured-data', 'content-briefs.json');

function loadResearch() {
  try {
    var db = require('../db/init.js');
    return db.query("SELECT * FROM research_findings ORDER BY id DESC LIMIT 20") || [];
  } catch (e) { return []; }
}

function buildBrief(row) {
  var title = row.title || row.finding || '';
  var summary = row.summary || row.details || '';
  var source = row.source || 'research';
  var topic = source;
  return {
    id: 'brief-' + (row.id || Date.now()),
    source: source,
    topic: topic,
    title: String(title).slice(0, 120),
    summary: String(summary).slice(0, 300),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
}

function run() {
  var findings = loadResearch();
  var briefs = findings.map(buildBrief);
  fs.writeFileSync(BRIEFS_FILE, JSON.stringify({ generated_at: new Date().toISOString(), briefs: briefs }, null, 2));

  return spoolMod.init().then(function(spool) {
    var now = new Date();
    var ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0');
    return spool.enqueue('research_findings', {
      status: 200,
      data: { findings: findings.slice(0, 20), briefsGenerated: briefs.length },
      fetchedAt: new Date().toISOString()
    }, { captureTime: ts, day: ts.slice(0, 10), producer: 'agent-14' });
  }).then(function(r) {
    if (require.main === module) console.log('research-content-pipeline: ' + (r.ok ? 'enqueued' : 'duplicate') + ', ' + findings.length + ' findings -> ' + briefs.length + ' briefs');
    return { findings: findings.length, briefs: briefs.length };
  });
}

if (require.main === module) {
  run().then(function() { process.exit(0); }).catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { run: run };
