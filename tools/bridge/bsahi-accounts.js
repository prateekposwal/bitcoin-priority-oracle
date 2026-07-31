var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2';
var RESULT_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi-accounts.json');

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] ' + msg); }

function saveResult(data) {
  fs.writeFileSync(RESULT_PATH, JSON.stringify(data, null, 2));
}

async function setupMedium(page) {
  log('─── Medium: setting up @BSAHI profile ───');
  await page.goto('https://medium.com/me/settings', { timeout: 20000 });
  await page.waitForTimeout(3000);

  var dn = await page.$('input[name="displayName"]');
  if (dn) {
    await dn.fill('BSAHI');
    var sv = await page.$('button:has-text("Save")');
    if (sv) { await sv.click(); await page.waitForTimeout(1000); log('  Profile name: BSAHI'); }
  }

  var bio = await page.$('textarea[name="bio"]');
  if (bio) {
    await bio.fill('Bitcoin block space research. Fees, mempool, settlement capacity.');
    log('  Bio set');
  }
}

async function createYoutube(page) {
  log('─── YouTube: creating BSAHI channel ───');
  await page.goto('https://www.youtube.com/account_advanced', { timeout: 20000 });
  await page.waitForTimeout(3000);
  log('  URL:', (await page.url()).slice(0, 60));

  var ytLoggedIn = !(await page.url()).includes('signin') && !(await page.url()).includes('ServiceLogin');
  log('  YouTube logged in:', ytLoggedIn);

  if (ytLoggedIn) {
    var btns = await page.$$('a, button');
    var clicked = false;
    for (var i = 0; i < btns.length; i++) {
      try {
        var t = await btns[i].textContent();
        if (t.toLowerCase().includes('create a new channel') || t.toLowerCase().includes('create channel')) {
          await btns[i].click();
          clicked = true;
          log('  Clicked create channel');
          await page.waitForTimeout(3000);
          break;
        }
      } catch(e) {}
    }

    if (clicked) {
      var nameField = await page.$('input[name="name"]');
      if (nameField) {
        await nameField.fill('BSAHI Research');
        await page.waitForTimeout(300);
        var createBtn = await page.$('button:has-text("Create")') || await page.$('button:has-text("Next")');
        if (createBtn) { await createBtn.click(); await page.waitForTimeout(3000); log('  ✓ YouTube channel created: BSAHI Research'); }
      }
    }
  }
}

async function checkGmailForRedditLink(page) {
  log('  Checking Gmail for Reddit magic link...');
  await page.goto('https://mail.google.com/mail/u/0/#inbox', { timeout: 15000 });
  await page.waitForTimeout(2000);

  for (var i = 0; i < 20; i++) {
    var first = await page.$('tr.zA:first-child');
    if (first) {
      await first.click();
      await page.waitForTimeout(2000);
      var html = await page.content();
      var links = html.match(/https?:\/\/[^"'\s]+reddit[^"'\s]*(?:login|verify|link|magic|authorize)[^"'\s]*/gi);
      if (links && links.length > 0) return links[0].replace(/&amp;/g, '&');
    }
    log('  Waiting for email... (' + (i+1) + ')');
    await page.goto('https://mail.google.com/mail/u/0/#inbox', { timeout: 10000 });
    await page.waitForTimeout(3000);
  }
  return null;
}

async function createReddit(page) {
  log('─── Reddit: magic link login ───');
  await page.goto('https://www.reddit.com/login/', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Click "Email me a one-time link"
  var magicBtn = null;
  var divs = await page.$$('div, button, span');
  for (var i = 0; i < divs.length; i++) {
    try {
      var t = await divs[i].textContent();
      if (t.includes('Email me a one-time link')) { magicBtn = divs[i]; break; }
    } catch(e) {}
  }

  if (magicBtn) {
    log('  Clicking email magic link option');
    await magicBtn.click();
    await page.waitForTimeout(2000);

    // Enter email via JS
    await page.evaluate(function() {
      var el = document.querySelector('faceplate-text-input[name="email"], [name="email"], [type="email"]');
      if (el) { el.value = 'bsahiresearch@gmail.com'; el.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.waitForTimeout(500);

    var sendBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Send")') || await page.$('button:has-text("Continue")');
    if (sendBtn) { await sendBtn.click(); log('  Magic link sent'); await page.waitForTimeout(2000); }
    else { await page.keyboard.press('Enter'); log('  Magic link sent (Enter)'); await page.waitForTimeout(2000); }

    var link = await checkGmailForRedditLink(page);
    if (link) {
      log('  Magic link found, opening...');
      await page.goto(link, { timeout: 15000 });
      await page.waitForTimeout(3000);
      var loggedIn = (await page.url()).includes('reddit.com') && !(await page.url()).includes('login');
      log('  Reddit logged in:', loggedIn);
      return loggedIn;
    } else {
      log('  Magic link not received');
    }
  } else {
    log('  Magic link option not found');
  }
  return false;
}

async function createLinkedIn(page) {
  log('─── LinkedIn: Google SSO ───');
  await page.goto('https://www.linkedin.com/login', { timeout: 20000 });
  await page.waitForTimeout(3000);

  var googleBtn = await page.$('div[class*="nsm7Bb-HzV7m-LgbsSe"]') || await page.$('div[class*="google"]');
  if (!googleBtn) {
    var btns = await page.$$('button, a, [role="button"]');
    for (var i = 0; i < btns.length; i++) {
      try {
        var t = await btns[i].textContent();
        if (t.includes('Continue with Google')) { googleBtn = btns[i]; break; }
      } catch(e) {}
    }
  }

  if (googleBtn) {
    log('  Clicking Google SSO');
    await googleBtn.click();
    await page.waitForTimeout(5000);

    for (var s = 0; s < 15; s++) {
      await page.waitForTimeout(1000);
      var url = await page.url();
      if (url.includes('linkedin.com') && !url.includes('login') && !url.includes('authwall')) {
        log('  ✓ LinkedIn logged in');
        return true;
      }
      var acct = await page.$('[data-identifier]');
      if (acct) { await acct.click(); await page.waitForTimeout(2000); continue; }
      var consent = await page.$('button:has-text("Continue")') || await page.$('button:has-text("Allow")');
      if (consent) { await consent.click(); await page.waitForTimeout(2000); }
    }
  } else {
    log('  Google button not found');
  }
  return false;
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  BSAHI — Account Creation (Google SSO)      ║');
  console.log('║  Account: bsahiresearch@gmail.com            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  var browser = await chromium.launchPersistentContext(PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();
  var results = {};

  try { await setupMedium(page); results.medium = true; } catch(e) { log('Medium error: ' + e.message); results.medium = false; }
  try { await createYoutube(page); results.youtube = true; } catch(e) { log('YouTube error: ' + e.message); results.youtube = false; }
  try { results.reddit = await createReddit(page); } catch(e) { log('Reddit error: ' + e.message); results.reddit = false; }
  try { results.linkedin = await createLinkedIn(page); } catch(e) { log('LinkedIn error: ' + e.message); results.linkedin = false; }

  await browser.close();

  console.log('');
  console.log('══════════════════════════════════════════');
  for (var p in results) console.log('  ' + p + ': ' + (results[p] ? '✓' : '✗'));
  console.log('══════════════════════════════════════════');

  saveResult(results);
}

if (require.main === module) {
  run().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}
