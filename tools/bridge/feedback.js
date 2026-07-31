#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var SIGNAL_FILE = path.join(__dirname, '..', '..', 'captured-data', 'topic-signal.json');

var TOPICS = ['fees', 'mempool', 'blocks', 'lightning', 'node', 'settlement', 'cost', 'security', 'dev', 'research'];

var TOPIC_KEYWORDS = {
  'fees': ['fee', 'sat/vb', 'fee market', 'fee spike'],
  'mempool': ['mempool', 'backlog', 'unconfirmed'],
  'blocks': ['block', 'block size', 'block space', 'full block'],
  'lightning': ['lightning', 'ln', 'routing', 'channel'],
  'node': ['node', 'storage', 'running a node'],
  'settlement': ['settlement', 'on-chain', 'finality'],
  'cost': ['cost', 'expensive', 'incentive', 'miner revenue'],
  'security': ['security', 'wallet', 'hack', 'stolen'],
  'dev': ['bip', 'upgrade', 'protocol', 'testnet'],
  'research': ['research', 'open data', 'measuring', 'capture', 'study']
};

function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8')); }
  catch (e) { return fallback; }
}

function inferTopic(text) {
  if (!text) return 'research';
  var t = String(text).toLowerCase();
  for (var i = 0; i < TOPICS.length; i++) {
    var topic = TOPICS[i];
    for (var j = 0; j < TOPIC_KEYWORDS[topic].length; j++) {
      if (t.indexOf(TOPIC_KEYWORDS[topic][j]) !== -1) return topic;
    }
  }
  return 'research';
}

function inferTopicFromUrl(url) {
  // Reddit embeds the title slug in the URL — decode underscores/hyphens
  if (!url) return 'research';
  var slug = String(url).split('/').filter(function(s) { return s.length > 5; }).join(' ');
  return inferTopic(slug.replace(/[-_]+/g, ' '));
}

function computeSignals() {
  var now = Date.now();
  var scores = {};
  TOPICS.forEach(function(t) { scores[t] = 0; });
  var events = {};
  TOPICS.forEach(function(t) { events[t] = 0; });
  var lastEvent = {};
  var DAY = 24 * 3600 * 1000;

  function add(topic, weight, ts) {
    var ageDays = (now - ts) / DAY;
    var decay = Math.exp(-ageDays / 7);   // τ = 7 days
    scores[topic] += weight * decay;
    events[topic]++;
    lastEvent[topic] = Math.max(lastEvent[topic] || 0, ts);
  }

  // Reddit comments (comment-state)
  var cs = loadJson('captured-data/comment-state.json', {});
  (cs.commented_threads || []).forEach(function(url) {
    var ts = cs.last_comment || now;
    add(inferTopicFromUrl(url), 2, typeof ts === 'number' ? ts * 1000 : now);
  });

  // Replies received + replied (reply-state) — reply = strongest signal
  var rs = loadJson('captured-data/reply-state.json', {});
  Object.keys(rs.replied || {}).forEach(function(k) {
    var ts = rs.replied[k];
    add(inferTopicFromUrl(k), 3, typeof ts === 'number' ? ts * 1000 : now);
  });

  // LinkedIn/Medium engagement (engage-state done[])
  var es = loadJson('captured-data/engage-state.json', {});
  (es.done || []).forEach(function(d) {
    add(inferTopic(d.key), 1, typeof d.ts === 'number' ? d.ts * 1000 : now);
  });

  // Posts (post-log)
  var pl = loadJson('captured-data/post-log.json', { posts: [] });
  (pl.posts || []).forEach(function(p) {
    var relayRatio = p.confirmedRelays && p.totalRelays ? p.confirmedRelays / p.totalRelays : 1;
    var ts = p.postedAt ? new Date(p.postedAt).getTime() : now;
    add(p.topic || inferTopicFromUrl(p.url), 1.5 * relayRatio, ts);
  });

  // Compliant posts
  var cp = loadJson('captured-data/compliant-posts.json', { posts: [] });
  (cp.posts || []).forEach(function(p) {
    var ts = p.postedAt ? new Date(p.postedAt).getTime() : now;
    add(p.topic || 'research', 2, ts);
  });

  // Weights: min-max normalize into [0.15, 1.0]
  var active = TOPICS.filter(function(t) { return scores[t] > 0; });
  var min = active.length ? Math.min.apply(null, active.map(function(t) { return scores[t]; })) : 0;
  var max = active.length ? Math.max.apply(null, active.map(function(t) { return scores[t]; })) : 0;
  var weights = {};
  TOPICS.forEach(function(t) {
    if (max === min) weights[t] = 0.5;
    else weights[t] = 0.15 + 0.85 * ((scores[t] - min) / (max - min));
  });

  // Declining: active topic with low score and no event in 7 days
  var median = active.length ? active.map(function(t) { return scores[t]; }).sort(function(a, b) { return a - b; })[Math.floor(active.length / 2)] : 0;
  var declining = active.filter(function(t) {
    return scores[t] < 0.3 * median && (!lastEvent[t] || now - lastEvent[t] > 7 * DAY);
  });

  return {
    generated_at: new Date().toISOString(),
    topics: TOPICS.reduce(function(o, t) { o[t] = { score: Math.round(scores[t] * 10) / 10, events: events[t], last_event: lastEvent[t] ? new Date(lastEvent[t]).toISOString() : null }; return o; }, {}),
    weights: weights,
    declining: declining,
    rotating_out: [],
    rotation_cooldown_until: null
  };
}

function writeSignal() {
  var sig = computeSignals();
  // preserve rotating_out from previous generation (2 consecutive declining reads)
  var prev = loadJson('captured-data/topic-signal.json', null);
  if (prev && Array.isArray(prev.rotating_out)) {
    var newlyDeclining = sig.declining.filter(function(t) { return prev.declining.indexOf(t) !== -1; });
    sig.rotating_out = newlyDeclining;
    if (newlyDeclining.length) sig.rotation_cooldown_until = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
  } else {
    sig.rotating_out = [];
  }
  // Exclude rotating topics from weights (floor at 0)
  sig.rotating_out.forEach(function(t) { sig.weights[t] = 0; });
  if (!fs.existsSync(path.dirname(SIGNAL_FILE))) fs.mkdirSync(path.dirname(SIGNAL_FILE), { recursive: true });
  fs.writeFileSync(SIGNAL_FILE, JSON.stringify(sig, null, 2));
  return sig;
}

function getSignal() {
  try { return JSON.parse(fs.readFileSync(SIGNAL_FILE, 'utf8')); }
  catch (e) { return writeSignal(); }
}

function weightedPick(options, weights) {
  var total = options.reduce(function(s, o) { return s + (weights[o] || 0.1); }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < options.length; i++) {
    r -= (weights[options[i]] || 0.1);
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

module.exports = { computeSignals: computeSignals, writeSignal: writeSignal, getSignal: getSignal, weightedPick: weightedPick, inferTopic: inferTopic, inferTopicFromUrl: inferTopicFromUrl, TOPICS: TOPICS, SIGNAL_FILE: SIGNAL_FILE };

if (require.main === module) {
  var sig = writeSignal();
  console.log('Topic signals written:');
  console.log(JSON.stringify(sig, null, 2));
}
