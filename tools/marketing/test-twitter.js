var { chromium } = require('playwright');
var CHROME_PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';

(async function() {
  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--window-size=1280,800'
    ],
    locale: 'en-US',
    viewport: { width: 1280, height: 800 }
  });

  var page = await browser.newPage();

  console.log('=== Testing platform sessions (non-headless) ===\n');

  // Twitter
  console.log('Opening Twitter...');
  await page.goto('https://x.com/', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  var twUrl = page.url();
  console.log('Twitter URL:', twUrl.slice(0, 100));
  var twLoggedIn = !twUrl.includes('login') && !twUrl.includes('onboarding');
  console.log('Twitter logged in:', twLoggedIn);

  // Reddit
  console.log('\nOpening Reddit...');
  await page.goto('https://www.reddit.com/', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  var rdUrl = page.url();
  console.log('Reddit URL:', rdUrl.slice(0, 100));
  var rdLoggedIn = !rdUrl.includes('solution') && !rdUrl.includes('js_challenge');
  console.log('Reddit logged in:', rdLoggedIn);

  // Medium
  console.log('\nOpening Medium...');
  await page.goto('https://medium.com/', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  var mdUrl = page.url();
  console.log('Medium URL:', mdUrl.slice(0, 100));
  var avatarVisible = false;
  try { avatarVisible = await page.isVisible('[data-testid="headerAvatar"]', { timeout: 2000 }); } catch(e) {}
  console.log('Medium avatar visible:', avatarVisible);

  await browser.close();
  console.log('\n=== DONE ===');
})().catch(function(e) { console.error('Error:', e.message); process.exit(1); });
