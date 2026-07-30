var fs = require('fs');
var path = require('path');
var WebSocket = require('ws');
var { chromium } = require('playwright');
var { generateSecretKey, getPublicKey, finalizeEvent } = require('nostr-tools/pure');
var { useWebSocketImplementation } = require('nostr-tools/pool');
var { SimplePool } = require('nostr-tools/pool');

useWebSocketImplementation(WebSocket);

var SESSION_DIR = path.resolve(__dirname, '..', '..', 'sessions');
var POST_LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'NostrBridge';

var BSAHI_PUBKEY = 'b4bc93933169b6a288d08a2599832f05ff6b3a72a801a60b5266a29295bcaedc';

var RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social'
];

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

function loadSessions() {
  try { return JSON.parse(fs.readFileSync(path.join(SESSION_DIR, 'active.json'), 'utf8')); } catch(e) { return {}; }
}

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG_PATH, 'utf8')); } catch(e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) {
  fs.writeFileSync(POST_LOG_PATH, JSON.stringify(data, null, 2));
}

async function postToPlatform(platform, content, cookies) {
  if (!cookies || cookies.length === 0) {
    log(platform + ': no session cookies');
    return null;
  }

  var urls = {
    twitter: 'https://x.com/compose/post',
    reddit: 'https://www.reddit.com/r/Bitcoin/submit?type=self'
  };

  var url = urls[platform];
  if (!url) return null;

  try {
    var browser = await chromium.launchPersistentContext(
      path.join(SESSION_DIR, 'bridge-' + platform),
      { headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US' }
    );

    // Inject session cookies
    await browser.addCookies(cookies);

    var page = await browser.newPage();
    await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    var result = null;

    if (platform === 'twitter') {
      var compose = false;
      try { compose = await page.isVisible('[data-testid="tweetTextarea_0"]', { timeout: 3000 }); } catch(e) {}
      if (compose) {
        var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
        await page.fill('[data-testid="tweetTextarea_0"]', text + '\n\n⬡ BSAHI');
        await page.waitForTimeout(500);
        var btn = await page.$('[data-testid="tweetButtonInline"]');
        if (btn) {
          var disabled = await btn.getAttribute('aria-disabled');
          if (disabled !== 'true') {
            await btn.click();
            await page.waitForTimeout(2000);
            result = 'https://x.com/BSAHI';
            log('Twitter: POSTED');
          }
        }
      }
    }

    if (platform === 'reddit') {
      var titleField = false;
      try { titleField = await page.isVisible('[name="title"]', { timeout: 3000 }); } catch(e) {}
      if (titleField) {
        await page.fill('[name="title"]', 'BSAHI Research: Block Space Analysis');
        var body = await page.$('[role="textbox"]');
        if (body) await body.fill(content.slice(0, 1000));
        var btn = await page.$('button[type="submit"]') || await page.$('button:has-text("Post")');
        if (btn) { await btn.click(); await page.waitForTimeout(2000); result = 'https://reddit.com/r/Bitcoin'; log('Reddit: POSTED'); }
      }
    }

    await browser.close();
    return result;

  } catch(e) {
    log(platform + ' posting error: ' + e.message);
    return null;
  }
}

function generateBridgePost(nostrEvent) {
  var content = nostrEvent.content || '';
  var tags = nostrEvent.tags || [];
  var topic = '';
  for (var i = 0; i < tags.length; i++) {
    if (tags[i][0] === 't') { topic = tags[i][1]; break; }
  }

  // Remove hashtags for cleaner cross-posting
  var clean = content.replace(/#\w+/g, '').trim();
  return { content: clean, topic: topic };
}

async function bridgeEvent(nostrEvent) {
  var post = generateBridgePost(nostrEvent);
  var sessions = loadSessions();
  var postLog = loadPostLog();
  var results = [];

  for (var platform in sessions) {
    if (platform === 'twitter' || platform === 'reddit') {
      log('Bridging to ' + platform + '...');
      var url = await postToPlatform(platform, post.content, sessions[platform]);
      if (url) {
        results.push({ platform: platform, url: url });
        postLog.posts.push({
          id: 'bridge-' + Date.now(),
          platform: platform,
          topic: post.topic,
          url: url,
          eventId: nostrEvent.id,
          postedAt: new Date().toISOString(),
          contentPreview: post.content.slice(0, 100)
        });
      }
    }
  }

  savePostLog(postLog);
  return results;
}

async function monitorRelays() {
  log('Connecting to Nostr relays...');
  log('Monitoring pubkey: ' + BSAHI_PUBKEY.slice(0, 16) + '...');

  var pool = new SimplePool();
  var seen = new Set();

  // Subscribe to events from BSAHI pubkey
  pool.subscribeMany(RELAYS, [
    { kinds: [1], authors: [BSAHI_PUBKEY], limit: 1 }
  ], {
    onevent: async function(event) {
      if (seen.has(event.id)) return;
      seen.add(event.id);

      log('New event: ' + event.id.slice(0, 16) + '...');
      log('Content: ' + (event.content || '').slice(0, 60));

      var results = await bridgeEvent(event);
      if (results.length > 0) {
        log('Bridged to ' + results.map(function(r) { return r.platform; }).join(', '));
      }
    },
    oneose: function() {
      log('Monitoring active on ' + RELAYS.length + ' relays');
    }
  });

  // Also poll periodically for events we might have missed
  setInterval(async function() {
    var events = await pool.querySync(RELAYS, {
      kinds: [1], authors: [BSAHI_PUBKEY], since: Math.floor(Date.now() / 1000) - 3600
    });

    for (var i = 0; i < events.length; i++) {
      if (!seen.has(events[i].id)) {
        seen.add(events[i].id);
        log('Found missed event: ' + events[i].id.slice(0, 16) + '...');
        await bridgeEvent(events[i]);
      }
    }
  }, 300000); // every 5 min
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  BSAHI Nostr Bridge                         ║');
  console.log('║  Nostr events → Twitter/Reddit via sessions ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  var sessions = loadSessions();
  var active = Object.keys(sessions);
  log('Active sessions: ' + (active.length > 0 ? active.join(', ') : 'NONE'));

  if (active.length === 0) {
    log('No sessions found. Run: node tools/bridge/session-extract.js');
    return;
  }

  await monitorRelays();

  log('Bridge running. Ctrl+C to stop.');
}

if (require.main === module) {
  run().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}

module.exports = { run: run, bridgeEvent: bridgeEvent };
