var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  console.log('=== Reddit Google SSO (Profile 2) ===');
  await page.goto('https://www.reddit.com/login/', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Find all clickable elements and look for Google
  var allElems = await page.$$('button, a, div, span, [role="button"]');
  var googleBtn = null;
  for (var i = 0; i < allElems.length; i++) {
    try {
      var t = await allElems[i].textContent();
      if (t.includes('Continue with Google') || t.includes('Sign in with Google') || (t.trim() === 'Google')) {
        // Make sure it's a leaf element (small text)
        if (t.trim().length < 30) { googleBtn = allElems[i]; console.log('Found:', t.trim()); break; }
      }
    } catch(e) {}
  }

  if (!googleBtn) {
    // Try Google logo/img
    var googleImgs = await page.$$('img[src*="google"]');
    console.log('Google images:', googleImgs.length);
    if (googleImgs.length > 0) {
      googleBtn = googleImgs[0];
      // Click the parent of the image
      var parent = await googleImgs[0].evaluateHandle(function(el) { return el.parentElement; });
      googleBtn = parent;
    }
  }

  if (googleBtn) {
    console.log('Clicking Google SSO...');
    await googleBtn.click();
    await page.waitForTimeout(5000);

    for (var s = 0; s < 30; s++) {
      await page.waitForTimeout(1000);
      var url = await page.url();
      console.log('  ' + s + ': ' + url.slice(0, 90));

      if (url.includes('reddit.com') && !url.includes('login') && !url.includes('accounts.google') && !url.includes('register')) {
        console.log('  ON REDDIT');
        break;
      }

      // Account picker - select bsahiresearch
      var accts = await page.$$('[data-email]');
      for (var a = 0; a < accts.length; a++) {
        try {
          var email = await accts[a].getAttribute('data-email');
          if (email === 'bsahiresearch@gmail.com') {
            await accts[a].click();
            console.log('  Selected bsahiresearch');
            await page.waitForTimeout(2000);
            break;
          }
        } catch(e) {}
      }
      if (accts.length > 0) continue;

      // Consent
      var consent = await page.$('button:has-text("Continue")') || await page.$('button:has-text("Allow")') || await page.$('button:has-text("Next")') || await page.$('button:has-text("Accept")') || await page.$('[id*="accept"]');
      if (consent) { await consent.click(); await page.waitForTimeout(2000); console.log('  consent'); continue; }
    }
  } else {
    console.log('Google button NOT found');
    var html = await page.evaluate(function() { return document.body.innerHTML; });
    console.log('Contains google text:', html.toLowerCase().includes('google'));
  }

  var finalUrl = await page.url();
  console.log('\nFinal URL:', finalUrl.slice(0, 100));

  // Check if we need to set username
  await page.waitForTimeout(2000);
  var body = await page.evaluate(function() { return document.body.textContent; });
  if (body.toLowerCase().includes('choose a username') || body.toLowerCase().includes('username')) {
    console.log('\n=== Setting username: BSAHI_Research ===');
    var unameField = await page.$('faceplate-text-input[name="username"]') || await page.$('[name="username"]');
    if (unameField) {
      await page.evaluate(function() {
        var el = document.querySelector('faceplate-text-input[name="username"], [name="username"]');
        if (el) { el.value = 'BSAHI_Research'; el.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      await page.waitForTimeout(500);
      var nextBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Continue")') || await page.$('button:has-text("Next")');
      if (nextBtn) { await nextBtn.click(); await page.waitForTimeout(3000); console.log('Username set!'); }
    }
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
