var fs = require('fs');
var path = require('path');
var { chromium } = require('playwright');
var { SimplePool, finalizeEvent } = require('nostr-tools/pure');
var WebSocket = require('ws');

var POST_LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var KEYS_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'nostr-key.json');
var AGENT = 'BSAHI Distributor';

var RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band', 'wss://relay.snort.social'];

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG_PATH, 'utf8')); } catch(e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) {
  fs.writeFileSync(POST_LOG_PATH, JSON.stringify(data, null, 2));
}

function hexToBytes(h) {
  var b = new Uint8Array(h.length / 2);
  for (var i = 0; i < h.length; i += 2) b[i / 2] = parseInt(h.substring(i, i + 2), 16);
  return b;
}

function loadKeys() {
  try { return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8')); } catch(e) { return null; }
}

// ─── GitHub Issues (via API) ───

async function postToGitHub(content, topic) {
  // GitHub API - create issue in block-space-economics repo
  var token = process.env.GH_TOKEN || '';
  if (!token) {
    log('GitHub: no GH_TOKEN set — using repo issues');
    return null;
  }

  try {
    var resp = await fetch('https://api.github.com/repos/prateekposwal/block-space-economics/issues', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        title: 'BSAHI Research: ' + topic.split('-').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' '),
        body: content + '\n\n---\n*Automated research post from BSAHI*',
        labels: ['research', topic]
      })
    });
    var data = await resp.json();
    if (data.html_url) {
      log('GitHub: ' + data.html_url);
      return data.html_url;
    }
    log('GitHub: ' + (data.message || 'unknown error'));
    return null;
  } catch(e) {
    log('GitHub error: ' + e.message);
    return null;
  }
}

// ─── Stacker News (via browser) ───

async function postToStackerNewsPage(page, content, topic) {
  try {
    await page.goto('https://stacker.news/post', { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    log('Stacker News URL: ' + (await page.url()).slice(0, 60));

    var titleField = await page.$('[name="title"]') || await page.$('input[placeholder*="title"]');
    if (!titleField) { log('Stacker News: title field not found'); return null; }

    var title = topic.charAt(0).toUpperCase() + topic.slice(1) + ' — BSAHI Block Space Research';
    await titleField.fill(title);
    await page.waitForTimeout(300);

    var bodyField = await page.$('[role="textbox"]') || await page.$('textarea');
    if (bodyField) await bodyField.fill(content.slice(0, 1000) + '\n\n---\nbitcoinsahi.com');

    var subBtn = await page.$('button[type="submit"]');
    if (subBtn) { await subBtn.click(); await page.waitForTimeout(3000); }
    log('Stacker News: submitted');
    return 'https://stacker.news/';
  } catch(e) {
    log('Stacker News error: ' + e.message);
    return null;
  }
}

// ─── Twitter/X (via bridge) ───

async function postToTwitter(page, content) {
  try {
    await page.goto('https://x.com/home', { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    var postBtn = await page.$('a[data-testid="SideNav_NewTweet_Button"]');
    if (!postBtn) { log('Twitter: not available'); return null; }

    await postBtn.click();
    await page.waitForTimeout(1000);

    var compose = await page.$('[data-testid="tweetTextarea_0"]');
    if (!compose) return null;

    var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
    await compose.fill(text + '\n\n⬡ BSAHI');
    await page.waitForTimeout(500);

    var btn = await page.$('[data-testid="tweetButton"]');
    if (!btn) return null;
    await btn.click();
    await page.waitForTimeout(2000);
    log('Twitter: ✓');
    return 'https://x.com/';
  } catch(e) {
    log('Twitter error: ' + e.message);
    return null;
  }
}

// ─── Reddit (via bridge) ───

async function postToReddit(page, content, topic) {
  try {
    await page.goto('https://www.reddit.com/submit', { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    var titleField = await page.$('[name="title"]');
    if (!titleField) { log('Reddit: not available'); return null; }

    var title = topic.charAt(0).toUpperCase() + topic.slice(1) + ' — BSAHI Research';
    await titleField.fill(title);
    await page.waitForTimeout(300);

    var bodyField = await page.$('[role="textbox"]');
    if (bodyField) await bodyField.fill(content.slice(0, 500) + '\n\n---\nbitcoinsahi.com');

    var btn = await page.$('button[type="submit"]');
    if (!btn) return null;
    await btn.click();
    await page.waitForTimeout(3000);
    log('Reddit: ✓');
    return 'https://reddit.com/r/Bitcoin';
  } catch(e) {
    log('Reddit error: ' + e.message);
    return null;
  }
}

// ─── Main Distribution ───

async function distribute(content, topic) {
  log('Distributing: ' + topic);
  log('Content: ' + content.slice(0, 60) + '...');
  log('');

  var postLog = loadPostLog();
  var results = [];

  // 1. GitHub (via API)
  var ghUrl = await postToGitHub(content, topic);
  if (ghUrl) {
    results.push({ platform: 'github', url: ghUrl });
    postLog.posts.push({ id: 'dist-github-' + Date.now(), platform: 'github', topic: topic, url: ghUrl, postedAt: new Date().toISOString(), contentPreview: content.slice(0, 100) });
  }

  // 2. Browser-based platforms (Twitter, Reddit, Stacker News)
  var keys = loadKeys();
  var profileDir = path.resolve(__dirname, '..', '..', 'profiles', '_bridge');

  if (fs.existsSync(path.join(profileDir, 'Default', 'Cookies'))) {
    var browser = await chromium.launchPersistentContext(profileDir, {
      headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
    });
    var page = await browser.newPage();

    // Try Twitter
    var twUrl = await postToTwitter(page, content);
    if (twUrl) { results.push({ platform: 'twitter', url: twUrl }); postLog.posts.push({ id: 'dist-tw-' + Date.now(), platform: 'twitter', topic: topic, url: twUrl, postedAt: new Date().toISOString(), contentPreview: content.slice(0, 100) }); }

    // Try Reddit
    var rdUrl = await postToReddit(page, content, topic);
    if (rdUrl) { results.push({ platform: 'reddit', url: rdUrl }); postLog.posts.push({ id: 'dist-rd-' + Date.now(), platform: 'reddit', topic: topic, url: rdUrl, postedAt: new Date().toISOString(), contentPreview: content.slice(0, 100) }); }

    // Try Stacker News
    var snUrl = await postToStackerNewsPage(page, content, topic);
    if (snUrl) { results.push({ platform: 'stackernews', url: snUrl }); postLog.posts.push({ id: 'dist-sn-' + Date.now(), platform: 'stackernews', topic: topic, url: snUrl, postedAt: new Date().toISOString(), contentPreview: content.slice(0, 100) }); }

    await browser.close();
  } else {
    log('Bridge profile not found — run: node tools/bridge/index.js --test');
  }

  savePostLog(postLog);

  log('');
  log('══════════════════════════════════════════');
  log('  Distribution results:');
  if (results.length === 0) log('  No platforms available');
  results.forEach(function(r) { log('  ' + r.platform + ': ' + r.url); });
  log('══════════════════════════════════════════');

  return results;
}

// ─── CLI ───

if (require.main === module) {
  var args = process.argv.slice(2);
  var content = args.join(' ') || 'Bitcoin blocks settle $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Lightning adds 4,390 BTC capacity. Settlement at scale — this is Bitcoin\'s killer use case.';
  var topic = 'settlement';

  distribute(content, topic).then(function(r) {
    process.exit(r.length > 0 ? 0 : 1);
  }).catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { distribute: distribute };
