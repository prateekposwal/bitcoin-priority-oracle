var { chromium } = require('playwright');
var BSAHI_EMAIL = 'p8015844+bsahi@gmail.com';

async function checkGmailForLink(page, senderHint) {
  console.log('Checking Gmail for magic link...');
  await page.goto('https://mail.google.com/mail/u/0/#inbox', { timeout: 15000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  for (var attempt = 0; attempt < 30; attempt++) {
    var firstEmail = await page.$('tr.zA:first-child');
    if (firstEmail) {
      await firstEmail.click();
      await page.waitForTimeout(2000);

      // Look for verification link
      var html = await page.content();
      var links = html.match(/https?:\/\/[^"'\s]+reddit[^"'\s]*(?:login|verify|link|magic)[^"'\s]*/gi);
      if (links && links.length > 0) {
        return links[0].replace(/&amp;/g, '&');
      }
    }

    console.log('  Waiting for email... (' + (attempt + 1) + ')');
    await page.goto('https://mail.google.com/mail/u/0/#inbox', { timeout: 10000 });
    await page.waitForTimeout(3000);
  }
  return null;
}

async function createRedditAccount() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Go to Reddit login
  await page.goto('https://www.reddit.com/login/', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Reddit login:', page.url().slice(0, 60));

  // Click "Email me a one-time link"
  var magicLinkBtn = await page.$('button:has-text("Email me a one-time link")') || await page.$('div:has-text("Email me a one-time link")');
  if (!magicLinkBtn) {
    // Try finding it by text scanning
    var allDivs = await page.$$('div, button, span');
    for (var i = 0; i < allDivs.length; i++) {
      try {
        var txt = await allDivs[i].textContent();
        if (txt.includes('Email me a one-time link')) {
          magicLinkBtn = allDivs[i];
          console.log('Found magic link option via scan');
          break;
        }
      } catch(e) {}
    }
  }

  if (magicLinkBtn) {
    console.log('Clicking email magic link option...');
    await magicLinkBtn.click();
    await page.waitForTimeout(2000);

    // Enter email via JS (Reddit uses custom web components)
    console.log('Entering email via JS...');
    await page.evaluate(function(email) {
      var el = document.querySelector('faceplate-text-input[name="email"], [name="email"], [type="email"]');
      if (el) { el.value = email; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }, BSAHI_EMAIL);
    await page.waitForTimeout(500);
    console.log('Email entered: ' + BSAHI_EMAIL);

    var sendBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Send")') || await page.$('button:has-text("Email me")') || await page.$('button:has-text("Continue")');
    if (sendBtn) {
      await sendBtn.click();
      console.log('Magic link sent!');
      await page.waitForTimeout(2000);
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Now check Gmail for the magic link
    console.log('\nChecking Gmail for Reddit magic link...');
    var magicLink = await checkGmailForLink(page, 'reddit');

    if (magicLink) {
      console.log('Magic link found: ' + magicLink.slice(0, 80));
      console.log('Opening magic link...');
      await page.goto(magicLink, { timeout: 15000 });
      await page.waitForTimeout(3000);
      console.log('After link:', page.url().slice(0, 80));

      var isLoggedIn = page.url().includes('reddit.com') && !page.url().includes('login');
      console.log('Reddit logged in:', isLoggedIn);

      if (isLoggedIn) {
        // Set username
        console.log('\nSetting username to BSAHI_Research...');
        var unameField = await page.$('input[name="username"]');
        if (unameField) {
          await unameField.fill('BSAHI_Research');
          var saveBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Save")') || await page.$('button:has-text("Continue")');
          if (saveBtn) { await saveBtn.click(); await page.waitForTimeout(2000); }
        }

        // Post to r/Bitcoin
        console.log('\nPosting to r/Bitcoin...');
        await page.goto('https://old.reddit.com/r/Bitcoin/submit', { timeout: 15000 });
        await page.waitForTimeout(2000);
        var t = await page.$('input[name="title"]');
        var tx = await page.$('textarea[name="text"]');
        if (t && tx) {
          await t.fill('BSAHI: Bitcoin Block Space Research');
          await tx.fill('Live Bitcoin block space economics data at bitcoinsahi.com');
          var btn = await page.$('button[name="submit"]') || await page.$('[type="submit"]');
          if (btn) { await btn.click(); await page.waitForTimeout(3000); console.log('✓ Posted to Reddit'); }
        }
      }
    } else {
      console.log('Magic link not found in Gmail');
    }
  } else {
    console.log('Magic link option not found on Reddit login page');
    var body = await page.evaluate(function() { return document.body.textContent; });
    console.log('Page:', body.replace(/\s+/g, ' ').trim().slice(0, 300));
  }

  await browser.close();
  console.log('\nReddit account creation complete');
}

createRedditAccount().catch(function(e) { console.error('Error:', e); process.exit(1); });
