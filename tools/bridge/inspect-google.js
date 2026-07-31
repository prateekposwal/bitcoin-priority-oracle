var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  await page.goto('https://accounts.google.com/signup/v2/createaccount?flowName=GlifWebSignIn&flowEntry=SignUp', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Name
  var fn = await page.$('input[name="firstName"]');
  var ln = await page.$('input[name="lastName"]');
  if (fn) await fn.fill('BSAHI');
  if (ln) await ln.fill('Research');
  var next = await page.$('button:has-text("Next")');
  if (next) { await next.click(); await page.waitForTimeout(1500); }

  // Birthday
  var dayField = await page.$('#day');
  if (dayField) {
    var combos = await page.$$('[role="combobox"]');
    if (combos.length >= 1) {
      await combos[0].click(); await page.waitForTimeout(400);
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    }
    await page.fill('#day', '1'); await page.fill('#year', '2000');
    if (combos.length >= 2) {
      await combos[1].click(); await page.waitForTimeout(400);
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    }
    var next2 = await page.$('button:has-text("Next")');
    if (next2) { await next2.click(); await page.waitForTimeout(1500); }
  }

  // Username
  var uname = await page.$('input[name="Username"]');
  if (uname) {
    var custom = await page.$('input[value="custom"]');
    if (custom) { await custom.click(); await page.waitForTimeout(400); }
    await uname.fill('bsahi.research');
    var next3 = await page.$('button:has-text("Next")');
    if (next3) { await next3.click(); await page.waitForTimeout(1500); }
  }

  // Password step - inspect
  console.log('URL:', page.url().slice(0, 80));
  var fields = await page.evaluate(function() {
    return Array.from(document.querySelectorAll('input')).map(function(el) {
      return { name: el.getAttribute('name'), id: el.id, type: el.getAttribute('type'), label: (el.getAttribute('aria-label') || '').slice(0, 30), placeholder: (el.getAttribute('placeholder') || '').slice(0, 30) };
    });
  });
  console.log('Password fields:', JSON.stringify(fields, null, 2));

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
