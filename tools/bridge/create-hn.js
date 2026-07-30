var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();
  await page.goto('https://news.ycombinator.com/login', { timeout: 20000 });
  await page.waitForTimeout(2000);

  var forms = await page.$$('form');
  console.log('Forms found:', forms.length);

  if (forms.length >= 2) {
    var acct = await forms[1].$('input[name="acct"]');
    var pw = await forms[1].$('input[name="pw"]');
    var btn = await forms[1].$('input[type="submit"]');

    if (acct && pw && btn) {
      console.log('Filling create account form...');
      await acct.fill('BSAHI');
      await pw.fill('BSAHI_Live2024!');
      await btn.click();
      await page.waitForTimeout(3000);
      console.log('URL:', page.url().slice(0, 80));
      var body = await page.evaluate(function() { return document.body.textContent; });
      console.log('Response:', body.replace(/\s+/g, ' ').trim().slice(0, 400));
    } else {
      console.log('Form fields not found');
    }
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error(e); process.exit(1); });
