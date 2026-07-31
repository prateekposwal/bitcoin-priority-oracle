var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    {
      headless: false,
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
      locale: 'en-US'
    }
  );
  var page = await browser.newPage();
  await page.addInitScript(function() {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  // Try new Reddit submit
  console.log('=== New Reddit submit ===');
  await page.goto('https://www.reddit.com/r/Bitcoin/submit', { timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log('URL:', (await page.url()).slice(0, 100));

  var loggedIn = !(await page.url()).includes('login');
  console.log('Logged in:', loggedIn);

  if (loggedIn) {
    // Check for the submit form elements
    var fields = await page.evaluate(function() {
      return Array.from(document.querySelectorAll('input, textarea, [contenteditable], [role="textbox"]')).slice(0, 10).map(function(el) {
        return { tag: el.tagName, name: el.getAttribute('name'), type: el.getAttribute('type'), id: el.id };
      });
    });
    console.log('Fields:', JSON.stringify(fields, null, 2));
  } else {
    console.log('Redirected to login');
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
