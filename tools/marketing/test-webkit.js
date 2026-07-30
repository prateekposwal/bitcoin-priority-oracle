var { webkit } = require('playwright');

(async function() {
  console.log('=== WebKit Reddit Test ===');
  var browser = await webkit.launchPersistentContext(
    '/Users/prateekposwal/Desktop/block-space-economics/profiles/_safari-test',
    { headless: false, locale: 'en-US' }
  );
  var page = await browser.newPage();
  
  await page.goto('https://www.reddit.com/register/', { timeout: 15000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url().slice(0, 100));
  
  var selectors = ['[name="email"]', '#regEmail', 'input[type="email"]', 'button:has-text("Google")', '[data-testid*="google"]'];
  for (var i = 0; i < selectors.length; i++) {
    var found = false;
    try { found = await page.$(selectors[i]); } catch(e) {}
    if (found) console.log('  Found:', selectors[i]);
  }
  
  await page.screenshot({ path: '/tmp/webkit-reddit.png' });
  console.log('Screenshot: /tmp/webkit-reddit.png');
  
  await browser.close();
  console.log('Done');
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
