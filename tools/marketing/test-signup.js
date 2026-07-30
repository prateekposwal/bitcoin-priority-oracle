var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var TEST_PROFILE = path.resolve(__dirname, '..', '..', 'profiles', '_test');
var PASSWORD = 'BSAHI_Test2024!';

async function testRedditSignup() {
  if (!fs.existsSync(TEST_PROFILE)) fs.mkdirSync(TEST_PROFILE, { recursive: true });

  var browser = await chromium.launchPersistentContext(TEST_PROFILE, {
    headless: false,
    args: ['--no-sandbox'],
    locale: 'en-US'
  });
  var page = await browser.newPage();

  console.log('=== Testing Reddit signup ===\n');

  // Create temp email
  var resp = await fetch('https://api.mail.tm/domains');
  var data = await resp.json();
  var domain = data['hydra:member'][0].domain;
  var addr = 'bsahi.test' + Math.floor(Math.random() * 10000) + '@' + domain;

  resp = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: addr, password: PASSWORD })
  });
  var acct = await resp.json();
  if (!acct.address) { console.log('Mail error:', JSON.stringify(acct)); process.exit(1); }

  console.log('Email: ' + acct.address);

  // Get token
  resp = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: acct.address, password: PASSWORD })
  });
  var tok = await resp.json();
  var token = tok.token;

  console.log('Opening Reddit...');
  await page.goto('https://www.reddit.com/register/', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Check current URL - might already have CAPTCHA
  console.log('URL after load:', page.url().slice(0, 100));

  var emailField = await page.$('[name="email"]');
  var unameField = await page.$('[name="username"]');
  var passField = await page.$('[name="password"]');

  console.log('Email field:', !!emailField);
  console.log('Username field:', !!unameField);
  console.log('Password field:', !!passField);

  if (emailField && unameField && passField) {
    await emailField.fill(acct.address);
    await unameField.fill('BSAHI_TestUser');
    await passField.fill(PASSWORD);

    var submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      console.log('Clicking submit...');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('URL after submit:', page.url().slice(0, 100));

      // Check for verification email
      console.log('\nWaiting for verification email...');
      var found = false;
      for (var i = 0; i < 20; i++) {
        var mresp = await fetch('https://api.mail.tm/messages', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        var msgs = await mresp.json();
        if (msgs['hydra:member'] && msgs['hydra:member'].length > 0) {
          console.log('Email received!');
          found = true;
          break;
        }
        await new Promise(function(r) { setTimeout(r, 2000); });
      }
      if (!found) console.log('No verification email received');
    }
  } else {
    console.log('Form fields not found — may have CAPTCHA or different form');
    await page.screenshot({ path: '/tmp/reddit-test.png' });
    console.log('Screenshot: /tmp/reddit-test.png');
  }

  await browser.close();
  console.log('\n=== Test complete ===');
}

testRedditSignup().catch(function(e) { console.error('Error:', e); process.exit(1); });
