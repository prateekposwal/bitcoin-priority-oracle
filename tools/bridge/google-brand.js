var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Create a Google Brand Account (no phone verification needed - attached to existing account)
  console.log('=== Creating Google Brand Account ===');
  await page.goto('https://myaccount.google.com/brandaccounts', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Brand accounts page:', page.url().slice(0, 80));

  // Look for create brand account button
  var createBtn = await page.$('button:has-text("Create")') || await page.$('a:has-text("Create")') || await page.$('[aria-label*="Create"]');
  if (!createBtn) {
    var allBtns = await page.$$('button, a, [role="button"]');
    for (var i = 0; i < allBtns.length; i++) {
      try {
        var t = await allBtns[i].textContent();
        if (t.toLowerCase().includes('create') || t.toLowerCase().includes('brand')) {
          createBtn = allBtns[i];
          console.log('Found create button:', t.trim());
          break;
        }
      } catch(e) {}
    }
  }

  if (createBtn) {
    console.log('Clicking create brand account...');
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Fill in brand account name
    var nameField = await page.$('input[name="name"]') || await page.$('[name="displayName"]');
    if (nameField) {
      await nameField.fill('BSAHI');
      var nextBtn = await page.$('button:has-text("Next")') || await page.$('button:has-text("Continue")');
      if (nextBtn) { await nextBtn.click(); await page.waitForTimeout(2000); }
    }
  } else {
    console.log('Create button not found');
    var body = await page.evaluate(function() { return document.body.textContent; });
    console.log('Page:', body.replace(/\s+/g, ' ').trim().slice(0, 300));
  }

  await page.waitForTimeout(2000);
  console.log('Final URL:', page.url().slice(0, 100));
  var finalBody = await page.evaluate(function() { return document.body.textContent; });
  console.log('Brand account created:', finalBody.includes('BSAHI') || page.url().includes('brandaccount'));

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
