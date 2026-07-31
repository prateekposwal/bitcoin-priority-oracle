var { chromium } = require('playwright');
var profiles = [
  { name: 'Default', path: '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default' },
  { name: 'Profile 1', path: '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 1' },
  { name: 'Profile 2', path: '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2' }
];

(async function() {
  for (var p = 0; p < profiles.length; p++) {
    var profile = profiles[p];
    try {
      var browser = await chromium.launchPersistentContext(profile.path, {
        headless: false, channel: 'chrome', args: ['--no-sandbox'], timeout: 30000
      });
      var page = await browser.newPage();
      await page.goto('https://www.linkedin.com/feed/', { timeout: 15000 });
      await page.waitForTimeout(2000);
      var url = await page.url();
      var loggedIn = url.includes('linkedin.com') && !url.includes('login') && !url.includes('signup') && !url.includes('authwall');
      console.log(profile.name + ' LinkedIn:', loggedIn ? 'LOGGED IN ✓' : 'not logged in (' + url.slice(0, 50) + ')');
      await browser.close();
    } catch(e) {
      console.log(profile.name + ': error ' + e.message.slice(0, 40));
    }
  }
  process.exit(0);
})().catch(function(e) { console.error(e); process.exit(1); });
