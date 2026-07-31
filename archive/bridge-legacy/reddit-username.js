var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Check Reddit account state
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Check if username is set - look for user menu
  var userMenu = await page.$('[data-testid="user-drawer-button"]');
  console.log('User menu:', userMenu ? 'found' : 'not found');

  if (userMenu) {
    await userMenu.click();
    await page.waitForTimeout(1000);
    var body = await page.evaluate(function() { return document.body.textContent; });
    var userMatch = body.match(/u\/[A-Za-z0-9_]+/);
    console.log('Reddit username:', userMatch ? userMatch[0] : 'no username shown');
  }

  // Check the reddit username page
  await page.goto('https://www.reddit.com/r/Bitcoin/submit', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Submit URL:', (await page.url()).slice(0, 100));

  var body2 = await page.evaluate(function() { return document.body.textContent; });
  if (body2.includes('choose a username') || body2.includes('username')) {
    console.log('Username selection needed');
  }

  // Check for any input fields
  var fields = await page.evaluate(function() {
    return Array.from(document.querySelectorAll('input, textarea, [contenteditable], [role="textbox"]')).map(function(el) {
      return { tag: el.tagName, name: el.getAttribute('name'), type: el.getAttribute('type'), id: el.id };
    });
  });
  console.log('Fields:', JSON.stringify(fields, null, 2));

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
