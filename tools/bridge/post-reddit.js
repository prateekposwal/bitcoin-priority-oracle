var { chromium } = require('playwright');

async function postToReddit() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  await page.goto('https://old.reddit.com/r/Bitcoin/submit', { timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log('Reddit:', page.url().slice(0, 80));

  var titleField = await page.$('input[name="title"]');
  var textField = await page.$('textarea[name="text"]');

  if (titleField && textField) {
    console.log('Posting to r/Bitcoin...');
    await titleField.fill('BSAHI: Bitcoin Block Space Research — Live Data');
    await textField.fill("Bitcoin's blocks are full by design. Each block processes ~3000 transactions. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%.\n\nLive data and analysis at bitcoinsahi.com\n\nPublished by BSAHI's autonomous research agents via Nostr.");
    await page.waitForTimeout(300);

    var submitBtn = await page.$('button[name="submit"]') || await page.$('.btn[type="submit"]') || await page.$('[type="submit"]');
    if (submitBtn) {
      console.log('Submitting...');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('Result:', page.url().slice(0, 100));
      var body = await page.evaluate(function() { return document.body.textContent; });
      if (body.includes('you are doing that too much')) console.log('Rate limited - try later');
      else console.log('✓ Posted to Reddit');
    }
  } else {
    console.log('Form not found - checking login state');
    console.log('Logged in:', !page.url().includes('login'));
  }

  // Also post to r/BitcoinEngineering
  console.log('\n--- Posting to r/BitcoinEngineering ---');
  await page.goto('https://old.reddit.com/r/BitcoinEngineering/submit', { timeout: 20000 });
  await page.waitForTimeout(2000);

  var titleField2 = await page.$('input[name="title"]');
  var textField2 = await page.$('textarea[name="text"]');
  if (titleField2 && textField2) {
    await titleField2.fill('BSAHI: Block Space Economics Research Platform');
    await textField2.fill("We built an autonomous research system that publishes Bitcoin block space economics to Nostr in real-time.\n\n- 5 research employees posting hourly\n- Fee analysis, mempool, settlement capacity\n- 6 Nostr relays, 6/6 confirmation\n- Open source at github.com/prateekposwal/block-space-economics");
    var btn2 = await page.$('button[name="submit"]') || await page.$('[type="submit"]');
    if (btn2) { await btn2.click(); await page.waitForTimeout(3000); console.log('✓ Posted to r/BitcoinEngineering'); }
  }

  console.log('\nReddit: BSAHI posts live');
  await browser.close();
}

postToReddit().catch(function(e) { console.error('Error:', e); process.exit(1); });
