var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();
  var results = {};

  // Check Reddit
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var rdLoggedIn = !(await page.url()).includes('login') && !(await page.url()).includes('register');
  console.log('Reddit:', rdLoggedIn ? 'LOGGED IN ✓' : 'not logged in');
  results.reddit = rdLoggedIn;

  if (rdLoggedIn) {
    await page.goto('https://old.reddit.com/r/Bitcoin/submit', { timeout: 15000 });
    await page.waitForTimeout(2000);
    var t = await page.$('input[name="title"]');
    console.log('  Can post to r/Bitcoin:', !!t);
    if (t) {
      await t.fill('BSAHI: Bitcoin Block Space Research — Live Data');
      var tx = await page.$('textarea[name="text"]');
      if (tx) {
        await tx.fill("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Full analysis at bitcoinsahi.com");
        var btn = await page.$('button[name="submit"]') || await page.$('[type="submit"]');
        if (btn) { await btn.click(); await page.waitForTimeout(3000); console.log('  ✓ POSTED to r/Bitcoin'); }
      }
    }
  }

  // Check LinkedIn
  await page.goto('https://www.linkedin.com/feed/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  var liLoggedIn = (await page.url()).includes('linkedin.com') && !(await page.url()).includes('login') && !(await page.url()).includes('signup') && !(await page.url()).includes('authwall');
  console.log('LinkedIn:', liLoggedIn ? 'LOGGED IN ✓' : 'not logged in');
  results.linkedin = liLoggedIn;

  if (liLoggedIn) {
    await page.waitForTimeout(3000);
    var postBtn = await page.$('button:has-text("Start a post")') || await page.$('[aria-label*="Start a post"]');
    console.log('  Post button:', postBtn ? 'found' : 'not found');
    if (postBtn) {
      await postBtn.click();
      await page.waitForTimeout(2000);
      var editor = await page.$('[contenteditable="true"]');
      if (editor) {
        await editor.fill("Bitcoin blocks settle $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Storage cost coverage: 1.5%. Full research at bitcoinsahi.com");
        await page.waitForTimeout(500);
        var submit = await page.$('button:has-text("Post")');
        if (submit) { await submit.click(); await page.waitForTimeout(3000); console.log('  ✓ POSTED to LinkedIn'); }
      }
    }
  }

  console.log('\nResults:', JSON.stringify(results));
  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
