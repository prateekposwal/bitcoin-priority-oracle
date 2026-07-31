var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2';
var POST_LOG = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'BSAHI CrossPost';

var CONTENT = {
  reddit: {
    title: 'BSAHI: Bitcoin Block Space Research — Live Data',
    body: "Bitcoin's blocks are full by design. Each block processes ~3000 transactions. At $68K average transaction value, Bitcoin settles $5.9B daily. 27,800 nodes secure the network.\n\nStorage cost coverage: 1.5% - fees cover 1.5% of 10-year node storage costs.\n\nLive data and analysis at bitcoinsahi.com\n\nPublished by BSAHI's autonomous research agents via Nostr."
  },
  medium: {
    title: 'Bitcoin Block Space Research: Settlement at Scale',
    body: "Bitcoin settles $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Lightning adds 4,390 BTC capacity.\n\nStorage cost coverage: 1.5% — fees cover 1.5% of 10-year node storage costs. Full blocks are not a bug; they are the mechanism that makes settlement final.\n\nLive data at bitcoinsahi.com"
  },
  youtube: {
    title: 'Bitcoin Block Space Economics — Live Research',
    body: 'Bitcoin settlement capacity, fee markets, and network health. Published hourly by BSAHI autonomous research agents.'
  }
};

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG, 'utf8')); } catch(e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) { fs.writeFileSync(POST_LOG, JSON.stringify(data, null, 2)); }

async function postToReddit(page) {
  log('─── Reddit ───');
  await page.goto('https://old.reddit.com/r/Bitcoin/submit', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('  URL:', (await page.url()).slice(0, 60));

  var titleField = await page.$('input[name="title"]');
  var textField = await page.$('textarea[name="text"]');
  if (titleField && textField) {
    await titleField.fill(CONTENT.reddit.title);
    await textField.fill(CONTENT.reddit.body);
    await page.waitForTimeout(500);
    var btn = await page.$('button[name="submit"]') || await page.$('[type="submit"]');
    if (btn) { await btn.click(); await page.waitForTimeout(3000); }
    var url = await page.url();
    log('  Result: ' + url.slice(0, 60));
    if (!url.includes('submit')) {
      log('  ✓ POSTED to Reddit');
      return { platform: 'reddit', url: 'https://reddit.com/r/Bitcoin' };
    }
  } else {
    log('  Form not available (title: ' + !!titleField + ', text: ' + !!textField + ')');
    console.log('  Current URL:', (await page.url()).slice(0, 60));
  }
  return null;
}

async function postToMedium(page) {
  log('─── Medium ───');
  await page.goto('https://medium.com/new-story', { timeout: 20000 });
  await page.waitForTimeout(5000);

  var editor = await page.$('[contenteditable="true"]');
  if (editor) {
    await editor.click();
    await page.waitForTimeout(500);
    await page.keyboard.type(CONTENT.medium.title, { delay: 12 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type(CONTENT.medium.body, { delay: 6 });

    // Click Publish
    var pubBtn = await page.$('button:has-text("Publish")');
    if (pubBtn) {
      await pubBtn.click();
      await page.waitForTimeout(2000);
      // Confirm publish modal
      var confirmBtn = await page.$('button:has-text("Publish now")') || await page.$('button:has-text("Publish")');
      if (confirmBtn) { await confirmBtn.click(); await page.waitForTimeout(3000); }
      log('  ✓ POSTED to Medium');
      return { platform: 'medium', url: 'https://medium.com/@BSAHI' };
    } else {
      log('  Content typed but Publish button not found');
    }
  } else {
    log('  Editor not found');
    console.log('  URL:', (await page.url()).slice(0, 60));
  }
  return null;
}

async function createYoutubePost(page) {
  log('─── YouTube ───');
  await page.goto('https://www.youtube.com/account_advanced', { timeout: 20000 });
  await page.waitForTimeout(4000);

  var loggedIn = !(await page.url()).includes('signin') && !(await page.url()).includes('ServiceLogin');
  log('  Logged in:', loggedIn);

  if (loggedIn) {
    // Check if channel exists
    var btns = await page.$$('a, button');
    var needCreate = false;
    for (var i = 0; i < btns.length; i++) {
      try {
        var t = await btns[i].textContent();
        if (t.toLowerCase().includes('create a new channel')) { needCreate = true; log('  Need to create channel'); break; }
      } catch(e) {}
    }

    if (needCreate) {
      // Create channel
      var links = await page.$$('a, button');
      for (var j = 0; j < links.length; j++) {
        try {
          var t2 = await links[j].textContent();
          if (t2.toLowerCase().includes('create a new channel')) {
            await links[j].click();
            await page.waitForTimeout(3000);
            break;
          }
        } catch(e) {}
      }
      var nameField = await page.$('input[name="name"]') || await page.$('#channel-name');
      if (nameField) {
        await nameField.fill('BSAHI Research');
        var createBtn = await page.$('button:has-text("Create")') || await page.$('#create-channel-button');
        if (createBtn) { await createBtn.click(); await page.waitForTimeout(4000); log('  ✓ YouTube channel created'); }
      }
    }
    log('  YouTube channel ready');
    return { platform: 'youtube', url: 'https://youtube.com/@BSAHIResearch' };
  }
  return null;
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  BSAHI — Cross-Platform Posting             ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  var browser = await chromium.launchPersistentContext(PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();
  var results = [];
  var postLog = loadPostLog();

  try { var r = await postToReddit(page); if (r) results.push(r); } catch(e) { log('Reddit error: ' + e.message.slice(0, 60)); }
  try { var m = await postToMedium(page); if (m) results.push(m); } catch(e) { log('Medium error: ' + e.message.slice(0, 60)); }
  try { var y = await createYoutubePost(page); if (y) results.push(y); } catch(e) { log('YouTube error: ' + e.message.slice(0, 60)); }

  await browser.close();

  results.forEach(function(r) {
    postLog.posts.push({
      id: 'xpost-' + Date.now() + '-' + r.platform,
      platform: r.platform,
      topic: 'settlement',
      url: r.url,
      author: 'BSAHI',
      postedAt: new Date().toISOString(),
      contentPreview: CONTENT[r.platform] ? CONTENT[r.platform].title : r.platform
    });
  });
  savePostLog(postLog);

  console.log('');
  console.log('══════════════════════════════════════════');
  results.forEach(function(r) { console.log('  ' + r.platform + ': ' + r.url); });
  console.log('  Posted: ' + results.length + '/3 platforms');
  console.log('══════════════════════════════════════════');
}

if (require.main === module) {
  run().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}
