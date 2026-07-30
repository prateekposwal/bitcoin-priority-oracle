var fs = require('fs');
var path = require('path');
var { chromium } = require('playwright');

var SESSION_DIR = path.resolve(__dirname, '..', '..', 'sessions');

async function testPost(platform) {
  var sessions = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, 'active.json'), 'utf8'));
  var cookies = sessions[platform];
  if (!cookies || cookies.length === 0) { console.log(platform + ': no cookies'); return; }

  console.log('Testing ' + platform + ' with ' + cookies.length + ' cookies...');

  var browser = await chromium.launchPersistentContext(
    path.join(SESSION_DIR, 'test-' + platform),
    { headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US' }
  );

  await browser.addCookies(cookies);
  var page = await browser.newPage();

  var urls = {
    twitter: 'https://x.com/compose/post',
    reddit: 'https://www.reddit.com/r/Bitcoin/submit?type=self',
    medium: 'https://medium.com/new-story'
  };

  await page.goto(urls[platform], { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('URL:', (await page.url()).slice(0, 100));

  if (platform === 'twitter') {
    var compose = false;
    try { compose = await page.isVisible('[data-testid="tweetTextarea_0"]', { timeout: 3000 }); } catch(e) {}
    console.log('Compose visible:', compose);
    if (compose) {
      await page.fill('[data-testid="tweetTextarea_0"]', 'Bridge test — BSAHI autonomous posting pipeline verified.');
      console.log('Text entered ✓');
      var btn = await page.$('[data-testid="tweetButtonInline"]');
      var disabled = btn ? await btn.getAttribute('aria-disabled') : 'n/a';
      console.log('Post button:', disabled);
    }
  }

  if (platform === 'reddit') {
    var titleField = false;
    try { titleField = await page.isVisible('[name="title"]', { timeout: 3000 }); } catch(e) {}
    console.log('Title field:', titleField);
  }

  await browser.close();
  console.log('Test complete');
}

var platform = process.argv[2] || 'twitter';
testPost(platform).catch(function(e) { console.error('Error:', e); process.exit(1); });
