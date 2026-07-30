var { chromium } = require('playwright');

async function createAccounts() {
  var browser = await chromium.launchPersistentContext(
    '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default',
    { headless: false, channel: 'chrome', args: ['--no-sandbox'] }
  );
  var page = await browser.newPage();
  var accounts = {};

  // 1. REDDIT via Google SSO
  console.log('=== Reddit ===');
  // Try the Google OAuth URL directly
  await page.goto('https://www.reddit.com/login/', { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Click "Continue with Google"
  var googleBtn = await page.$('button:has-text("Continue with Google")') || await page.$('a[href*="google"]') || await page.$('button[class*="google"]');
  if (googleBtn) {
    console.log('Clicking Google SSO...');
    await googleBtn.click();
    await page.waitForTimeout(5000);
    console.log('URL:', page.url().slice(0, 80));

    // Check if Google account picker appears
    var accountBtn = await page.$('[data-identifier]');
    if (accountBtn) {
      await accountBtn.click();
      await page.waitForTimeout(5000);
      console.log('After picker:', page.url().slice(0, 80));
    }
  } else {
    console.log('Google button not found - trying direct OAuth URL');
    // Try navigating to known Google OAuth callback URLs
    await page.goto('https://www.reddit.com/api/v1/authorize/google', { timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log('Direct OAuth URL:', page.url().slice(0, 80));
  }

  var rdLoggedIn = page.url().includes('reddit.com') && !page.url().includes('login') && !page.url().includes('register');
  console.log('Reddit:', rdLoggedIn ? 'LOGGED IN ✓' : 'not logged in');
  accounts.reddit = rdLoggedIn;

  // 2. LINKEDIN via Google SSO
  console.log('\n=== LinkedIn ===');
  await page.goto('https://www.linkedin.com/login', { timeout: 20000 });
  await page.waitForTimeout(2000);

  var liGoogleBtn = await page.$('button:has-text("Google")') || await page.$('a[href*="google"]') || await page.$('[data-google]');
  if (liGoogleBtn) {
    console.log('Clicking Google SSO...');
    await liGoogleBtn.click();
    await page.waitForTimeout(5000);
    console.log('URL:', page.url().slice(0, 80));
  } else {
    console.log('Google button not found');
    // Try direct
    await page.goto('https://www.linkedin.com/uas/login?session_redirect=&fromSignIn=true&trk=guest_homepage-basic_nav-header-signin', { timeout: 15000 });
    await page.waitForTimeout(2000);
    // Look for Google OAuth
    var googleAuth = await page.$('[data-google]') || await page.$('button:has-text("Google")');
    if (googleAuth) { await googleAuth.click(); await page.waitForTimeout(5000); console.log('After click:', page.url().slice(0, 80)); }
  }

  var liLoggedIn = page.url().includes('linkedin.com') && !page.url().includes('login') && !page.url().includes('signup');
  console.log('LinkedIn:', liLoggedIn ? 'LOGGED IN ✓' : 'not logged in');
  accounts.linkedin = liLoggedIn;

  // 3. MEDIUM (verify)
  console.log('\n=== Medium ===');
  await page.goto('https://medium.com/m/oauth/google', { timeout: 15000 });
  await page.waitForTimeout(3000);
  var mdLoggedIn = page.url().includes('medium.com') && !page.url().includes('signin');
  console.log('Medium:', mdLoggedIn ? 'LOGGED IN ✓' : 'not logged in');
  accounts.medium = mdLoggedIn;

  // Summary
  console.log('\n══════════════════════════════════════════');
  console.log('  BSAHI Accounts:');
  for (var p in accounts) console.log('  ' + p + ': ' + (accounts[p] ? '✓' : '✗'));
  console.log('');
  console.log('  HN: https://news.ycombinator.com/submitted?id=BSAHI');
  console.log('  Medium: @BSAHI');
  console.log('  Nostr: https://snort.social/p/b4bc93933169b6a288d08a2599832f05ff6b3a72a801a60b5266a29295bcaedc');
  console.log('══════════════════════════════════════════');

  await browser.close();
}

createAccounts().catch(function(e) { console.error('Error:', e); process.exit(1); });
