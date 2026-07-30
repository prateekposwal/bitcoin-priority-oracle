var { chromium } = require('playwright');
var fs = require('fs');
var path = require('path');

var PROFILES_DIR = path.resolve(__dirname, '..', '..', 'profiles');
var CRED_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'employee-creds.json');
var AGENT = 'BSAHI Account Creator';

var PASSWORD = 'BSAHI_Live2024!';
var MAIL_DOMAIN = null;
var MAIL_TOKEN = null;
var MAIL_ACCOUNTS = {};

var EMPLOYEES = [
  { id: 'satoshi', name: 'Satoshi Block',  avatar: '⚡', platforms: ['reddit', 'medium'] },
  { id: 'hal',     name: 'Hal Finney Jr',  avatar: '🔬', platforms: ['reddit'] },
  { id: 'lisa',    name: 'Lisa Nakamoto',  avatar: '📊', platforms: ['medium'] },
  { id: 'wei',     name: 'Wei Dai III',    avatar: '🧮', platforms: ['reddit'] },
  { id: 'nick',    name: 'Nick Szabo Jr',  avatar: '📈', platforms: ['medium'] }
];

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

function loadCreds() {
  try { return JSON.parse(fs.readFileSync(CRED_PATH, 'utf8')); } catch (e) { return { accounts: [] }; }
}

function saveCreds(data) {
  fs.writeFileSync(CRED_PATH, JSON.stringify(data, null, 2));
}

async function initMail() {
  log('Setting up mail.tm...');
  var resp = await fetch('https://api.mail.tm/domains');
  var data = await resp.json();
  MAIL_DOMAIN = data['hydra:member'][0].domain;
  log('Mail domain: ' + MAIL_DOMAIN);
}

async function createMailAccount(empId) {
  if (!MAIL_DOMAIN) await initMail();
  var addr = 'bsahi.' + empId + Math.floor(Math.random() * 10000) + '@' + MAIL_DOMAIN;
  log('Creating email: ' + addr);

  var resp = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: addr, password: PASSWORD })
  });
  var data = await resp.json();
  if (!data.address) throw new Error('Mail account failed: ' + JSON.stringify(data));

  // Get token for checking inbox
  var tresp = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: addr, password: PASSWORD })
  });
  var tdata = await tresp.json();
  MAIL_TOKEN = tdata.token;

  return { address: addr, password: PASSWORD, token: tdata.token };
}

async function waitForVerificationLink(token, timeoutMs) {
  timeoutMs = timeoutMs || 60000;
  var start = Date.now();
  while (Date.now() - start < timeoutMs) {
    var resp = await fetch('https://api.mail.tm/messages', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (data['hydra:member'] && data['hydra:member'].length > 0) {
      var msg = data['hydra:member'][0];
      // Get full message
      var mresp = await fetch('https://api.mail.tm/messages/' + msg.id, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var mdata = await mresp.json();
      // Look for verification link in HTML
      var html = mdata.html ? mdata.html[0] : '';
      var match = html.match(/https?:\/\/[^"'\s]+(?:verify|confirm|activate)[^"'\s]*/i);
      if (match) return match[0];
      // Also check text
      var text = mdata.text ? mdata.text[0] : '';
      var tmatch = text.match(/https?:\/\/[^\s]+/);
      if (tmatch) return tmatch[0];
    }
    await new Promise(function(r) { setTimeout(r, 2000); });
  }
  return null;
}

async function createRedditAccount(page, emp, email) {
  log('Creating Reddit account for ' + emp.name + ' (' + email.address + ')...');

  var username = 'BSAHI_' + emp.id.charAt(0).toUpperCase() + emp.id.slice(1);

  await page.goto('https://www.reddit.com/register/', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Fill signup form
  try {
    var emailField = await page.$('[name="email"]');
    if (emailField) await emailField.fill(email.address);

    var unameField = await page.$('[name="username"]');
    if (unameField) {
      await unameField.fill(username);
    } else {
      // Try alternative selector
      var altUname = await page.$('#regUsername');
      if (altUname) await altUname.fill(username);
    }

    var passField = await page.$('[name="password"]');
    if (passField) await passField.fill(PASSWORD);

    // Click submit
    var submitBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Continue")');
    if (submitBtn) await submitBtn.click();

    await page.waitForTimeout(3000);
    log('Reddit account created for ' + emp.name + ' (username: ' + username + ')');
    return { platform: 'reddit', username: username, email: email.address, password: PASSWORD };
  } catch (e) {
    log('Reddit signup error: ' + e.message);
    return null;
  }
}

async function createMediumAccount(page, emp, email) {
  log('Creating Medium account for ' + emp.name + ' (' + email.address + ')...');

  var username = 'BSAHI_' + emp.id.charAt(0).toUpperCase() + emp.id.slice(1);

  await page.goto('https://medium.com/m/signin', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click "Sign up with email"
  try {
    var emailBtn = await page.$('button:has-text("Email")') || await page.$('a:has-text("Sign up")');
    if (emailBtn) await emailBtn.click();
    await page.waitForTimeout(1000);

    var emailField = await page.$('[type="email"]') || await page.$('[name="email"]');
    if (emailField) await emailField.fill(email.address);

    var submitBtn = await page.$('button[type="submit"]') || await page.$('[data-action="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForTimeout(2000);

    // Check for verification code input
    var codeField = await page.$('[type="text"][inputmode="numeric"]');
    if (codeField) {
      // Wait for verification code in email
      log('Waiting for Medium verification code...');
      var code = await waitForVerificationCode(email.token, 120000);
      if (code) {
        await codeField.fill(code);
        await page.waitForTimeout(1000);
        log('Medium account created for ' + emp.name + ' (username: ' + username + ')');
        return { platform: 'medium', username: username, email: email.address, password: PASSWORD };
      }
    }
  } catch (e) {
    log('Medium signup error: ' + e.message);
  }
  return null;
}

async function waitForVerificationCode(token, timeoutMs) {
  var start = Date.now();
  while (Date.now() - start < timeoutMs) {
    var resp = await fetch('https://api.mail.tm/messages', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await resp.json();
    if (data['hydra:member'] && data['hydra:member'].length > 0) {
      var msg = data['hydra:member'][0];
      var mresp = await fetch('https://api.mail.tm/messages/' + msg.id, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var mdata = await mresp.json();
      var html = mdata.html ? mdata.html[0] : '';
      // Try to find numeric code
      var codeMatch = html.match(/\b(\d{4,8})\b/);
      if (codeMatch) return codeMatch[1];
      // Mark as read so we don't process again
    }
    await new Promise(function(r) { setTimeout(r, 3000); });
  }
  return null;
}

async function createAllAccounts() {
  log('=== BSAHI Employee Account Creation ===');
  log('');

  await initMail();
  var creds = loadCreds();
  var results = [];

  for (var i = 0; i < EMPLOYEES.length; i++) {
    var emp = EMPLOYEES[i];
    log('─── ' + emp.avatar + ' ' + emp.name + ' ───');

    // Create email account
    var email = await createMailAccount(emp.id);
    MAIL_ACCOUNTS[emp.id] = email;
    log('Email: ' + email.address);

    // Create browser profile directory
    var profileDir = path.join(PROFILES_DIR, emp.id);
    if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

    var browser = await chromium.launchPersistentContext(profileDir, {
      headless: false,
      args: ['--no-sandbox'],
      locale: 'en-US',
      viewport: { width: 1280, height: 800 }
    });
    var page = await browser.newPage();
    var empAccounts = [];

    for (var p = 0; p < emp.platforms.length; p++) {
      var platform = emp.platforms[p];
      var account = null;

      try {
        if (platform === 'reddit') {
          account = await createRedditAccount(page, emp, email);
        } else if (platform === 'medium') {
          account = await createMediumAccount(page, emp, email);
        }
      } catch (e) {
        log(platform + ' failed for ' + emp.id + ': ' + e.message);
      }

      if (account) {
        empAccounts.push(account);
        results.push(account);
        log(emp.name + ' → ' + platform + ': ' + account.username);
      }
    }

    await browser.close();

    // Save credentials
    creds.accounts.push({
      employee: emp.id,
      name: emp.name,
      email: email.address,
      emailPassword: PASSWORD,
      accounts: empAccounts
    });
    saveCreds(creds);
  }

  log('');
  log('=== Account Creation Complete ===');
  log('Created ' + results.length + ' accounts for ' + EMPLOYEES.length + ' employees');
  log('');
  log('Credentials saved to: ' + CRED_PATH);
  log('');
  log('Each employee browser profile saved at: profiles/[id]/');
  log('To test posting: node tools/marketing/browser-publisher.js');

  return results;
}

if (require.main === module) {
  createAllAccounts().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}

module.exports = { createAllAccounts: createAllAccounts };
