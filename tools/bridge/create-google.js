var { chromium } = require('playwright');
var BSAHI_EMAIL = 'p8015844+bsahi@gmail.com';
var PASSWORD = 'BSAHI_Live2024!';

async function createGoogleAccount() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Creating BSAHI Google Account              ║');
  console.log('║  Email: ' + BSAHI_EMAIL);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US' }
  );
  var page = await browser.newPage();

  await page.goto('https://accounts.google.com/signup/v2/createaccount?flowName=GlifWebSignIn&flowEntry=SignUp', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Fill each step as it appears
  for (var step = 0; step < 20; step++) {
    await page.waitForTimeout(2000);
    var url = await page.url();
    console.log('Step ' + step + ': ' + url.slice(0, 80));

    // Check if done
    if (url.includes('myaccount') || url.includes('signin') || url.includes('inbox')) {
      console.log('✓ GOOGLE ACCOUNT CREATED');
      break;
    }

    var body = await page.evaluate(function() { return document.body.textContent; });

    // Check for phone verification (Google usually requires this)
    if (body.includes('phone') || body.includes('Phone') || url.includes('phone')) {
      console.log('PHONE VERIFICATION REQUIRED — this needs your phone');
      console.log('Google will send a verification code to a phone number.');
      console.log('Enter the code in the browser when received.');
      console.log('(Waiting for up to 5 minutes...)');
      
      // Wait for user to complete phone verification
      for (var w = 0; w < 60; w++) {
        await page.waitForTimeout(5000);
        var curUrl = await page.url();
        if (!curUrl.includes('phone')) {
          console.log('Phone verification completed');
          break;
        }
      }
      continue;
    }

    // Click any available button (Next, Agree, Skip, etc.)
    var clicked = false;
    var allBtns = await page.$$('button, [role="button"], [role="link"]');
    for (var b = 0; b < allBtns.length; b++) {
      try {
        var text = await allBtns[b].textContent();
        var t = text.toLowerCase().trim();
        if (t === 'next' || t === 'i agree' || t === 'accept' || t === 'skip' || t === 'create account' || t === 'continue') {
          await allBtns[b].click();
          clicked = true;
          console.log('Clicked: ' + text.trim());
          break;
        }
      } catch(e) {}
    }

    // Check for input fields and fill them
    var inputs = await page.$$('input:not([type="hidden"])');
    for (var i = 0; i < inputs.length; i++) {
      try {
        var name = await inputs[i].getAttribute('name');
        var type = await inputs[i].getAttribute('type');

        // Fill common fields
        if (name === 'firstName') { await inputs[i].fill('BSAHI'); console.log('Filled: firstName'); }
        else if (name === 'lastName') { await inputs[i].fill('Research'); console.log('Filled: lastName'); }
        else if (name === 'email' || type === 'email') { 
          var val = await inputs[i].inputValue();
          if (!val) { await inputs[i].fill(BSAHI_EMAIL); console.log('Filled: email'); }
        }
        else if ((name === 'Passwd' || name === 'password') && type === 'password') {
          var val = await inputs[i].inputValue();
          if (!val) { await inputs[i].fill(PASSWORD); console.log('Filled: password'); }
        }
        else if (name === 'month' || name === 'day' || name === 'year') {
          if (name === 'month') { await inputs[i].selectOption('1'); console.log('Filled: month'); }
          else if (name === 'day') { await inputs[i].fill('1'); console.log('Filled: day'); }
          else if (name === 'year') { await inputs[i].fill('2000'); console.log('Filled: year'); }
        }
      } catch(e) {}
    }

    if (!clicked) {
      // Try pressing Enter
      try { await page.keyboard.press('Enter'); console.log('Pressed Enter'); } catch(e) {}
    }
  }

  await browser.close();
  console.log('Google account creation process complete');
}

createGoogleAccount().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
