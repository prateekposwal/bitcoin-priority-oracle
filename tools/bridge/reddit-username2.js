var { chromium } = require('playwright-extra');
var StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'], locale: 'en-US' }
  );
  var page = await browser.newPage();

  // Try to complete the username step - navigate to register
  await page.goto('https://www.reddit.com/register/', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Register URL:', (await page.url()).slice(0, 80));

  // Check if Google account is pre-selected
  var body = await page.evaluate(function() { return document.body.textContent; });
  console.log('Has bsahiresearch:', body.includes('bsahiresearch'));

  // Look for username field
  var usernameField = await page.$('input[name="username"], faceplate-text-input[name="username"]');
  console.log('Username field:', usernameField ? 'found' : 'not found');

  if (usernameField) {
    // Set username via JS
    await page.evaluate(function() {
      var el = document.querySelector('input[name="username"], faceplate-text-input[name="username"]');
      if (el) { el.value = 'BSAHI_Research'; el.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.waitForTimeout(500);
    console.log('Username set: BSAHI_Research');

    var nextBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Continue")') || await page.$('button:has-text("Next")');
    if (nextBtn) { await nextBtn.click(); await page.waitForTimeout(3000); console.log('Clicked next'); }
  } else {
    console.log('No username field - checking state');
    console.log('Page sample:', body.replace(/\s+/g, ' ').slice(0, 200));
  }

  // Check if we're now logged in
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var url = await page.url();
  console.log('After:', url.slice(0, 60));

  // Try submit again
  await page.goto('https://www.reddit.com/r/Bitcoin/submit', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var submitUrl = await page.url();
  console.log('Submit URL:', submitUrl.slice(0, 80));
  var loggedIn = !submitUrl.includes('login');
  console.log('Logged in:', loggedIn);

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
