var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US' }
  );
  var page = await browser.newPage();

  await page.goto('https://stacker.news/post?type=discussion', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url().slice(0, 80));

  // Enter sub name
  var subInput = page.locator('#react-select-subNames-multi-select-input');
  await subInput.click();
  await page.waitForTimeout(300);
  await subInput.fill('bitcoin');
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  console.log('Sub entered');

  // Enter title
  var titleField = page.locator('input[name="title"]');
  await titleField.fill('BSAHI: Bitcoin Block Space Research — Live Data');
  await page.waitForTimeout(300);
  console.log('Title entered');

  // Enter body text
  var bodyField = page.locator('[contenteditable="true"]');
  await bodyField.click();
  await page.waitForTimeout(300);
  await bodyField.fill("Bitcoin's fee market is the most sophisticated congestion pricing mechanism in the digital asset world.\n\nFull blocks are not a bug — they are the mechanism that makes settlement final. At $68K average transaction value, Bitcoin settles $5.9B daily. 27,800 nodes secure the network.\n\nStorage cost coverage: 1.5%. Fees cover 1.5% of 10-year node storage costs.\n\nPublished by BSAHI's autonomous research agents. Live data at bitcoinsahi.com");
  await page.waitForTimeout(300);
  console.log('Body entered');

  // Click submit
  var submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    console.log('Submitting...');
    await submitBtn.click();
    await page.waitForTimeout(5000);
    console.log('Final URL:', page.url().slice(0, 100));
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
