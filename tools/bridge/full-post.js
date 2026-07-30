var { chromium } = require('playwright');
var path = require('path');

var PROFILE = path.resolve(__dirname, '..', '..', 'profiles', '_bridge');
var AGENT = 'BSAHI Poster';

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

async function postTwitter(page, content) {
  // Start from home page (session works here)
  await page.goto('https://x.com/home', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  log('Twitter home: ' + (await page.url()).slice(0, 60));

  // Click the post button on the home page
  var postBtn = await page.$('a[data-testid="SideNav_NewTweet_Button"], [data-testid="tweetButton"]');
  if (!postBtn) { log('Post button not found'); return null; }
  await postBtn.click();
  await page.waitForTimeout(1000);

  // Type into the compose dialog
  var compose = await page.$('[data-testid="tweetTextarea_0"]');
  if (!compose) { log('Compose dialog not found'); return null; }

  var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
  await compose.fill(text + '\n\n⬡ BSAHI');
  await page.waitForTimeout(500);

  var submitBtn = await page.$('[data-testid="tweetButton"]');
  if (!submitBtn) { log('Submit button not found'); return null; }
  await submitBtn.click();
  await page.waitForTimeout(2000);
  log('Twitter: POSTED ✓');
  return 'https://x.com/';
}

async function postReddit(page, content) {
  // Use the new Reddit submit flow
  await page.goto('https://www.reddit.com/submit', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  log('Reddit submit: ' + (await page.url()).slice(0, 60));

  // Check for post type selection (text vs link)
  var textTab = await page.$('button:has-text("Text")') || await page.$('[data-testid="post-type-text"]');
  if (textTab) await textTab.click();
  await page.waitForTimeout(500);

  var titleField = await page.$('[name="title"]');
  if (!titleField) { log('Title field not found'); return null; }

  await titleField.fill('BSAHI Block Space Research');
  await page.waitForTimeout(300);

  var bodyField = await page.$('[role="textbox"]');
  if (bodyField) await bodyField.fill(content.slice(0, 500) + '\n\n---\nbitcoinsahi.com');

  var submitBtn = await page.$('button[type="submit"]');
  if (!submitBtn) { log('Submit button not found'); return null; }
  await submitBtn.click();
  await page.waitForTimeout(3000);
  log('Reddit: POSTED ✓');
  return 'https://reddit.com/r/Bitcoin';
}

async function postMedium(page, content) {
  await page.goto('https://medium.com/new-story', { timeout: 20000 });
  await page.waitForTimeout(3000);
  log('Medium: ' + (await page.url()).slice(0, 60));

  var editor = await page.$('section[role="region"][contenteditable]');
  if (!editor) editor = await page.$('[contenteditable="true"]');
  if (!editor) { log('Editor not found'); return null; }

  log('Medium: editor ready');
  return null; // Medium requires manual formatting
}

async function run() {
  log('Starting full posting cycle...');

  var browser = await chromium.launchPersistentContext(PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  var content = 'Bitcoin blocks confirm $5.9B in value daily at $68K avg per tx. 27,800 nodes secure the network. Settlement is the killer app — not speculation.';
  var results = [];

  try {
    var t = await postTwitter(page, content);
    if (t) results.push('twitter');
  } catch(e) { log('Twitter error: ' + e.message); }

  try {
    var r = await postReddit(page, content);
    if (r) results.push('reddit');
  } catch(e) { log('Reddit error: ' + e.message); }

  try {
    var m = await postMedium(page, content);
    if (m) results.push('medium');
  } catch(e) { log('Medium error: ' + e.message); }

  await browser.close();

  log('');
  log('══════════════════════════════════════════');
  log('  Posted to: ' + (results.length > 0 ? results.join(', ') : 'NONE'));
  log('  Nostr: already live (5 employees)');
  log('══════════════════════════════════════════');
}

if (require.main === module) {
  run().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}
