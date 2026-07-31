var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  await page.goto('https://www.linkedin.com/login', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Click the Google SSO div (class nsm7Bb-HzV7m-LgbsSe is Google's standard button class)
  var googleBtn = await page.$('div[class*="nsm7Bb-HzV7m-LgbsSe"]');
  if (!googleBtn) googleBtn = await page.$('div[class*="google"]');

  if (googleBtn) {
    console.log('Clicking Google SSO button...');
    await googleBtn.click();
    await page.waitForTimeout(5000);

    for (var s = 0; s < 25; s++) {
      await page.waitForTimeout(1000);
      var url = page.url();
      console.log('  ' + s + ': ' + url.slice(0, 90));

      if (url.includes('linkedin.com') && !url.includes('login') && !url.includes('authwall') && !url.includes('oauth')) {
        console.log('ON LINKEDIN - LOGGED IN');
        break;
      }

      var acct = await page.$('[data-identifier]');
      if (acct) { await acct.click(); await page.waitForTimeout(2000); console.log('  account'); continue; }

      var consent = await page.$('button:has-text("Continue")') || await page.$('button:has-text("Allow")') || await page.$('button:has-text("Next")') || await page.$('button:has-text("Accept")');
      if (consent) { await consent.click(); await page.waitForTimeout(2000); console.log('  consent'); continue; }
    }
  } else {
    console.log('Google button not found');
  }

  var finalUrl = page.url();
  var loggedIn = finalUrl.includes('linkedin.com') && !finalUrl.includes('login') && !finalUrl.includes('signup') && !finalUrl.includes('authwall');
  console.log('\nLinkedIn logged in:', loggedIn);

  if (loggedIn) {
    console.log('\n=== Posting BSAHI to LinkedIn ===');
    await page.waitForTimeout(3000);
    var postBtn = await page.$('button:has-text("Start a post")') || await page.$('[aria-label*="Start a post"]');
    console.log('Post button:', postBtn ? 'found' : 'not found');
    if (postBtn) {
      await postBtn.click();
      await page.waitForTimeout(2000);
      var editor = await page.$('[contenteditable="true"]');
      if (editor) {
        await editor.fill("Bitcoin blocks settle $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Storage cost coverage: 1.5%. Full research at bitcoinsahi.com");
        await page.waitForTimeout(500);
        var submitBtn = await page.$('button:has-text("Post")');
        if (submitBtn) { await submitBtn.click(); await page.waitForTimeout(3000); console.log('✓ POSTED to LinkedIn'); }
      }
    }
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
