var fs = require('fs');
var path = require('path');
var { chromium } = require('playwright');

var CHROME_PROFILE = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Default';
var SESSION_DIR = path.resolve(__dirname, '..', '..', 'sessions');

var TARGETS = [
  { name: 'twitter', url: 'https://x.com/home', check: 'x.com/home', not: 'login' },
  { name: 'reddit', url: 'https://www.reddit.com/', check: 'reddit.com', not: 'login|register' },
  { name: 'medium', url: 'https://medium.com/', check: 'medium.com', not: 'signin|sign-up' },
  { name: 'linkedin', url: 'https://www.linkedin.com/feed/', check: 'linkedin.com/feed', not: 'login|signup' }
];

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [SessionExtract] ' + msg); }

async function extract() {
  log('Opening Chrome to extract platform sessions...');
  
  var browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false, channel: 'chrome', args: ['--no-sandbox'], locale: 'en-US'
  });
  
  var results = {};
  
  for (var i = 0; i < TARGETS.length; i++) {
    var target = TARGETS[i];
    log('Checking ' + target.name + '...');
    
    try {
      var page = await browser.newPage();
      await page.goto(target.url, { timeout: 20000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      var currentUrl = page.url();
      var loggedIn = currentUrl.includes(target.check) && !currentUrl.includes('login') && !currentUrl.includes('register');
      if (target.name === 'twitter') loggedIn = currentUrl.includes('x.com') && !currentUrl.includes('login') && !currentUrl.includes('onboarding');
      if (target.name === 'reddit') loggedIn = currentUrl.includes('reddit.com') && !currentUrl.includes('login') && !currentUrl.includes('register');
      if (target.name === 'medium') loggedIn = currentUrl.includes('medium.com') && !currentUrl.includes('signin');
      
      if (loggedIn) {
        var cookies = await browser.cookies();
        var platformCookies = cookies.filter(function(c) {
          return c.domain.includes(target.name) || c.domain.includes('x.com');
        });
        
        results[target.name] = {
          loggedIn: true,
          cookies: platformCookies,
          count: platformCookies.length,
          url: page.url().slice(0, 60)
        };
        log(target.name + ': ✓ LOGGED IN (' + platformCookies.length + ' cookies)');
      } else {
        results[target.name] = { loggedIn: false, cookies: [] };
        log(target.name + ': ✗ not logged in');
      }
      
      await page.close();
    } catch(e) {
      log(target.name + ': error - ' + e.message.slice(0, 60));
      results[target.name] = { loggedIn: false, error: e.message };
    }
  }
  
  await browser.close();
  
  // Save sessions
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
  
  var activeSessions = {};
  for (var p in results) {
    if (results[p].loggedIn && results[p].cookies) {
      activeSessions[p] = results[p].cookies;
    }
  }
  
  fs.writeFileSync(path.join(SESSION_DIR, 'sessions.json'), JSON.stringify(results, null, 2));
  
  // Also save a compact version for posting
  var sessionFile = path.join(SESSION_DIR, 'active.json');
  fs.writeFileSync(sessionFile, JSON.stringify(activeSessions, null, 2));
  
  log('');
  log('══════════════════════════════════════════');
  log('  Sessions extracted');
  var count = Object.keys(activeSessions).length;
  log('  ' + count + '/' + TARGETS.length + ' platforms active');
  log('  Saved to: ' + SESSION_DIR);
  log('══════════════════════════════════════════');
  
  return results;
}

if (require.main === module) {
  extract().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}

module.exports = { extract: extract };
