var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var CRED_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'twilio.json');
var CHROME = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] ' + msg); }

function saveCreds(data) {
  fs.writeFileSync(CRED_PATH, JSON.stringify(data, null, 2));
}

async function checkGmailForLink(page, sender) {
  await page.goto('https://mail.google.com/mail/u/0/#inbox', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var first = await page.$('tr.zA:first-child');
  if (first) {
    await first.click();
    await page.waitForTimeout(2000);
    var html = await page.content();
    var matches = html.match(/https?:\/\/[^"'\s]+twilio[^"'\s]*(?:verify|confirm|activate)[^"'\s]*/gi);
    if (matches && matches.length) return matches[0].replace(/&amp;/g, '&');
  }
  return null;
}

async function createTwilioAccount() {
  log('=== Creating Twilio Account (free $15 trial) ===');
  var browser = await chromium.launchPersistentContext(CHROME, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  var page = await browser.newPage();

  // Go to Twilio signup
  await page.goto('https://www.twilio.com/try-twilio', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  log('Signup URL:', page.url().slice(0, 80));

  // Fill email
  var emailField = await page.$('input[type="email"], [name="email"], [id*="email"]');
  if (emailField) {
    await emailField.fill('p8015844+twilio@gmail.com');
    log('Email filled');
  } else {
    // Try clicking "Start free trial"
    var startBtn = await page.$('a:has-text("Start free trial")') || await page.$('button:has-text("Sign up")');
    if (startBtn) { await startBtn.click(); await page.waitForTimeout(3000); log('Clicked start free trial'); }
  }

  // Fill the full form
  var fields = ['firstName', 'lastName', 'email', 'password'];
  for (var i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    var inputs = await page.$$('input:not([type="hidden"])');
    for (var j = 0; j < inputs.length; j++) {
      try {
        var name = await inputs[j].getAttribute('name');
        var type = await inputs[j].getAttribute('type');
        var val = await inputs[j].inputValue();
        if (val) continue;
        if (name === 'firstName' || name === 'first_name') { await inputs[j].fill('BSAHI'); log('  firstName'); }
        else if (name === 'lastName' || name === 'last_name') { await inputs[j].fill('Research'); log('  lastName'); }
        else if (type === 'email' || name === 'email') { await inputs[j].fill('p8015844+twilio@gmail.com'); log('  email'); }
        else if (type === 'password' || name === 'password') { await inputs[j].fill('BSAHI_Live2024!'); log('  password'); }
      } catch(e) {}
    }
    // Click continue/create buttons
    var btns = await page.$$('button, [role="button"]');
    for (var k = 0; k < btns.length; k++) {
      try {
        var t = await btns[k].textContent();
        var tl = t.toLowerCase().trim();
        if (tl.includes('start') || tl.includes('create') || tl.includes('next') || tl.includes('continue') || tl.includes('submit')) {
          await btns[k].click();
          log('  clicked:', t.trim().slice(0, 30));
          await page.waitForTimeout(1000);
          break;
        }
      } catch(e) {}
    }
  }

  log('Final URL:', (await page.url()).slice(0, 80));
  await browser.close();
  log('Twilio account creation complete');
}

createTwilioAccount().catch(function(e) { console.error('Error:', e); process.exit(1); });
