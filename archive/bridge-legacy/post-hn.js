var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Post to Hacker News
  await page.goto('https://news.ycombinator.com/submit', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('Submit URL:', page.url().slice(0, 80));

  var titleField = await page.$('input[name="title"]');
  var urlField = await page.$('input[name="url"]');
  var textField = await page.$('textarea[name="text"]');

  console.log('Title:', !!titleField, 'URL:', !!urlField, 'Text:', !!textField);

  if (titleField && urlField) {
    await titleField.fill('BSAHI: Bitcoin Block Space Research — Live Data');
    await urlField.fill('https://bitcoinsahi.com');
    await page.waitForTimeout(300);

    var submitBtn = await page.$('input[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('After submit:', page.url().slice(0, 100));
      var body = await page.evaluate(function() { return document.body.textContent; });
      var hasSuccess = body.includes('BSAHI') || !body.includes('Unknown');
      console.log('Posted:', hasSuccess ? 'YES' : 'Check manually');
      if (hasSuccess) console.log('HACKER NEWS: https://news.ycombinator.com/submitted?id=BSAHI');
    }
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error(e); process.exit(1); });
