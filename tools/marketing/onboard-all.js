var { chromium } = require('playwright');
var path = require('path');
var { getEmployees } = require('./employees.js');

var EMPLOYEES_DIR = path.resolve(__dirname, '..', '..', 'profiles');

var ONBOARDING_STEPS = [
  {
    platform: 'twitter',
    url: 'https://x.com/signup',
    instructions: 'Create a BSAHI employee Twitter account. Use the name shown in the browser title.',
    note: 'Use a new email for each employee (e.g. satoshi@bsahi.email, hal@bsahi.email)'
  },
  {
    platform: 'reddit',
    url: 'https://www.reddit.com/register/',
    instructions: 'Create a BSAHI employee Reddit account. Use the username format: BSAHI_FirstName',
    note: 'Email verification may be needed — verify in your inbox'
  },
  {
    platform: 'medium',
    url: 'https://medium.com/m/signin',
    instructions: 'Sign up for Medium with the employee email. Username: @BSAHI_FirstName',
    note: 'Use "Sign in with Google" or email'
  }
];

async function onboardAll() {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('   BSAHI — Batch Employee Onboarding');
  console.log('   You will create 5 employee accounts');
  console.log('   across Twitter, Reddit, and Medium.');
  console.log('   Total time: ~15 minutes');
  console.log('══════════════════════════════════════════════');
  console.log('');
  console.log('Recommended account names:');
  console.log('  ⚡ Satoshi Block  → @BSAHI_Satoshi   / u/BSAHI_Satoshi');
  console.log('  🔬 Hal Finney Jr → @BSAHI_Hal       / u/BSAHI_Hal');
  console.log('  📊 Lisa Nakamoto → @BSAHI_Lisa      / @BSAHI_Lisa');
  console.log('  🧮 Wei Dai III   → @BSAHI_Wei      / u/BSAHI_Wei');
  console.log('  📈 Nick Szabo Jr → @BSAHI_Nick      / @BSAHI_Nick');
  console.log('');
  console.log('Tips:');
  console.log('  - Use +email trick: satoshi+bsahi@gmail.com, hal+bsahi@gmail.com');
  console.log('  - Use same password for all (store in password manager)');
  console.log('  - Complete each step, then close the browser tab');
  console.log('  - Browser will open automatically for each step');
  console.log('');

  var emps = getEmployees();
  var total = emps.length;
  var completed = 0;

  for (var i = 0; i < emps.length; i++) {
    var emp = emps[i];

    // Create employee profile directory
    var profileDir = path.join(EMPLOYEES_DIR, emp.id);
    if (!require('fs').existsSync(profileDir)) require('fs').mkdirSync(profileDir, { recursive: true });

    for (var s = 0; s < ONBOARDING_STEPS.length; s++) {
      var step = ONBOARDING_STEPS[s];

      // Skip if employee doesn't use this platform
      if (emp.platforms.indexOf(step.platform) < 0) {
        console.log('  [' + emp.id + '] skipping ' + step.platform + ' (not assigned)');
        continue;
      }

      console.log('');
      console.log('─── Step ' + (++completed) + '/' + (emps.length * 2) + ' ──────────────────────');
      console.log('  Employee: ' + emp.avatar + ' ' + emp.name);
      console.log('  Platform: ' + step.platform);
      console.log('  URL:      ' + step.url);
      console.log('  Do:       ' + step.instructions);
      console.log('');
      console.log('  ⚠ Browser will open. Create the account, then close the browser.');
      console.log('  The system saves the session automatically.');
      console.log('');

      var browser = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        args: ['--no-sandbox'],
        locale: 'en-US',
        viewport: { width: 1280, height: 800 }
      });

      var page = await browser.newPage();
      await page.goto(step.url, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Wait for browser to close
      console.log('  (Waiting for you to finish and close the browser...)');
      await new Promise(function(resolve) { browser.on('close', resolve); });

      console.log('  ✓ ' + emp.name + ' → ' + step.platform + ' saved');
      console.log('');
    }

    // Mark employee as onboarded
    var fs = require('fs');
    var STATE_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'employees.json');
    var state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    state.employees[emp.id].onboarded = true;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  }

  console.log('══════════════════════════════════════════════');
  console.log('   ALL EMPLOYEES ONBOARDED ✓');
  console.log('   ' + emps.length + ' employees ready to post');
  console.log('   Run: node tools/marketing/employees.js --run');
  console.log('══════════════════════════════════════════════');
}

if (require.main === module) {
  onboardAll().catch(function(e) { console.error('Error:', e); process.exit(1); });
}

module.exports = { onboardAll: onboardAll };
