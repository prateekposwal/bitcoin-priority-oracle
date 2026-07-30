var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();
  page.on('response', function(response) {
    if (response.url().includes('reddit')) {
      console.log('Response:', response.status(), response.url().slice(0, 80));
    }
  });

  // Step 1: Go to Reddit homepage first (establish base session)
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log('Home:', page.url().slice(0, 60));

  // Step 2: Navigate to Google OAuth authorize URL
  // The format Reddit uses
  await page.goto('https://www.reddit.com/api/v1/authorize/google?dest=https%3A%2F%2Fwww.reddit.com%2F', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('OAuth:', page.url().slice(0, 100));

  // Step 3: Handle Google
  for (var i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    var url = page.url();
    console.log('  ' + i + ': ' + url.slice(0, 100));

    // Back on Reddit?
    if (url.includes('reddit.com') && !url.includes('google') && !url.includes('accounts')) {
      console.log('ON REDDIT');
      break;
    }

    // Account picker
    var acct = await page.$('[data-identifier]');
    if (acct) { console.log('  clicking account'); await acct.click(); await page.waitForTimeout(2000); continue; }

    // Consent
    var consent = await page.$('button:has-text("Continue")') || await page.$('button:has-text("Allow")') || await page.$('button:has-text("Next")') || await page.$('[id*="accept"]');
    if (consent) { console.log('  clicking consent'); await consent.click(); await page.waitForTimeout(2000); continue; }

    // Any other button
    var anyBtn = await page.$('[role="button"]') || await page.$('button:not([aria-hidden])');
    if (anyBtn) {
      try {
        var txt = await anyBtn.textContent();
        if (txt && !txt.includes('reCAPTCHA') && !txt.includes('security')) {
          console.log('  clicking:', (txt || '').trim().slice(0, 30));
          await anyBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch(e) {}
    }
  }

  var finalUrl = page.url();
  console.log('\nFinal:', finalUrl.slice(0, 80));
  console.log('Logged in:', finalUrl.includes('reddit.com') && !finalUrl.includes('login') && !finalUrl.includes('register') && !finalUrl.includes('google'));

  // Now try to post
  var loggedIn = finalUrl.includes('reddit.com') && !finalUrl.includes('login') && !finalUrl.includes('register');
  if (loggedIn) {
    await page.goto('https://old.reddit.com/r/Bitcoin/submit', { timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('Submit:', page.url().slice(0, 80));
    var t = await page.$('input[name="title"]');
    if (t) { console.log('Can post: YES'); await t.fill('BSAHI Test'); }
    else console.log('Can post: NO - needs account setup');
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
