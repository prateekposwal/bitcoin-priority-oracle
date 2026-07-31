var { chromium } = require('playwright');
var { spawn } = require('child_process');
var fs = require('fs');
var path = require('path');

var SRC = '/Users/prateekposwal/Library/Application Support/Google/Chrome/Profile 2';
var DST = '/Users/prateekposwal/Desktop/block-space-economics/relay-data/chrome-bsahi';
var PORT = 9223;

function copyProfile() {
  if (fs.existsSync(path.join(DST, 'Default', 'Cookies'))) {
    console.log('Profile copy exists, using it');
    return;
  }
  console.log('Copying Profile 2 to ' + DST + '...');
  var essentials = ['Cookies', 'Cookies-journal', 'Login Data', 'Login Data-journal', 'Local Storage',
    'Network Persistent State', 'Preferences', 'Secure Preferences', 'Web Data', 'Bookmarks',
    'Top Sites', 'Sessions', 'History'];
  var def = path.join(DST, 'Default');
  if (!fs.existsSync(def)) fs.mkdirSync(def, { recursive: true });
  essentials.forEach(function(name) {
    var src = path.join(SRC, 'Default', name);
    var dst = path.join(def, name);
    try {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
        fs.readdirSync(src).forEach(function(f) { try { fs.copyFileSync(path.join(src, f), path.join(dst, f)); } catch(e) {} });
      } else { fs.copyFileSync(src, dst); }
    } catch(e) {}
  });
  console.log('Profile copied');
}

async function launchAndPost() {
  copyProfile();

  console.log('Launching Chrome with remote debugging...');
  var chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--user-data-dir=' + DST,
    '--remote-debugging-port=' + PORT,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled'
  ], { stdio: 'ignore', detached: true });
  chrome.unref();

  for (var i = 0; i < 30; i++) {
    await new Promise(function(r) { setTimeout(r, 1000); });
    try {
      var resp = await fetch('http://localhost:' + PORT + '/json/version');
      if (resp.ok) { console.log('Chrome ready'); break; }
    } catch(e) {}
  }

  console.log('Connecting via CDP...');
  var browser = await chromium.connectOverCDP('http://localhost:' + PORT);
  console.log('Connected!');

  var context = browser.contexts()[0];
  var page = await context.newPage();

  // Test Reddit
  console.log('\n=== Reddit ===');
  await page.goto('https://www.reddit.com/', { timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log('Home:', (await page.url()).slice(0, 50));

  var loggedIn = await page.evaluate(function() {
    var hasLogIn = document.body.textContent.includes('Log In');
    var hasAvatar = !!document.querySelector('[data-testid="user-drawer-button"]');
    return !hasLogIn || hasAvatar;
  });
  console.log('Logged in:', loggedIn);

  if (loggedIn) {
    await page.goto('https://www.reddit.com/r/Bitcoin/submit', { timeout: 20000 });
    await page.waitForTimeout(3000);
    console.log('Submit:', (await page.url()).slice(0, 80));
    var submitLoggedIn = !(await page.url()).includes('login');
    console.log('Submit logged in:', submitLoggedIn);

    if (submitLoggedIn) {
      // Fill the form - Reddit new UI uses contenteditable or inputs
      var fields = await page.evaluate(function() {
        return Array.from(document.querySelectorAll('input, textarea, [contenteditable], [role="textbox"]')).slice(0, 10).map(function(el) {
          return { tag: el.tagName, name: el.getAttribute('name'), type: el.getAttribute('type'), id: el.id, ph: (el.getAttribute('placeholder') || '').slice(0, 25) };
        });
      });
      console.log('Fields:', JSON.stringify(fields, null, 2));
    }
  }

  await browser.close();
  process.exit(0);
}

launchAndPost().catch(function(e) { console.error('Error:', e); process.exit(1); });
