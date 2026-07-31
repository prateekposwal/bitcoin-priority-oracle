var { chromium } = require('playwright');

async function createVirtualPhone() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // Try TextNow - Free US phone numbers
  console.log('=== TextNow - Virtual Phone Number ===');
  await page.goto('https://www.textnow.com/signup', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('TextNow signup:', page.url().slice(0, 80));

  var usernameField = await page.$('[name="username"]') || await page.$('[id*="username"]');
  var emailField = await page.$('[name="email"]') || await page.$('[type="email"]');
  var passField = await page.$('[name="password"]') || await page.$('[type="password"]');

  if (usernameField && emailField && passField) {
    console.log('Filling TextNow signup...');
    await usernameField.fill('BSAHI_Phone');
    await emailField.fill('p8015844+phone@gmail.com');
    await passField.fill('BSAHI_Live2024!');

    var submitBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Sign Up")') || await page.$('button:has-text("Create")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log('After signup:', page.url().slice(0, 80));
    }
  } else {
    console.log('Form not found:', !!usernameField, !!emailField, !!passField);
    // Check page content
    var body = await page.evaluate(function() { return document.body.textContent; });
    console.log('Page:', body.replace(/\s+/g, ' ').trim().slice(0, 200));
  }

  // Check if we got a phone number
  var hasPhone = await page.evaluate(function() {
    var body = document.body.textContent;
    // TextNow shows number in format (XXX) XXX-XXXX
    var match = body.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
    return match ? match[0] : 'no number found';
  });
  console.log('Phone number:', hasPhone);

  // Try Google Voice
  console.log('\n=== Google Voice ===');
  await page.goto('https://voice.google.com/', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Google Voice:', page.url().slice(0, 80));

  var gvHasNumber = await page.evaluate(function() {
    var body = document.body.textContent;
    return body.includes('Google Voice') ? 'loaded' : 'needs setup';
  });
  console.log('Google Voice status:', gvHasNumber);

  await browser.close();
  console.log('\nVirtual phone setup complete');
}

createVirtualPhone().catch(function(e) { console.error('Error:', e); process.exit(1); });
