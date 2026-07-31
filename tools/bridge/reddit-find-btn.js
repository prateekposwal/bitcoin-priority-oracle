var { chromium } = require('playwright-extra');
var StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'], locale: 'en-US' }
  );
  var page = await browser.newPage();

  await page.goto('https://www.reddit.com/', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Find ALL links/buttons that lead to post creation
  var createLinks = await page.evaluate(function() {
    var results = [];
    // Look for submit links
    document.querySelectorAll('a[href*="submit"], [data-testid*="create"], [id*="create"], [class*="CreatePost"]').forEach(function(el) {
      results.push({ tag: el.tagName, href: (el.getAttribute('href') || '').slice(0, 40), id: el.id, class: (el.className || '').slice(0, 40), text: (el.textContent || '').trim().slice(0, 30) });
    });
    return results;
  });
  console.log('Create post elements:', JSON.stringify(createLinks, null, 2));

  // Also check the top nav for post button
  var postLink = await page.$('a[href*="/submit"]');
  console.log('Submit link:', postLink ? 'found' : 'not found');
  if (postLink) {
    var href = await postLink.getAttribute('href');
    console.log('Href:', href);
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
