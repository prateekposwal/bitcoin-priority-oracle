var fs = require('fs');
var path = require('path');
var { chromium } = require('playwright');

var AGENT = 'BSAHI SimSIM';

// ─── Virtual SIM Simulator ───
// Provides a virtual phone number, receives OTP, auto-fills forms
// Provider-agnostic: plug in any SMS service

var PROVIDERS = {
  'receive-sms': {
    name: 'receive-sms-online.info',
    type: 'free',
    // Gets a virtual number and polls for incoming SMS
    getNumber: async function(page) {
      await page.goto('https://receive-sms-online.info/', { timeout: 20000 });
      await page.waitForTimeout(3000);
      var body = await page.evaluate(function() { return document.body.textContent; });
      var match = body.match(/\+?\d{10,13}/);
      return match ? match[0].replace(/\D/g, '') : null;
    },
    waitForSms: async function(page, number, timeoutMs) {
      var start = Date.now();
      while (Date.now() - start < timeoutMs) {
        await page.goto('https://receive-sms-online.info/', { timeout: 15000 });
        await page.waitForTimeout(3000);
        var body = await page.evaluate(function() { return document.body.textContent; });
        var otp = body.match(/\b(\d{4,8})\b/);
        if (otp) return otp[1];
        await page.waitForTimeout(5000);
      }
      return null;
    }
  },
  'sms-activate': {
    name: 'sms-activate.org',
    type: 'paid-api',
    // Requires API key + balance
    getNumber: async function(page, apiKey) {
      var resp = await fetch('https://sms-activate.org/stubs/handler_api.php?api_key=' + apiKey + '&action=getNumber&service=go&country=22');
      var text = await resp.text();
      // Response format: ACCESS_NUMBER:ID:NUMBER
      var parts = text.split(':');
      if (parts[0] === 'ACCESS_NUMBER') return { id: parts[1], number: parts[2] };
      return null;
    },
    waitForSms: async function(page, orderId, apiKey, timeoutMs) {
      var start = Date.now();
      while (Date.now() - start < timeoutMs) {
        var resp = await fetch('https://sms-activate.org/stubs/handler_api.php?api_key=' + apiKey + '&action=getStatus&id=' + orderId);
        var text = await resp.text();
        if (text.startsWith('STATUS_OK')) return text.split(':')[1];
        await new Promise(function(r) { setTimeout(r, 5000); });
      }
      return null;
    }
  }
};

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

async function verifyGoogleWithSim() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  BSAHI SIM Simulator — Google Verification              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Step 1: Get a virtual number
  log('Getting virtual phone number...');
  var number = await PROVIDERS['receive-sms'].getNumber(page);
  if (!number) {
    log('No virtual number available');
    await browser.close();
    return;
  }
  log('Virtual number: +' + number);

  // Step 2: Go to Google signup
  log('Opening Google signup...');
  await page.goto('https://accounts.google.com/signup/v2/createaccount?flowName=GlifWebSignIn&flowEntry=SignUp', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Step 3: Fill the form (names, email, password)
  log('Filling signup form...');
  // Will continue based on page state

  // Step 4: When phone verification appears, enter the virtual number
  for (var i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);
    var body = await page.evaluate(function() { return document.body.textContent; });
    var url = await page.url();
    log('Step ' + i + ': ' + url.slice(0, 60));

    if (body.includes('phone number') || body.includes('Phone number') || body.includes('verification code')) {
      log('PHONE VERIFICATION FOUND');
      log('Entering virtual number: +' + number);

      // Enter the number
      var phoneField = await page.$('input[type="tel"], [name="phoneNumber"], [id*="phone"]');
      if (phoneField) {
        await phoneField.fill(number);
        var nextBtn = await page.$('button:has-text("Next")') || await page.$('button:has-text("Continue")');
        if (nextBtn) { await nextBtn.click(); await page.waitForTimeout(2000); log('Number submitted'); }
      }

      // Wait for OTP
      log('Waiting for OTP...');
      var otp = await PROVIDERS['receive-sms'].waitForSms(page, number, 120000);
      if (otp) {
        log('OTP received: ' + otp);
        var codeField = await page.$('input[type="tel"], [name="code"], [id*="code"], [inputmode="numeric"]');
        if (codeField) {
          await codeField.fill(otp);
          var verifyBtn = await page.$('button:has-text("Next")') || await page.$('button:has-text("Verify")');
          if (verifyBtn) { await verifyBtn.click(); await page.waitForTimeout(3000); log('OTP submitted'); }
        }
      } else {
        log('OTP not received (virtual numbers often blocked by Google)');
      }
      break;
    }

    // Handle other form steps (names, email, password, birthday)
    var inputs = await page.$$('input:not([type="hidden"]):not([type="tel"])');
    for (var j = 0; j < inputs.length; j++) {
      try {
        var name = await inputs[j].getAttribute('name');
        if (name === 'firstName' && !(await inputs[j].inputValue())) { await inputs[j].fill('BSAHI'); log('  firstName filled'); }
        if (name === 'lastName' && !(await inputs[j].inputValue())) { await inputs[j].fill('Research'); log('  lastName filled'); }
        if (name === 'Passwd' && !(await inputs[j].inputValue())) { await inputs[j].fill('BSAHI_Live2024!'); log('  password filled'); }
        if (name === 'PasswdAgain' && !(await inputs[j].inputValue())) { await inputs[j].fill('BSAHI_Live2024!'); log('  confirm filled'); }
      } catch(e) {}
    }

    // Birthday step: custom month combobox + day/year inputs + gender combobox
    try {
      var dayField = await page.$('#day');
      var yearField = await page.$('#year');
      if (dayField && yearField) {
        // Month combobox
        var combos = await page.$$('[role="combobox"]');
        if (combos.length >= 1) {
          await combos[0].click();
          await page.waitForTimeout(500);
          // Select January from dropdown
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          log('  month selected');
        }
        await dayField.fill('1');
        await yearField.fill('2000');
        log('  birthday filled');

        // Gender combobox
        if (combos.length >= 2) {
          await combos[1].click();
          await page.waitForTimeout(500);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          log('  gender selected');
        }
      }
    } catch(e) {}

    // Username step
    try {
      var usernameField = await page.$('input[name="Username"]');
      if (usernameField) {
        // Select "custom" radio
        var customRadio = await page.$('input[value="custom"]');
        if (customRadio) { await customRadio.click(); await page.waitForTimeout(500); }
        await usernameField.fill('bsahi.research');
        log('  username filled');
      }
    } catch(e) {}

    // Click next buttons
    var btns = await page.$$('button');
    for (var k = 0; k < btns.length; k++) {
      try {
        var t = await btns[k].textContent();
        if (t.trim().toLowerCase() === 'next' || t.trim().toLowerCase() === 'agree' || t.trim().toLowerCase() === 'accept') {
          await btns[k].click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch(e) {}
    }
  }

  await browser.close();
  log('Google verification attempt complete');
}

if (require.main === module) {
  verifyGoogleWithSim().catch(function(e) { console.error('Error:', e); process.exit(1); });
}
