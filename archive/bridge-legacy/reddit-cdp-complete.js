var { chromium } = require('playwright');
var { spawn } = require('child_process');
var fs = require('fs');
var path = require('path');

var DST = '/Users/prateekposwal/Desktop/block-space-economics/relay-data/chrome-bsahi';
var PORT = 9223;

async function ensureChrome() {
  try {
    var resp = await fetch('http://localhost:' + PORT + '/json/version');
    if (resp.ok) return;
  } catch(e) {}

  var chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--user-data-dir=' + DST,
    '--remote-debugging-port=' + PORT,
    '--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'
  ], { stdio: 'ignore', detached: true });
  chrome.unref();
  for (var i = 0; i < 30; i++) {
    await new Promise(function(r) { setTimeout(r, 1000); });
    try { var r2 = await fetch('http://localhost:' + PORT + '/json/version'); if (r2.ok) return; } catch(e) {}
  }
}

async function run() {
  await ensureChrome();
  var browser = await chromium.connectOverCDP('http://localhost:' + PORT);
  var context = browser.contexts()[0];
  var page = await context.newPage();

  console.log('=== Reddit register (set username) ===');
  await page.goto('https://www.reddit.com/register/', { timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log('URL:', (await page.url()).slice(0, 80));

  // Look for "Continue with Google" or existing Google account on register page
  var body = await page.evaluate(function() { return document.body.textContent; });
  var hasGoogle = body.includes('bsahiresearch') || body.toLowerCase().includes('continue with google');
  console.log('Has Google:', hasGoogle);

  // Check for username field
  var usernameField = await page.$('input[name="username"], faceplate-text-input[name="username"], [name="username"]');
  console.log('Username field:', usernameField ? 'found' : 'not found');

  if (usernameField) {
    await page.evaluate(function() {
      var el = document.querySelector('input[name="username"], faceplate-text-input[name="username"], [name="username"]');
      if (el) { el.value = 'BSAHI_Research'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.waitForTimeout(1000);
    console.log('Username set: BSAHI_Research');

    // Click submit/continue
    var submitBtn = await page.$('button[type="submit"], button:has-text("Continue"), button:has-text("Sign up")');
    if (submitBtn) {
      // Try JS click if visible click fails
      await submitBtn.click().catch(function() {
        return page.evaluate(function() {
          var btn = document.querySelector('button[type="submit"], button:has-text("Continue"), button:has-text("Sign up")');
          if (btn) btn.click();
        });
      });
      await page.waitForTimeout(5000);
      console.log('After click:', (await page.url()).slice(0, 80));
    } else {
      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      console.log('After Enter:', (await page.url()).slice(0, 80));
    }
  } else {
    console.log('No username field. Page:', body.replace(/\s+/g, ' ').slice(0, 200));
  }

  // Check if logged in now
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.goto('https://www.reddit.com/r/Bitcoin/submit', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var submitUrl = await page.url();
  var loggedIn = !submitUrl.includes('login');
  console.log('\nSubmit URL:', submitUrl.slice(0, 80));
  console.log('LOGGED IN:', loggedIn);

  if (loggedIn) {
    console.log('\n=== POSTING TO REDDIT ===');
    var titleField = await page.$('[name="title"], #post-title, input[placeholder*="Title"]');
    if (titleField) {
      await titleField.fill('BSAHI: Bitcoin Block Space Research');
      console.log('Title filled');
    }
  }

  await browser.close();
  process.exit(0);
}

run().catch(function(e) { console.error('Error:', e); process.exit(1); });
