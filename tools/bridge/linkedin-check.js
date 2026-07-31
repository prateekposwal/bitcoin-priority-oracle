var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  // LinkedIn signup page - might have Google SSO
  await page.goto('https://www.linkedin.com/signup', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Signup URL:', page.url().slice(0, 80));

  var authOptions = await page.evaluate(function() {
    var all = document.querySelectorAll('button, a, [role="button"]');
    var results = [];
    for (var i = 0; i < all.length; i++) {
      try {
        var t = all[i].textContent.trim().toLowerCase();
        if (t.includes('google') || t.includes('apple') || t.includes('microsoft')) {
          results.push(all[i].textContent.trim().slice(0, 30));
        }
      } catch(e) {}
    }
    return results;
  });
  console.log('SSO options:', authOptions);

  // Also check the login page for SSO
  await page.goto('https://www.linkedin.com/login', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var loginOptions = await page.evaluate(function() {
    var all = document.querySelectorAll('button, a, [role="button"]');
    var results = [];
    for (var i = 0; i < all.length; i++) {
      try {
        var t = all[i].textContent.trim().toLowerCase();
        if (t.includes('google') || t.includes('apple')) {
          results.push(all[i].textContent.trim().slice(0, 30));
        }
      } catch(e) {}
    }
    return results;
  });
  console.log('Login SSO options:', loginOptions);

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
