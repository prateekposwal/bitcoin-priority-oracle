var { webkit, chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var CHROME_PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';
var PROFILE_DIR = path.resolve(__dirname, '..', '..', 'profiles', '_bsahi');

// Email found from Chrome Preferences
var EMAIL = 'p8015844+bsahi@gmail.com';
var PASSWORD = 'BSAHI_Live2024!';

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] ' + msg); }

async function waitForGmailVerification(timeoutMs) {
  timeoutMs = timeoutMs || 120000;
  log('Opening Chrome to check Gmail...');
  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();
  var start = Date.now();
  var link = null;

  while (!link && (Date.now() - start) < timeoutMs) {
    await page.goto('https://mail.google.com/mail/u/0/#inbox', { timeout: 10000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    var firstEmail = await page.$('tr.zA:first-child');
    if (firstEmail) {
      await firstEmail.click();
      await page.waitForTimeout(2000);
      var html = await page.content();
      var matches = html.match(/https?:\/\/[^"'\s]+(?:verify|confirm|activate|email_verify|reddit\.com\/verify)[^"'\s]*/gi);
      if (matches && matches.length > 0) {
        link = matches[0].replace(/&amp;/g, '&');
        log('Verification link found');
        break;
      }
    }

    log('No verification email yet (waited ' + (Date.now() - start)/1000 + 's)');
    await page.waitForTimeout(10000);
  }

  await browser.close();
  return link;
}

async function createReddit() {
  log('');
  log('─── Reddit: BSAHI_Research ───');
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

  var browser = await webkit.launchPersistentContext(PROFILE_DIR, {
    headless: false, locale: 'en-US'
  });
  var page = await browser.newPage();

  log('Opening Reddit registration...');
  await page.goto('https://www.reddit.com/register/', { timeout: 20000 });

  // Wait for JS challenge
  log('Waiting for JS challenge to resolve...');
  var ready = false;
  for (var i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    try { ready = await page.isVisible('[name="email"]', { timeout: 200 }); } catch(e) {}
    if (ready) { log('Form ready after ' + (i+1) + 's'); break; }
  }

  if (!ready) {
    log('Form never appeared — page may have different layout');
    await page.screenshot({ path: '/tmp/reddit-form-fail.png' });
    await browser.close();
    return false;
  }

  log('Filling form with keyboard...');
  // Focus first field and type
  await page.evaluate(function() { document.querySelector('faceplate-text-input[name="email"]')?.focus(); });
  await page.waitForTimeout(300);
  await page.keyboard.type(EMAIL, { delay: 20 });
  await page.waitForTimeout(300);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.keyboard.type('BSAHI_Research', { delay: 10 });
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.keyboard.type(PASSWORD, { delay: 10 });
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  // Try Enter to submit
  log('Pressing Enter to submit...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  log('URL: ' + (await page.url()).slice(0, 100));

  await browser.close();

  log('Checking Gmail for verification...');
  var verifyLink = await waitForGmailVerification();

  if (verifyLink) {
    log('Verifying email...');
    browser = await webkit.launchPersistentContext(PROFILE_DIR, {
      headless: false, locale: 'en-US'
    });
    page = await browser.newPage();
    await page.goto(verifyLink, { timeout: 15000 });
    await page.waitForTimeout(3000);
    await browser.close();
    log('✓ Reddit verified!');
    return true;
  }

  log('✗ No verification email found');
  return false;
}

async function createMedium() {
  log('');
  log('─── Medium ───');
  var browser = await webkit.launchPersistentContext(PROFILE_DIR, {
    headless: false, locale: 'en-US'
  });
  var page = await browser.newPage();

  await page.goto('https://medium.com/m/signin', { timeout: 20000 });
  await page.waitForTimeout(2000);

  var googleBtn = await page.$('button:has-text("Google")') || await page.$('a:has-text("Google")');
  if (googleBtn) {
    log('Google SSO...');
    await googleBtn.click();
    await page.waitForTimeout(5000);
    log('URL: ' + (await page.url()).slice(0, 100));
  } else {
    log('No Google SSO button found');
  }

  await browser.close();

  var url = await page.url();
  var ok = url.includes('medium.com') && !url.includes('signin');
  log(ok ? '✓ Medium ready' : '✗ Medium not signed in');
  return ok;
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  BSAHI — Account Creation                    ║');
  console.log('║                                              ║');
  console.log('║  Email: ' + EMAIL);
  console.log('║  Using: WebKit + Chrome (Gmail access)       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  var r = await createReddit();
  var m = await createMedium();

  log('');
  log('══════════════════════════════════════════');
  log('  Reddit: ' + (r ? '✓ BSAHI_Research' : '✗'));
  log('  Medium: ' + (m ? '✓' : '✗'));
  log('  Nostr: already live');
  log('  Twitter: needs phone (create @BSAHI_BTC manually)');
  log('');
  log('  Close any remaining browser windows');
  log('══════════════════════════════════════════');

  fs.writeFileSync(path.join(PROFILE_DIR, 'accounts.json'), JSON.stringify({
    reddit: r, medium: m, at: new Date().toISOString()
  }));
}

if (require.main === module) {
  run().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}
