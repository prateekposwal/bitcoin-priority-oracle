var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();

  await page.goto('https://www.linkedin.com/feed/', { timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('LinkedIn URL:', (await page.url()).slice(0, 100));

  var body = await page.evaluate(function() { return document.body.textContent; });
  var hasFeed = body.includes('Start a post') || body.includes('Home') || body.includes('Messaging');
  console.log('Has feed content:', hasFeed);

  var loggedIn = !(await page.url()).includes('login') && !(await page.url()).includes('signup') && !(await page.url()).includes('authwall') && !(await page.url()).includes('checkpoint');
  console.log('Logged in:', loggedIn);

  // Check for post button
  var postBtn = await page.$('button:has-text("Start a post")') || await page.$('[aria-label*="Start a post"]');
  console.log('Post button:', postBtn ? 'found' : 'not found');

  if (postBtn) {
    console.log('\n=== Posting BSAHI to LinkedIn ===');
    await postBtn.click();
    await page.waitForTimeout(3000);

    var editor = await page.$('[contenteditable="true"]');
    if (editor) {
      await editor.fill("Bitcoin blocks settle $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Storage cost coverage: 1.5%. Full research at bitcoinsahi.com");
      await page.waitForTimeout(1000);
      var submit = await page.$('button:has-text("Post")');
      if (submit) { await submit.click(); await page.waitForTimeout(3000); console.log('✓ POSTED to LinkedIn'); }
    } else {
      console.log('Editor not found');
    }
  }

  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
