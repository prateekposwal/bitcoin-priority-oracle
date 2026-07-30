var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var CHROME_PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';
var BSAHI_PROFILE = path.resolve(__dirname, '..', '..', 'profiles', '_bsahi');
var ACCOUNTS_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi-accounts.json');

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] ' + msg); }

async function createMedium() {
  log('─── Medium (@BSAHI) ───');
  log('Using Chrome profile with Gmail logged in → Google SSO');

  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  await page.goto('https://medium.com/m/signin', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click "Sign in with Google"
  var googleBtn = await page.$('button:has-text("Google")') || await page.$('a:has-text("Google")');
  if (!googleBtn) {
    // Try other selectors
    googleBtn = await page.$('[data-testid*="google"]') || await page.$('button[class*="google"]');
  }

  if (googleBtn) {
    log('Clicking Google SSO...');
    await googleBtn.click();
    await page.waitForTimeout(5000);
  }

  await page.waitForTimeout(2000);
  var url = await page.url();
  log('URL: ' + url.slice(0, 80));

  var signedIn = url.includes('medium.com') && !url.includes('signin');
  log(signedIn ? '✓ MEDIUM: Signed in via Google' : '✗ Medium: needs manual step');

  // Set up username
  if (signedIn) {
    // Try to set display name
    await page.goto('https://medium.com/me/settings', { timeout: 15000 });
    await page.waitForTimeout(2000);

    var nameField = await page.$('[name="displayName"]') || await page.$('input[placeholder*="Name"]');
    if (nameField) {
      await nameField.fill('BSAHI');
      var saveBtn = await page.$('button:has-text("Save")');
      if (saveBtn) await saveBtn.click();
      await page.waitForTimeout(1000);
      log('✓ Profile name set to BSAHI');
    }
  }

  await browser.close();
  return { platform: 'medium', handle: '@BSAHI', signedIn: signedIn };
}

async function createStackerNews() {
  log('');
  log('─── Stacker News (@BSAHI) ───');
  log('Using Chrome profile + Nostr key');

  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  await page.goto('https://stacker.news/', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  log('URL: ' + (await page.url()).slice(0, 80));

  // Check if we're logged in
  var loginBtn = await page.$('a:has-text("sign up")') || await page.$('a:has-text("login")');
  log('Login button visible: ' + !!loginBtn);

  if (loginBtn) {
    // Click login/sign up
    await loginBtn.click();
    await page.waitForTimeout(2000);

    // Look for Nostr login option
    var nostrBtn = await page.$('button:has-text("Nostr")') || await page.$('a:has-text("Nostr")');
    if (nostrBtn) {
      log('Clicking Nostr login...');
      await nostrBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  var url = await page.url();
  log('URL: ' + url.slice(0, 80));
  var loggedIn = !url.includes('sign') && !url.includes('login') && url.includes('stacker.news');
  log(loggedIn ? '✓ STACKER NEWS: Account active' : '✗ Stacker News: needs manual step');

  await browser.close();
  return { platform: 'stackernews', loggedIn: loggedIn };
}

async function createHackerNews() {
  log('');
  log('─── Hacker News (BSAHI) ───');
  log('Simple signup form');

  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  await page.goto('https://news.ycombinator.com/login', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // HN login page also has account creation
  var createLink = await page.$('a:has-text("create")');
  if (createLink) {
    await createLink.click();
    await page.waitForTimeout(2000);
  }

  var unameField = await page.$('[name="acct"]');
  var pwField = await page.$('[name="pw"]');

  if (unameField && pwField) {
    log('Creating account: BSAHI');
    await unameField.fill('BSAHI');
    var password = 'BSAHI_Live2024!';
    await pwField.fill(password);

    var submitBtn = await page.$('input[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      log('URL: ' + (await page.url()).slice(0, 80));
    }
  } else {
    log('Form fields not found (may use CAPTCHA)');
  }

  var url = await page.url();
  var created = url.includes('news.ycombinator.com') && !url.includes('login') && !url.includes('create');
  log(created ? '✓ HACKER NEWS: BSAHI created' : '✗ HN: needs manual step');

  await browser.close();
  return { platform: 'hackernews', handle: 'BSAHI', created: created };
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  BSAHI — Account Creation                   ║');
  console.log('║  Using your Chrome (Gmail) for all signups  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  var results = [];
  results.push(await createMedium());
  results.push(await createStackerNews());
  results.push(await createHackerNews());

  console.log('');
  console.log('══════════════════════════════════════════');
  results.forEach(function(r) { console.log('  ' + r.platform + ': ' + (r.signedIn || r.loggedIn || r.created ? '✓' : '✗')); });
  console.log('');

  var success = results.filter(function(r) { return r.signedIn || r.loggedIn || r.created; });
  log(success.length + '/' + results.length + ' accounts created');
  log('Sessions saved in your Chrome profile');

  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(results, null, 2));
}

if (require.main === module) {
  run().catch(function(e) { console.error(e); process.exit(1); });
}
