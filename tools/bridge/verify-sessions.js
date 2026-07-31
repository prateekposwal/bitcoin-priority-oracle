var { chromium } = require('playwright');
(async function() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();
  var results = {};

  // Medium
  await page.goto('https://medium.com/', { timeout: 15000 });
  await page.waitForTimeout(1500);
  results.medium = !(await page.url()).includes('signin') && (await page.url()).includes('medium.com');
  console.log('Medium:', results.medium ? 'LOGGED IN ✓' : '✗');

  // YouTube
  await page.goto('https://www.youtube.com/', { timeout: 15000 });
  await page.waitForTimeout(1500);
  results.youtube = !(await page.url()).includes('signin') && !(await page.url()).includes('ServiceLogin');
  console.log('YouTube:', results.youtube ? 'LOGGED IN ✓' : '✗');

  // Reddit
  await page.goto('https://www.reddit.com/', { timeout: 15000 });
  await page.waitForTimeout(1500);
  results.reddit = !(await page.url()).includes('login') && !(await page.url()).includes('register');
  console.log('Reddit:', results.reddit ? 'LOGGED IN ✓' : '✗');

  // LinkedIn
  await page.goto('https://www.linkedin.com/feed/', { timeout: 15000 });
  await page.waitForTimeout(1500);
  results.linkedin = (await page.url()).includes('linkedin.com') && !(await page.url()).includes('login') && !(await page.url()).includes('signup') && !(await page.url()).includes('authwall');
  console.log('LinkedIn:', results.linkedin ? 'LOGGED IN ✓' : '✗');

  console.log('\n' + JSON.stringify(results));
  await browser.close();
  process.exit(0);
})().catch(function(e) { console.error('Error:', e); process.exit(1); });
