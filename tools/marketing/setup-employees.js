var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var PROFILES_DIR = path.resolve(__dirname, '..', '..', 'profiles');
var STATE_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'employees.json');
var AGENT = 'BSAHI Setup';

var PASSWORD = 'BSAHI_Live2024!';

var EMPLOYEES = [
  { id: 'satoshi', name: 'Satoshi Block',  avatar: '⚡', platforms: ['twitter', 'reddit'] },
  { id: 'hal',     name: 'Hal Finney Jr',  avatar: '🔬', platforms: ['twitter', 'reddit'] },
  { id: 'lisa',    name: 'Lisa Nakamoto',  avatar: '📊', platforms: ['medium', 'twitter'] },
  { id: 'wei',     name: 'Wei Dai III',    avatar: '🧮', platforms: ['reddit'] },
  { id: 'nick',    name: 'Nick Szabo Jr',  avatar: '📈', platforms: ['medium', 'twitter'] }
];

var PLATFORM_URLS = {
  twitter: 'https://x.com/i/flow/signup',
  reddit: 'https://www.reddit.com/register/',
  medium: 'https://medium.com/m/signin'
};

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [' + AGENT + '] ' + msg); }

async function setupAll() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     BSAHI — Employee Account Setup                  ║');
  console.log('║                                                     ║');
  console.log('║  Browser will open for each step.                    ║');
  console.log('║  Create the account, then the session is saved.       ║');
  console.log('║  You can close the browser after each step.          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  for (var i = 0; i < EMPLOYEES.length; i++) {
    var emp = EMPLOYEES[i];
    var profileDir = path.join(PROFILES_DIR, emp.id);
    if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

    console.log('');
    console.log('─── ' + emp.avatar + ' ' + emp.name + ' ───');
    console.log('  Platforms: ' + emp.platforms.join(', '));
    console.log('  Profile: ' + profileDir);
    console.log('');

    var browser = await chromium.launchPersistentContext(profileDir, {
      headless: false,
      channel: 'chrome',
      args: ['--no-sandbox', '--window-size=1100,800'],
      locale: 'en-US',
      viewport: { width: 1100, height: 800 }
    });

    var page = await browser.newPage();

    for (var p = 0; p < emp.platforms.length; p++) {
      var platform = emp.platforms[p];
      var url = PLATFORM_URLS[platform];

      console.log('  Opening ' + platform + '...');
      await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      console.log('  URL: ' + page.url().slice(0, 80));

      if (platform === 'twitter') {
        console.log('  ┌─────────────────────────────────────────────┐');
        console.log('  │ Create @BSAHI_' + emp.id.charAt(0).toUpperCase() + emp.id.slice(1) + '     │');
        console.log('  │ Use: ' + emp.id + '+bsahi@gmail.com            │');
        console.log('  │ Password: ' + PASSWORD + '  │');
        console.log('  │ Then verify email in your inbox.             │');
        console.log('  └─────────────────────────────────────────────┘');
      } else if (platform === 'reddit') {
        console.log('  ┌─────────────────────────────────────────────┐');
        console.log('  │ Create u/BSAHI_' + emp.id.charAt(0).toUpperCase() + emp.id.slice(1) + '        │');
        console.log('  │ Use: ' + emp.id + '+bsahi@gmail.com            │');
        console.log('  │ Password: ' + PASSWORD + '  │');
        console.log('  │ Click "Sign up with Google" if available.    │');
        console.log('  └─────────────────────────────────────────────┘');
      } else if (platform === 'medium') {
        console.log('  ┌─────────────────────────────────────────────┐');
        console.log('  │ Sign in with Google or create @BSAHI_' + emp.id.charAt(0).toUpperCase() + emp.id.slice(1));
        console.log('  │ Use: ' + emp.id + '+bsahi@gmail.com            │');
        console.log('  │ Password: ' + PASSWORD + '  │');
        console.log('  └─────────────────────────────────────────────┘');
      }

      console.log('');
      console.log('  → Waiting for you to finish (close browser when done)...');
    }

    // Wait for browser close
    await new Promise(function(resolve) { browser.on('close', resolve); });
    log(emp.name + ': profile saved');

    // Mark onboarded
    try {
      var state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      state.employees[emp.id].onboarded = true;
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    } catch(e) {}
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  ALL EMPLOYEES SETUP COMPLETE ✓                    ║');
  console.log('║  ' + EMPLOYEES.length + ' employees ready to post                  ║');
  console.log('║  Run: node tools/marketing/employees.js --run      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
}

if (require.main === module) {
  setupAll().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}
