var { chromium } = require('playwright-extra');
var StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'], locale: 'en-US' }
  );
  var page = await browser.newPage();

  await page.goto('https://www.reddit.com/', { timeout: 20000 });
  await page.waitForTimeout(4000);

  // Check login state
  var state = await page.evaluate(function() {
    var body = document.body.textContent;
    return {
      hasLogin: body.toLowerCase().includes('log in'),
      hasAvatar: !!document.querySelector('[data-testid="user-drawer-button"], shreddit-avatar'),
      hasPostBtn: !!document.querySelector('[data-testid*="post"], a[href*="/submit"]'),
      bodySample: body.replace(/\s+/g, ' ').slice(0, 300)
    };
  });
  console.log('State:', JSON.stringify(state, null, 2));

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
