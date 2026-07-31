var fs = require('fs');
var path = require('path');
var WebSocket = require('ws');
var { chromium } = require('playwright');
var { useWebSocketImplementation } = require('nostr-tools/pool');
var { SimplePool } = require('nostr-tools/pool');
useWebSocketImplementation(WebSocket);

var RELAY_DIR = path.resolve(__dirname, '..', '..', 'relay-data');
var AGENT = 'BSAHI Relay';

// Default: BSAHI research pubkey
var BSAHI_PUBKEYS = [
  '44744d037e50a4f3bc6b44b9ca7c5a3f52e68b0f70789696ccb7e28e274d2d61'
];

var NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social'
];

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ─── Account Connection ───

async function connectAccount(platform) {
  var profileDir = path.join(RELAY_DIR, 'profiles', platform);
  ensureDir(profileDir);
  log('Opening browser to connect ' + platform + '...');
  log('Log into your ' + platform + ' account, then close the browser.');

  var urls = {
    twitter: 'https://x.com/',
    reddit: 'https://www.reddit.com/',
    medium: 'https://medium.com/'
  };

  var url = urls[platform];
  if (!url) { log('Unknown platform: ' + platform); return false; }

  var browser = await chromium.launchPersistentContext(profileDir, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });

  var page = await browser.newPage();
  await page.goto(url, { timeout: 20000 });

  log('');
  log('  ┌─────────────────────────────────────────────┐');
  log('  │  1. Log into your ' + platform + ' account             │');
  log('  │  2. Close the browser when done              │');
  log('  │  3. Session saved — never ask again          │');
  log('  └─────────────────────────────────────────────┘');
  log('');

  await new Promise(function(resolve) { browser.on('close', resolve); });
  log(platform + ' account connected ✓');
  return true;
}

async function connectAll() {
  log('=== BSAHI Relay — Account Setup ===');
  log('');
  log('You need accounts on the platforms you want to bridge.');
  log('The browser will open for each platform.');
  log('');

  var platforms = ['twitter', 'reddit'];
  var results = [];

  for (var i = 0; i < platforms.length; i++) {
    var ok = await connectAccount(platforms[i]);
    results.push({ platform: platforms[i], connected: ok });
  }

  log('');
  log('══════════════════════════════════════════');
  results.forEach(function(r) { log('  ' + r.platform + ': ' + (r.connected ? '✓' : '✗')); });
  log('══════════════════════════════════════════');
  return results;
}

// ─── Posting ───

async function postToPlatform(platform, content) {
  var profileDir = path.join(RELAY_DIR, 'profiles', platform);
  if (!fs.existsSync(path.join(profileDir, 'Default', 'Cookies'))) {
    log(platform + ': not connected. Run: node relay-node.js --connect');
    return null;
  }

  var browser = await chromium.launchPersistentContext(profileDir, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();
  var result = null;

  if (platform === 'twitter') {
    await page.goto('https://x.com/compose/post', { timeout: 20000 });
    await page.waitForTimeout(2000);

    var compose = false;
    try { compose = await page.isVisible('[data-testid="tweetTextarea_0"]', { timeout: 3000 }); } catch(e) {}

    if (compose) {
      var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
      await page.fill('[data-testid="tweetTextarea_0"]', text + '\n\n⬡ BSAHI Research');
      await page.waitForTimeout(500);

      var btn = await page.$('[data-testid="tweetButtonInline"]');
      if (btn) {
        var disabled = await btn.getAttribute('aria-disabled');
        if (disabled !== 'true') {
          await btn.click();
          await page.waitForTimeout(2000);
          result = 'https://x.com/';
          log('Twitter: POSTED');
        }
      }
    } else {
      log('Twitter: compose not available (may need fresh login)');
    }
  }

  if (platform === 'reddit') {
    await page.goto('https://www.reddit.com/r/Bitcoin/submit?type=self', { timeout: 20000 });
    await page.waitForTimeout(2000);

    var titleField = false;
    try { titleField = await page.isVisible('[name="title"]', { timeout: 3000 }); } catch(e) {}

    if (titleField) {
      await page.fill('[name="title"]', 'BSAHI Block Space Research');
      var body = await page.$('[role="textbox"]');
      if (body) await page.fill('[role="textbox"]', content.slice(0, 500) + '\n\n---\nbitcoinsahi.com');
      var btn = await page.$('button[type="submit"]');
      if (btn) { await btn.click(); await page.waitForTimeout(2000); result = 'https://reddit.com/r/Bitcoin'; log('Reddit: POSTED'); }
    } else {
      log('Reddit: title field not available');
    }
  }

  await browser.close();
  return result;
}

// ─── Nostr Monitoring ───

async function startRelay() {
  log('=== BSAHI Relay Node starting ===');
  log('Monitoring pubkeys: ' + BSAHI_PUBKEYS.join(', ').slice(0, 40) + '...');
  log('Nostr relays: ' + NOSTR_RELAYS.join(', '));
  log('');

  var pool = new SimplePool();
  var seen = new Set();

  // Subscribe to BSAHI events
  pool.subscribeMany(NOSTR_RELAYS, [
    { kinds: [1], authors: BSAHI_PUBKEYS, limit: 5 }
  ], {
    onevent: async function(event) {
      if (seen.has(event.id)) return;
      seen.add(event.id);
      log('New event: ' + event.id.slice(0, 16));
      log('Content: ' + (event.content || '').slice(0, 60));

      var content = event.content.replace(/#\w+/g, '').trim();

      // Check connected platforms
      var platforms = ['twitter', 'reddit'];
      for (var i = 0; i < platforms.length; i++) {
        var profileDir = path.join(RELAY_DIR, 'profiles', platforms[i]);
        if (fs.existsSync(path.join(profileDir, 'Default', 'Cookies'))) {
          try {
            await postToPlatform(platforms[i], content);
          } catch(e) {
            log(platforms[i] + ' error: ' + e.message.slice(0, 60));
          }
        }
      }
    },
    oneose: function() {
      log('Monitoring active — Ctrl+C to stop');
    }
  });

  // Keep alive
  setInterval(function() {}, 60000);
}

// ─── CLI ───

async function main() {
  var args = process.argv.slice(2);

  if (args[0] === '--connect' || args[0] === '-c') {
    await connectAll();
  } else if (args[0] === '--connect-platform') {
    await connectAccount(args[1]);
  } else if (args[0] === '--run' || args[0] === '-r') {
    await startRelay();
  } else {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  BSAHI Relay Node                                   ║');
    console.log('║                                                    ║');
    console.log('║  Run a relay that amplifies BSAHI research          ║');
    console.log('║  to your Twitter & Reddit accounts.                 ║');
    console.log('║                                                    ║');
    console.log('║  Your accounts → Nostr subscription →              ║');
    console.log('║  → Auto-posts BSAHI content                        ║');
    console.log('║                                                    ║');
    console.log('║  Usage:                                            ║');
    console.log('║    --connect          Connect your accounts         ║');
    console.log('║    --run              Start the relay               ║');
    console.log('║                                                    ║');
    console.log('║  First time:                                       ║');
 console.log('║    node relay-node.js --connect                     ║');
 console.log('║    → Browser opens, log into Twitter + Reddit      ║');
 console.log('║    → Close browser, sessions saved                 ║');
 console.log('║    → node relay-node.js --run                      ║');
 console.log('║                                                    ║');
 console.log('╚══════════════════════════════════════════════════════╝');
 console.log('');
  }
}

if (require.main === module) {
  main().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}

module.exports = { connectAccount: connectAccount, connectAll: connectAll, startRelay: startRelay };
