var { chromium } = require('playwright-extra');
var StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    {
      headless: false,
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
      locale: 'en-US'
    }
  );
  var page = await browser.newPage();

  // Check webdriver detection
  var webdriver = await page.evaluate(function() { return navigator.webdriver; });
  console.log('navigator.webdriver:', webdriver);
  console.log('chrome.runtime:', await page.evaluate(function() { return !!(window.chrome && window.chrome.runtime); }));
  console.log('plugins:', await page.evaluate(function() { return navigator.plugins.length; }));

  // Test Reddit
  console.log('\n=== Reddit with stealth ===');
  await page.goto('https://www.reddit.com/', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Home URL:', (await page.url()).slice(0, 60));

  // Find and click "Create Post" button
  var createPostBtn = await page.$('a[href*="submit"], button:has-text("Create Post"), [data-testid*="create"]');
  if (!createPostBtn) {
    var btns = await page.$$('a, button');
    for (var i = 0; i < btns.length; i++) {
      try {
        var t = await btns[i].textContent();
        if (t.includes('Create Post') || t.includes('Post')) {
          createPostBtn = btns[i];
          console.log('Found post button:', t.trim());
          break;
        }
      } catch(e) {}
    }
  }

  if (createPostBtn) {
    console.log('Clicking Create Post...');
    await createPostBtn.click();
    await page.waitForTimeout(3000);

    var submitUrl = await page.url();
    console.log('After click:', submitUrl.slice(0, 80));

    var loggedIn = !submitUrl.includes('login');
    console.log('Logged in:', loggedIn);

    if (loggedIn) {
      var fields = await page.evaluate(function() {
        return Array.from(document.querySelectorAll('input, textarea, [contenteditable], [role="textbox"]')).slice(0, 8).map(function(el) {
          return { tag: el.tagName, name: el.getAttribute('name'), type: el.getAttribute('type'), id: el.id, ph: (el.getAttribute('placeholder') || '').slice(0, 25) };
        });
      });
      console.log('Fields:', JSON.stringify(fields, null, 2));
    }
  } else {
    console.log('Create Post button not found');
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
