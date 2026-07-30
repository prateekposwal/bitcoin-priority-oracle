var fs = require('fs');
var path = require('path');
var WebSocket = require('ws');
var { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } = require('nostr-tools/pure');
var { useWebSocketImplementation } = require('nostr-tools/pool');
var { getQueue, markPosted } = require('./ops-center.js');

useWebSocketImplementation(WebSocket);

var KEYS_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'nostr-key.json');
var POST_LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'BSAHI Publisher';

var RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.bitcoiner.social',
  'wss://relay.primal.net'
];

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

function keys() {
  if (fs.existsSync(KEYS_PATH)) {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  }
  var sk = generateSecretKey();
  var pk = getPublicKey(sk);
  var data = { privkey: Buffer.from(sk).toString('hex'), pubkey: pk, createdAt: new Date().toISOString() };
  fs.writeFileSync(KEYS_PATH, JSON.stringify(data, null, 2));
  log('Generated Nostr keypair: ' + pk.slice(0, 16) + '...');
  return data;
}

function hexToBytes(h) {
  var b = new Uint8Array(h.length / 2);
  for (var i = 0; i < h.length; i += 2) b[i / 2] = parseInt(h.substring(i, i + 2), 16);
  return b;
}

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG_PATH, 'utf8')); } catch (e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) {
  fs.writeFileSync(POST_LOG_PATH, JSON.stringify(data, null, 2));
}

async function publishToRelay(wsUrl, event) {
  return new Promise(function(resolve, reject) {
    var ws;
    var timeout = setTimeout(function() {
      try { ws.close(); } catch (e) {}
      resolve({ url: wsUrl, status: 'timeout', eventId: event.id });
    }, 5000);

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      clearTimeout(timeout);
      resolve({ url: wsUrl, status: 'connection_failed', eventId: event.id });
      return;
    }

    ws.on('open', function() {
      var msg = JSON.stringify(['EVENT', event]);
      ws.send(msg);
      // Wait a moment for OK response
      setTimeout(function() {
        clearTimeout(timeout);
        ws.close();
        resolve({ url: wsUrl, status: 'sent', eventId: event.id });
      }, 500);
    });

    ws.on('message', function(data) {
      try {
        var parsed = JSON.parse(data.toString());
        if (parsed[0] === 'OK' && parsed[1] === event.id) {
          clearTimeout(timeout);
          ws.close();
          resolve({ url: wsUrl, status: 'confirmed', eventId: event.id });
        }
      } catch (e) {}
    });

    ws.on('error', function(err) {
      clearTimeout(timeout);
      resolve({ url: wsUrl, status: 'error: ' + err.message, eventId: event.id });
    });

    ws.on('close', function() {
      clearTimeout(timeout);
    });
  });
}

async function publish(content, topic, platform) {
  var k = keys();
  var skB = hexToBytes(k.privkey);

  var tags = [
    ['t', 'Bitcoin'],
    ['t', 'BlockSpace'],
    ['t', 'BSAHI'],
    ['r', 'bitcoinsahi.com']
  ];

  var text = content;
  if (platform === 'nostr') {
    text = content + '\n\n#Bitcoin #BlockSpace #BSAHI';
  }

  var event = finalizeEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: tags,
    content: text
  }, skB);

  var results = await Promise.all(RELAYS.map(function(url) {
    return publishToRelay(url, event);
  }));

  var confirmed = results.filter(function(r) { return r.status === 'confirmed'; }).length;
  var sent = results.filter(function(r) { return r.status === 'sent'; }).length;
  var failed = results.filter(function(r) { return r.status !== 'confirmed' && r.status !== 'sent'; }).length;

  log('Published to ' + RELAYS.length + ' relays: ' + confirmed + ' confirmed, ' + sent + ' sent, ' + failed + ' failed');

  return {
    eventId: event.id,
    platform: platform || 'nostr',
    relays: results,
    confirmedRelays: confirmed,
    totalRelays: RELAYS.length
  };
}

async function runCycle() {
  log('=== Publishing cycle ===');
  var postLog = loadPostLog();
  postLog.cycles++;

  var queued = getQueue('queued');
  if (queued.length === 0) {
    log('Queue empty — generating');
    var { generateDailyQueue } = require('./ops-center.js');
    generateDailyQueue();
    queued = getQueue('queued');
  }

  if (queued.length === 0) { log('Nothing to publish'); return []; }

  var toPublish = queued.slice(0, 2);
  var results = [];

  for (var i = 0; i < toPublish.length; i++) {
    var post = toPublish[i];
    try {
      var result = await publish(post.content, post.topic, 'nostr');
      markPosted(post.id, 'nostr:event:' + result.eventId);
      var entry = {
        id: post.id,
        platform: 'nostr',
        topic: post.topic,
        eventId: result.eventId,
        confirmedRelays: result.confirmedRelays,
        totalRelays: result.totalRelays,
        postedAt: new Date().toISOString(),
        contentPreview: post.content.slice(0, 100)
      };
      results.push(entry);
      postLog.posts.push(entry);
      log('POSTED | ' + post.topic + ' | event: ' + result.eventId.slice(0, 16) + '...');
    } catch (e) {
      log('FAILED | ' + post.topic + ' | ' + e.message);
      results.push({ id: post.id, platform: 'nostr', status: 'failed', error: e.message });
    }
  }

  savePostLog(postLog);
  log(results.length + ' posted');
  generateRSSFeed();
  generateReport();
  log('=== Cycle complete ===');
  return results;
}

function getStats() {
  var postLog = loadPostLog();
  var k = keys();
  var byPlatform = {};
  for (var i = 0; i < postLog.posts.length; i++) {
    var p = postLog.posts[i];
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
  }
  return {
    pubkey: k.pubkey,
    createdAt: k.createdAt,
    totalPosts: postLog.posts.length,
    totalCycles: postLog.cycles,
    byPlatform: byPlatform,
    relays: RELAYS,
    recentPosts: postLog.posts.slice(-5).reverse()
  };
}

function generateRSSFeed() {
  var postLog = loadPostLog();
  var items = postLog.posts.slice(-20);

  var rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
  rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  rss += '<channel>\n';
  rss += '  <title>BSAHI — Block Space Research</title>\n';
  rss += '  <link>https://bitcoinsahi.com</link>\n';
  rss += '  <description>Bitcoin block space economics research from BSAHI — posted to Nostr in real-time</description>\n';
  rss += '  <language>en</language>\n';
  rss += '  <atom:link href="https://bitcoinsahi.com/feed.xml" rel="self" type="application/rss+xml"/>\n';
  rss += '  <lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n';

  for (var i = items.length - 1; i >= 0; i--) {
    var p = items[i];
    rss += '  <item>\n';
    rss += '    <title>' + p.topic + '</title>\n';
    rss += '    <link>https://snort.social/e/' + p.eventId + '</link>\n';
    rss += '    <description><![CDATA[' + p.contentPreview + ']]></description>\n';
    rss += '    <pubDate>' + new Date(p.postedAt).toUTCString() + '</pubDate>\n';
    rss += '    <guid>' + p.eventId + '</guid>\n';
    rss += '  </item>\n';
  }

  rss += '</channel>\n</rss>\n';

  var rssDir = path.resolve(__dirname, '..', '..', 'docs');
  if (!fs.existsSync(rssDir)) fs.mkdirSync(rssDir, { recursive: true });
  var rssPath = path.join(rssDir, 'feed.xml');
  fs.writeFileSync(rssPath, rss);
  log('RSS: ' + rssPath);
  return rssPath;
}

function generateReport() {
  var s = getStats();
  var lines = [];
  lines.push('# BSAHI Publishing Report');
  lines.push('Generated: ' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
  lines.push('');
  lines.push('## Identity');
  lines.push('- Public key: ' + s.pubkey);
  lines.push('- Created: ' + s.createdAt);
  lines.push('- Profile: https://snort.social/p/' + s.pubkey);
  lines.push('');
  lines.push('## Summary');
  lines.push('- Total posts: ' + s.totalPosts);
  lines.push('- Total cycles: ' + s.totalCycles);
  lines.push('- Relays: ' + s.relays.length);
  lines.push('');

  lines.push('## Posts by Platform');
  for (var p in s.byPlatform) {
    lines.push('- ' + p + ': ' + s.byPlatform[p]);
  }
  lines.push('');

  lines.push('## Recent Posts');
  for (var i = 0; i < s.recentPosts.length; i++) {
    var p2 = s.recentPosts[i];
    lines.push('- [' + p2.platform + '] ' + p2.topic + ' — ' + p2.postedAt.slice(0, 10) + ' | [view](https://snort.social/e/' + p2.eventId + ')');
  }
  lines.push('');
  lines.push('---');
  lines.push('*BSAHI Autonomous Publishing Agent — ' + s.totalPosts + ' posts, ' + s.totalCycles + ' cycles*');

  var reportPath = path.resolve(__dirname, '..', '..', 'reports', 'marketing', 'publish-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  return reportPath;
}

if (require.main === module) {
  (async function() {
    var args = process.argv.slice(2);
    if (args[0] === '--stats' || args[0] === '-s') {
      console.log(JSON.stringify(getStats(), null, 2));
    } else if (args[0] === '--rss' || args[0] === '-r') {
      generateRSSFeed();
      console.log('RSS generated');
    } else {
      await runCycle();
    }
  })().catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { runCycle: runCycle, getStats: getStats, generateRSSFeed: generateRSSFeed, generateReport: generateReport };
