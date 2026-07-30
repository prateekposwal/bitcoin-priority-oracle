var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // 1. Medium profile setup
  console.log('=== Setting up Medium profile ===');
  await page.goto('https://medium.com/me/settings', { timeout: 20000 });
  await page.waitForTimeout(3000);

  var dn = await page.$('input[name="displayName"]');
  if (!dn) dn = await page.$('input[placeholder*="Name"]');
  if (dn) {
    await dn.fill('BSAHI');
    var sv = await page.$('button:has-text("Save")');
    if (sv) await sv.click();
    console.log('Profile name set to BSAHI');
  }

  // 2. Post to Medium
  console.log('\n=== Posting to Medium ===');
  await page.goto('https://medium.com/new-story', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Editor URL:', page.url().slice(0, 80));

  var editor = await page.$('[contenteditable="true"]');
  if (editor) {
    await editor.click();
    await page.waitForTimeout(300);
    await page.keyboard.type('Bitcoin Block Space Research', { delay: 15 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type("Bitcoin settles $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Lightning adds 4,390 BTC capacity.\n\nStorage cost coverage: 1.5% - fees cover 1.5% of 10-year node storage costs. Full blocks are not a bug, they are the mechanism that makes settlement final.\n\nbitcoinsahi.com", { delay: 10 });

    console.log('Content entered');

    var pubBtn = await page.$('button:has-text("Publish")');
    if (pubBtn) {
      await pubBtn.click();
      await page.waitForTimeout(3000);
      console.log('Published!');
    } else {
      console.log('Publish button not found (may need to set tags first)');
    }

    var finalUrl = await page.url();
    console.log('Final URL:', finalUrl.slice(0, 100));
  } else {
    console.log('Editor not found');
  }

  console.log('\n✓ Medium: @BSAHI');
  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error(e); process.exit(1); });
