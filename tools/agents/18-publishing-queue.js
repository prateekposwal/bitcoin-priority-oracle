#!/usr/bin/env node
// BSAHI — 18 Publishing Queue
// Consolidates all publishing stacks (ops-center queue, post-log, compliant
// posts, story briefs, content briefs) into ONE unified queue. Single source
// of truth for what was/will be published.
var path = require('path');
var fs = require('fs');

var REPO = path.resolve(__dirname, '..', '..');
var QUEUE_FILE = path.join(REPO, 'captured-data', 'publishing-queue.json');

function loadJson(p, fb) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fb; } }

function run() {
  var now = new Date().toISOString();
  var queue = [];

  // post-log.json (published history)
  var postLog = loadJson(path.join(REPO, 'captured-data', 'post-log.json'), { posts: [] });
  (postLog.posts || []).forEach(function(p) {
    queue.push({
      id: p.id || ('post-' + queue.length),
      source: 'post-log',
      platform: p.platform || 'nostr',
      topic: p.topic || 'unknown',
      status: 'posted',
      postedAt: p.postedAt,
      url: p.url || null,
      author: p.author || null
    });
  });

  // marketing queue (ops-center pending)
  var opsDir = path.join(REPO, 'reports', 'marketing', 'queue');
  if (fs.existsSync(opsDir)) {
    fs.readdirSync(opsDir).filter(function(f) { return f.endsWith('.json'); }).forEach(function(f) {
      try {
        var item = JSON.parse(fs.readFileSync(path.join(opsDir, f), 'utf8'));
        queue.push({
          id: 'ops-' + f.replace('.json', ''),
          source: 'ops-center',
          platform: item.platform || 'unknown',
          topic: item.topic || 'unknown',
          status: 'queued',
          scheduledFor: item.scheduledFor || item.postedAt || null,
          content: (item.content || '').slice(0, 100)
        });
      } catch (e) {}
    });
  }

  // content briefs (agent 14 output)
  var briefs = loadJson(path.join(REPO, 'captured-data', 'content-briefs.json'), { briefs: [] });
  (briefs.briefs || []).forEach(function(b) {
    queue.push({
      id: b.id || ('brief-' + queue.length),
      source: 'content-brief',
      platform: 'any',
      topic: b.topic || 'unknown',
      status: b.status || 'pending',
      title: b.title || null
    });
  });

  fs.writeFileSync(QUEUE_FILE, JSON.stringify({ generated_at: now, total: queue.length, items: queue }, null, 2));
  if (require.main === module) console.log('publishing-queue: ' + queue.length + ' items consolidated');
  return { total: queue.length };
}

if (require.main === module) {
  run(); process.exit(0);
}

module.exports = { run: run };
