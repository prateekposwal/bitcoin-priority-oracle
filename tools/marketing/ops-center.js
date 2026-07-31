var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var { CONFIG } = require('./config.js');

var STATE_FILE = path.resolve(__dirname, '..', '..', 'captured-data', 'marketing-state.json');
var QUEUE_DIR = path.resolve(__dirname, '..', '..', 'reports', 'marketing', 'queue');
var LOG_DIR = path.resolve(__dirname, '..', '..', 'reports', 'marketing', 'logs');
var AGENT = 'BSAHI Content Operations';

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {
    return { totalPosted: 0, totalScheduled: 0, lastRun: null, posts: [], platformStats: {}, cycleCount: 0 };
  }
}

function saveState(state) {
  ensureDir(path.dirname(STATE_FILE));
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function log(agent, msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + agent + '] ' + msg);
}

function generatePostId() {
  return 'BSAHI-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ─── Content Queue ───

function generateDailyQueue() {
  ensureDir(QUEUE_DIR);
  var agent = require('./agent.js');
  var items = agent.generateContent(0);
  var state = loadState();
  var queued = [];

  // Cross-stack dedupe (S3/flagged): agent 18 consolidates post-log + this queue
  // + briefs into captured-data/publishing-queue.json. Read it back here to skip
  // platform/topic pairs already posted today — makes the ledger load-bearing.
  var postedToday = {};
  try {
    var pq = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'captured-data', 'publishing-queue.json'), 'utf8'));
    var today = new Date().toISOString().slice(0, 10);
    if (pq && pq.items) pq.items.forEach(function(it) {
      if (it.status === 'posted' && it.postedAt && String(it.postedAt).slice(0, 10) === today) {
        postedToday[it.platform + '|' + it.topic] = true;
      }
    });
  } catch (e) {}

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (postedToday[item.platform + '|' + item.topic]) {
      log('Queue', 'SKIP (posted today per publishing-queue.json): ' + item.platform + '/' + item.topic);
      continue;
    }
    var postId = generatePostId();
    var filename = postId + '.json';
    var post = {
      id: postId,
      platform: item.platform,
      topic: item.topic,
      content: item.content,
      status: 'queued',
      created: new Date().toISOString(),
      scheduledFor: item.date,
      postedAt: null,
      url: null,
      engagement: { likes: 0, replies: 0, shares: 0 },
      notes: ''
    };
    fs.writeFileSync(path.join(QUEUE_DIR, filename), JSON.stringify(post, null, 2));
    queued.push(post);
    state.totalScheduled++;
  }
  saveState(state);
  log('Queue', 'Generated ' + queued.length + ' posts for ' + new Date().toISOString().slice(0, 10));
  return queued;
}

function getQueue(status) {
  status = status || 'queued';
  ensureDir(QUEUE_DIR);
  var files = fs.readdirSync(QUEUE_DIR).filter(function(f) { return f.endsWith('.json'); });
  var posts = [];
  for (var i = 0; i < files.length; i++) {
    try {
      var post = JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, files[i]), 'utf8'));
      if (!status || post.status === status) posts.push(post);
    } catch (e) {}
  }
  return posts.sort(function(a, b) { return new Date(a.created) - new Date(b.created); });
}

function markPosted(postId, url) {
  var file = path.join(QUEUE_DIR, postId + '.json');
  if (!fs.existsSync(file)) return;
  var post = JSON.parse(fs.readFileSync(file, 'utf8'));
  post.status = 'posted';
  post.postedAt = new Date().toISOString();
  post.url = url || '';
  fs.writeFileSync(file, JSON.stringify(post, null, 2));

  var state = loadState();
  state.totalPosted++;
  state.posts.push({ id: postId, platform: post.platform, topic: post.topic, postedAt: post.postedAt, url: post.url });
  state.platformStats[post.platform] = (state.platformStats[post.platform] || 0) + 1;
  state.lastRun = new Date().toISOString();
  saveState(state);
  log('Publisher', 'Posted ' + postId + ' to ' + post.platform + ' [' + post.topic + ']');
}

function markSkipped(postId, reason) {
  var file = path.join(QUEUE_DIR, postId + '.json');
  if (!fs.existsSync(file)) return;
  var post = JSON.parse(fs.readFileSync(file, 'utf8'));
  post.status = 'skipped';
  post.notes = reason;
  fs.writeFileSync(file, JSON.stringify(post, null, 2));
  log('Publisher', 'Skipped ' + postId + ': ' + reason);
}

// ─── Hourly Cycle ───

function runCycle() {
  var state = loadState();
  state.cycleCount++;
  var cycleId = state.cycleCount;

  log('OpsCenter', '=== Cycle ' + cycleId + ' ===');

  // Step 1: Check queue — generate if empty
  var queued = getQueue('queued');
  if (queued.length === 0) {
    log('OpsCenter', 'Queue empty — generating new content');
    queued = generateDailyQueue();
  }

  // Step 2: Log what's in queue
  log('OpsCenter', 'Queue: ' + queued.length + ' posts pending');
  for (var i = 0; i < Math.min(queued.length, 5); i++) {
    log('OpsCenter', '  [' + queued[i].platform + '] ' + queued[i].topic + ' — created ' + queued[i].created.slice(0, 10));
  }

  // Step 3: Generate engagement content (comments, replies) for posted items
  var posted = getQueue('posted');
  log('OpsCenter', 'Posted to date: ' + posted.length + ' posts across ' + Object.keys(state.platformStats).length + ' platforms');
  for (var p in state.platformStats) {
    log('OpsCenter', '  ' + p + ': ' + state.platformStats[p] + ' posts');
  }

  // Step 4: Log report
  var logEntry = {
    cycle: cycleId,
    timestamp: new Date().toISOString(),
    queued: queued.length,
    posted: posted.length,
    platforms: JSON.parse(JSON.stringify(state.platformStats))
  };

  ensureDir(LOG_DIR);
  var logFile = path.join(LOG_DIR, 'cycle-' + cycleId + '.json');
  fs.writeFileSync(logFile, JSON.stringify(logEntry, null, 2));

  state.lastRun = new Date().toISOString();
  saveState(state);
  log('OpsCenter', '=== Cycle ' + cycleId + ' complete ===');
  return logEntry;
}

// ─── Report Generator ───

function generateWeeklyReport() {
  var state = loadState();
  var posted = getQueue('posted');

  var lines = [];
  lines.push('# BSAHI Content Operations — Weekly Report');
  lines.push('Generated: ' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push('| Total posts | ' + state.totalPosted + ' |');
  lines.push('| Total scheduled | ' + state.totalScheduled + ' |');
  lines.push('| Cycles run | ' + state.cycleCount + ' |');
  lines.push('| Platforms | ' + Object.keys(state.platformStats).join(', ') + ' |');
  lines.push('');

  lines.push('## Posts by Platform');
  lines.push('');
  lines.push('| Platform | Count |');
  lines.push('|----------|-------|');
  for (var p in state.platformStats) {
    lines.push('| ' + p + ' | ' + state.platformStats[p] + ' |');
  }
  lines.push('');

  lines.push('## Recent Posts');
  lines.push('');
  for (var i = Math.max(0, posted.length - 10); i < posted.length; i++) {
    var p = posted[i];
    var date = p.postedAt ? p.postedAt.slice(0, 10) : 'pending';
    lines.push('- [' + p.platform + '] ' + p.topic + ' (' + date + ')' + (p.url ? ' — ' + p.url : ''));
  }
  lines.push('');

  lines.push('## Queue');
  lines.push('');
  var queued = getQueue('queued');
  for (var i = 0; i < queued.length; i++) {
    lines.push('- [' + queued[i].platform + '] ' + queued[i].topic + ' — created ' + queued[i].created.slice(0, 10));
  }
  lines.push('');
  lines.push('---');
  lines.push('*' + AGENT + '*');

  ensureDir(path.resolve(__dirname, '..', '..', 'reports', 'marketing'));
  var reportPath = path.resolve(__dirname, '..', '..', 'reports', 'marketing', 'weekly-' + new Date().toISOString().slice(0, 10) + '.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  return reportPath;
}

// ─── CLI ───

if (require.main === module) {
  var args = process.argv.slice(2);
  if (args[0] === '--cycle' || args[0] === '-c') {
    runCycle();
  } else if (args[0] === '--report' || args[0] === '-r') {
    var r = generateWeeklyReport();
    console.log('Report: ' + r);
  } else if (args[0] === '--queue' || args[0] === '-q') {
    var q = getQueue(args[1] || 'queued');
    console.log(JSON.stringify(q, null, 2));
  } else if (args[0] === '--mark-posted') {
    markPosted(args[1], args[2]);
    console.log('Marked as posted');
  } else if (args[0] === '--generate') {
    generateDailyQueue();
    console.log('Queue generated');
  } else {
    runCycle();
  }
}

module.exports = { runCycle: runCycle, generateWeeklyReport: generateWeeklyReport, getQueue: getQueue, markPosted: markPosted, generateDailyQueue: generateDailyQueue };
