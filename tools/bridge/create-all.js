var { chromium } = require('playwright');

async function checkPlatforms() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();
  var results = {};

  // Reddit via old.reddit.com
  await page.goto('https://old.reddit.com/r/Bitcoin/submit', { timeout: 20000 });
  await page.waitForTimeout(2000);
  var rdLoggedIn = !page.url().includes('login');
  console.log('Reddit (old):', rdLoggedIn ? 'LOGGED IN' : 'not logged in');
  results.reddit = rdLoggedIn;

  if (rdLoggedIn) {
    var titleField = await page.$('input[name="title"]');
    var textField = await page.$('textarea[name="text"]');
    console.log('  Form:', titleField ? 'visible' : 'hidden');
    if (titleField && textField) {
      await titleField.fill('BSAHI: Bitcoin Block Space Economics Research');
      await textField.fill('Bitcoin settles $5.9B daily at $68K average tx value. 27,800 nodes. Lightning: 4,390 BTC capacity. Full analysis at bitcoinsahi.com');
      var submitBtn = await page.$('button[name="submit"]') || await page.$('.btn[type="submit"]');
      if (submitBtn) { await submitBtn.click(); await page.waitForTimeout(3000); }
      console.log('  Posted:', page.url().slice(0, 60));
    }
  }

  // LinkedIn
  await page.goto('https://www.linkedin.com/feed/', { timeout: 20000 });
  await page.waitForTimeout(2000);
  var liLoggedIn = !page.url().includes('login') && page.url().includes('linkedin.com');
  console.log('LinkedIn:', liLoggedIn ? 'LOGGED IN' : 'not logged in');
  results.linkedin = liLoggedIn;

  if (liLoggedIn) {
    var postBtn = await page.$('button:has-text("Start a post")') || await page.$('[data-control-name*="share"]');
    console.log('  Post button:', postBtn ? 'found' : 'not found');
  }

  // Medium
  await page.goto('https://medium.com/m/oauth/google', { timeout: 20000 });
  await page.waitForTimeout(3000);
  var mdLoggedIn = !page.url().includes('signin') && page.url().includes('medium.com');
  console.log('Medium:', mdLoggedIn ? 'LOGGED IN' : 'not logged in');
  results.medium = mdLoggedIn;

  if (mdLoggedIn) {
    await page.goto('https://medium.com/me/settings', { timeout: 15000 });
    await page.waitForTimeout(2000);
    var dn = await page.$('input[name="displayName"]');
    if (dn) { await dn.fill('BSAHI'); var sv = await page.$('button:has-text("Save")'); if (sv) await sv.click(); console.log('  Profile: BSAHI'); }
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  Results:');
  for (var p in results) console.log('  ' + p + ': ' + (results[p] ? '✓ ' : '✗'));
  console.log('\n  HN: https://news.ycombinator.com/submitted?id=BSAHI');
  console.log('  Nostr: https://snort.social/p/b4bc93933169b6a288d08a2599832f05ff6b3a72a801a60b5266a29295bcaedc');
  console.log('══════════════════════════════════════════');

  await browser.close();
}

checkPlatforms().catch(function(e) { console.error('Error:', e); process.exit(1); });
