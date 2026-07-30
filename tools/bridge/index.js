var fs = require('fs');
var path = require('path');
var { chromium } = require('playwright');

var CHROME_SOURCE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';
var BRIDGE_PROFILE = path.resolve(__dirname, '..', '..', 'profiles', '_bridge');
var POST_LOG = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'BSAHI Bridge';

var PLATFORMS = {
  twitter: { url: 'https://x.com/compose/post', compose: '[data-testid="tweetTextarea_0"]', submit: '[data-testid="tweetButtonInline"]' },
  reddit: { url: 'https://www.reddit.com/r/Bitcoin/submit?type=self', title: '[name="title"]', body: '[role="textbox"]', submit: 'button[type="submit"]' }
};

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

function ensureProfile() {
  if (fs.existsSync(path.join(BRIDGE_PROFILE, 'Default', 'Cookies'))) return;
  log('Creating bridge profile from Chrome...');
  var essentials = ['Cookies', 'Cookies-journal', 'Login Data', 'Local Storage',
    'Network Persistent State', 'Preferences', 'Secure Preferences', 'Web Data',
    'Bookmarks', 'Top Sites', 'Sessions', 'Accounts'];
  var def = path.join(BRIDGE_PROFILE, 'Default');
  if (!fs.existsSync(def)) fs.mkdirSync(def, { recursive: true });
  essentials.forEach(function(name) {
    var src = path.join(CHROME_SOURCE, name);
    var dst = path.join(def, name);
    try {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
        fs.readdirSync(src).forEach(function(f) { try { fs.copyFileSync(path.join(src, f), path.join(dst, f)); } catch(e) {} });
      } else { fs.copyFileSync(src, dst); }
    } catch(e) {}
  });
  log('Bridge profile created with ' + essentials.length + ' items');
}

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG, 'utf8')); } catch(e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) {
  fs.writeFileSync(POST_LOG, JSON.stringify(data, null, 2));
}

async function postToTwitter(page, content) {
  await page.goto(PLATFORMS.twitter.url, { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  var compose = false;
  try { compose = await page.isVisible(PLATFORMS.twitter.compose, { timeout: 3000 }); } catch(e) {}
  if (!compose) { log('Twitter: compose not available'); return null; }

  var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
  await page.fill(PLATFORMS.twitter.compose, text + '\n\n⬡ BSAHI');
  await page.waitForTimeout(500);

  var btn = await page.$(PLATFORMS.twitter.submit);
  if (!btn) return null;
  var disabled = await btn.getAttribute('aria-disabled');
  if (disabled === 'true') { log('Twitter: button disabled'); return null; }

  await btn.click();
  await page.waitForTimeout(2000);
  log('Twitter: ✓');
  return 'https://x.com/BSAHI';
}

async function postToReddit(page, content, topic) {
  await page.goto(PLATFORMS.reddit.url, { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  var titleField = false;
  try { titleField = await page.isVisible(PLATFORMS.reddit.title, { timeout: 3000 }); } catch(e) {}
  if (!titleField) { log('Reddit: title field not available'); return null; }

  var title = topic ? topic.slice(0, 60) : 'BSAHI Block Space Research';
  await page.fill(PLATFORMS.reddit.title, title + ' — BSAHI');

  var body = await page.$(PLATFORMS.reddit.body);
  if (body) await page.fill(PLATFORMS.reddit.body, content.slice(0, 500) + '\n\n---\nbitcoinsahi.com');

  var btn = await page.$(PLATFORMS.reddit.submit);
  if (!btn) { log('Reddit: submit button not found'); return null; }
  await btn.click();
  await page.waitForTimeout(3000);
  log('Reddit: ✓');
  return 'https://reddit.com/r/Bitcoin';
}

async function postToMedium(page, content, topic) {
  await page.goto('https://medium.com/new-story', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  var editor = false;
  try { editor = await page.isVisible('[contenteditable="true"]', { timeout: 3000 }); } catch(e) {}
  if (editor) { log('Medium: editor ready (manual posting)'); return null; }
  log('Medium: not available');
  return null;
}

async function bridgeAll(content, topic) {
  log('Bridging: ' + topic + ' | ' + content.slice(0, 60) + '...');

  ensureProfile();
  var postLog = loadPostLog();

  var browser = await chromium.launchPersistentContext(BRIDGE_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  var results = [];

  try { var tw = await postToTwitter(page, content); if (tw) results.push({ platform: 'twitter', url: tw }); } catch(e) { log('Twitter error: ' + e.message); }
  try { var rd = await postToReddit(page, content, topic); if (rd) results.push({ platform: 'reddit', url: rd }); } catch(e) { log('Reddit error: ' + e.message); }
  try { var md = await postToMedium(page, content, topic); if (md) results.push({ platform: 'medium', url: md }); } catch(e) {}

  await browser.close();

  results.forEach(function(r) {
    postLog.posts.push({
      id: 'bridge-' + Date.now() + '-' + r.platform,
      platform: r.platform,
      topic: topic,
      url: r.url,
      postedAt: new Date().toISOString(),
      contentPreview: content.slice(0, 100)
    });
  });

  savePostLog(postLog);
  log(results.length + ' platforms posted');
  return results;
}

async function testBridge() {
  log('Testing bridge connections...');
  ensureProfile();

  var browser = await chromium.launchPersistentContext(BRIDGE_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  // Test Twitter
  await page.goto('https://x.com/', { timeout: 15000 });
  await page.waitForTimeout(1000);
  var twOk = !(await page.url()).includes('login') && !(await page.url()).includes('onboarding');
  log('Twitter: ' + (twOk ? '✓' : '✗'));

  // Test Reddit
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(1000);
  var rdOk = !(await page.url()).includes('login') && !(await page.url()).includes('register');
  log('Reddit: ' + (rdOk ? '✓' : '✗'));

  // Test Medium
  await page.goto('https://medium.com/', { timeout: 15000 });
  await page.waitForTimeout(1000);
  var mdOk = !(await page.url()).includes('signin');
  log('Medium: ' + (mdOk ? '✓' : '✗'));

  await browser.close();
  log('Bridge test complete');
}

// CLI
if (require.main === module) {
  var args = process.argv.slice(2);
  if (args[0] === '--test' || args[0] === '-t') {
    testBridge().catch(function(e) { console.error(e); process.exit(1); });
  } else if (args[0] === '--post' || args[0] === '-p') {
    bridgeAll(args[1] || 'BSAHI test post from autonomous bridge', args[2] || 'test').catch(function(e) { console.error(e); process.exit(1); });
  } else {
    bridgeAll(
      'Bitcoin blocks are full by design. Each block processes ~3000 transactions. ' +
      'At $68K avg transaction value, Bitcoin settles $5.9B daily. ' +
      'Storage cost coverage: 1.5% — fees cover 1.5% of 10-year node storage costs. ' +
      'This is the economics of block space.',
      'Block Space Economics'
    ).catch(function(e) { console.error(e); process.exit(1); });
  }
}

module.exports = { bridgeAll: bridgeAll, ensureProfile: ensureProfile };
