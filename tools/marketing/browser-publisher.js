var { chromium } = require('playwright');
var path = require('path');
var fs = require('fs');
var { getQueue, markPosted } = require('./ops-center.js');

var CHROME_PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';
var POST_LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'BSAHI Browser Publisher';

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG_PATH, 'utf8')); } catch (e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) {
  fs.writeFileSync(POST_LOG_PATH, JSON.stringify(data, null, 2));
}

async function postToTwitter(page, content, topic) {
  log('Twitter: navigating to compose...');
  await page.goto('https://x.com/compose/post', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  var composeVisible = false;
  try { composeVisible = await page.isVisible('[data-testid="tweetTextarea_0"]', { timeout: 5000 }); } catch(e) {}

  if (!composeVisible) {
    log('Twitter: compose not available');
    return null;
  }

  var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
  text += '\n\n📊 BSAHI — bitcoinsahi.com';
  if (text.length > 280) text = text.slice(0, 277) + '...';

  await page.fill('[data-testid="tweetTextarea_0"]', text);
  await page.waitForTimeout(500);

  var postBtn = await page.$('[data-testid="tweetButtonInline"]');
  if (!postBtn) {
    log('Twitter: post button not found');
    return null;
  }

  var disabled = await postBtn.getAttribute('aria-disabled');
  if (disabled === 'true') {
    log('Twitter: post button disabled');
    return null;
  }

  await postBtn.click();
  await page.waitForTimeout(2000);
  log('Twitter: POSTED ✓');
  return 'https://x.com/BSAHI';
}

async function postToReddit(page, content, topic) {
  log('Reddit: navigating to submit...');
  await page.goto('https://www.reddit.com/r/Bitcoin/submit', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  var titleField = false;
  try { titleField = await page.isVisible('[name="title"]', { timeout: 3000 }); } catch(e) {}

  if (!titleField) {
    log('Reddit: submit form not available');
    // Try self post
    await page.goto('https://www.reddit.com/r/Bitcoin/submit?type=self', { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    try { titleField = await page.isVisible('[name="title"]', { timeout: 3000 }); } catch(e) {}
    if (!titleField) return null;
  }

  var title = topic.length > 60 ? topic.slice(0, 57) + '...' : topic;
  title += ' | BSAHI Research';

  await page.fill('[name="title"]', title);
  await page.waitForTimeout(300);

  // Try filling text/body
  var bodyField = false;
  try { bodyField = await page.isVisible('[role="textbox"]', { timeout: 2000 }); } catch(e) {}
  if (bodyField) {
    await page.fill('[role="textbox"]', content.slice(0, 500) + '\n\n---\n📊 bitcoinsahi.com');
  }

  // Look for submit button
  var submitBtn = false;
  try {
    submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) submitBtn = await page.$('button:has-text("Post")');
  } catch(e) {}

  if (!submitBtn) {
    log('Reddit: submit button not found');
    return null;
  }

  await submitBtn.click();
  await page.waitForTimeout(3000);
  log('Reddit: POSTED ✓');
  return 'https://www.reddit.com/r/Bitcoin/';
}

async function postToMedium(page, content, topic) {
  log('Medium: navigating...');
  await page.goto('https://medium.com/new-story', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  var editor = false;
  try { editor = await page.isVisible('[data-testid="editor"]', { timeout: 3000 }); } catch(e) {}
  try { if (!editor) editor = await page.isVisible('[contenteditable="true"]', { timeout: 2000 }); } catch(e) {}

  if (!editor) {
    log('Medium: editor not available (may need login)');
    return null;
  }

  // Medium editor is complex
  log('Medium: editor available but requires manual interaction');
  return null;
}

async function runCycle() {
  log('=== Browser publishing cycle ===');
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

  var post = queued[0];
  var results = [];

  log('Launching Chrome...');
  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false,
    channel: 'chrome',
    args: ['--no-sandbox', '--window-size=1280,800'],
    locale: 'en-US',
    viewport: { width: 1280, height: 800 }
  });

  try {
    var page = await browser.newPage();

    // Twitter
    try {
      var twResult = await postToTwitter(page, post.content, post.topic);
      if (twResult) {
        markPosted(post.id, twResult);
        postLog.posts.push({ id: post.id, platform: 'twitter', topic: post.topic, url: twResult, postedAt: new Date().toISOString() });
        results.push({ platform: 'twitter', status: 'posted', url: twResult });
      }
    } catch(e) { log('Twitter error: ' + e.message); results.push({ platform: 'twitter', status: 'failed', error: e.message }); }

    // Reddit
    // Use a different post for Reddit if available
    var rdPost = queued[1] || post;
    try {
      var rdResult = await postToReddit(page, rdPost.content, rdPost.topic);
      if (rdResult) {
        markPosted(rdPost.id, rdResult);
        postLog.posts.push({ id: rdPost.id, platform: 'reddit', topic: rdPost.topic, url: rdResult, postedAt: new Date().toISOString() });
        results.push({ platform: 'reddit', status: 'posted', url: rdResult });
      }
    } catch(e) { log('Reddit error: ' + e.message); results.push({ platform: 'reddit', status: 'failed', error: e.message }); }

    // Medium
    try {
      var mdResult = await postToMedium(page, post.content, 'BSAHI: ' + post.topic);
      if (mdResult) {
        markPosted(post.id, mdResult);
        postLog.posts.push({ id: post.id, platform: 'medium', topic: post.topic, url: mdResult, postedAt: new Date().toISOString() });
        results.push({ platform: 'medium', status: 'posted', url: mdResult });
      }
    } catch(e) { log('Medium error: ' + e.message); results.push({ platform: 'medium', status: 'failed', error: e.message }); }

  } finally {
    await browser.close();
  }

  savePostLog(postLog);

  var posted = results.filter(function(r) { return r.status === 'posted'; });
  log(results.length + ' platforms attempted, ' + posted.length + ' posted');
  log('=== Cycle complete ===');
  return results;
}

if (require.main === module) {
  (async function() {
    var args = process.argv.slice(2);
    if (args[0] === '--test') {
      log('Launching Chrome for test...');
      var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
        headless: false, channel: 'chrome',
        args: ['--no-sandbox', '--window-size=1280,800'],
        locale: 'en-US', viewport: { width: 1280, height: 800 }
      });
      var page = await browser.newPage();
      await page.goto('https://x.com/', { timeout: 20000 });
      log('Session check: ' + page.url());
      // Test each platform
      await postToTwitter(page, 'BSAHI test post — verifying autonomous publishing pipeline', 'test');
      await page.waitForTimeout(2000);
      await browser.close();
      log('Test complete');
    } else {
      await runCycle();
    }
  })().catch(function(e) { console.error('Fatal:', e.message); process.exit(1); });
}

module.exports = { runCycle: runCycle };
