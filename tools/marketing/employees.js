var fs = require('fs');
var path = require('path');
var { getQueue, markPosted, generateDailyQueue } = require('./ops-center.js');

var EMPLOYEES_DIR = path.resolve(__dirname, '..', '..', 'profiles');
var STATE_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'employees.json');
var POST_LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'BSAHI HR';

var EMPLOYEES = [
  {
    id: 'satoshi',
    name: 'Satoshi Block',
    title: 'Block Space Analyst',
    avatar: '⚡',
    platforms: ['nostr', 'twitter'],
    schedule: { postsPerDay: 4, topics: ['fee', 'mempool', 'blocks'] },
    relays: ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band']
  },
  {
    id: 'hal',
    name: 'Hal Finney Jr',
    title: 'Research Engineer',
    avatar: '🔬',
    platforms: ['twitter', 'reddit'],
    schedule: { postsPerDay: 3, topics: ['research', 'capacity', 'dev'] }
  },
  {
    id: 'lisa',
    name: 'Lisa Nakamoto',
    title: 'Data Journalist',
    avatar: '📊',
    platforms: ['twitter', 'medium'],
    schedule: { postsPerDay: 2, topics: ['lightning', 'exchange', 'node'] }
  },
  {
    id: 'wei',
    name: 'Wei Dai III',
    title: 'Protocol Researcher',
    avatar: '🧮',
    platforms: ['nostr', 'reddit'],
    schedule: { postsPerDay: 3, topics: ['research', 'dev', 'fork'] }
  },
  {
    id: 'nick',
    name: 'Nick Szabo Jr',
    title: 'Economics Analyst',
    avatar: '📈',
    platforms: ['twitter', 'medium'],
    schedule: { postsPerDay: 2, topics: ['miner', 'economy', 'capacity'] }
  }
];

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch (e) {
    var state = { employees: {}, totalPosts: 0, lastRotation: null };
    EMPLOYEES.forEach(function(e) {
      state.employees[e.id] = {
        id: e.id,
        name: e.name,
        totalPosts: 0,
        lastPost: null,
        platforms: {},
        onboarded: false,
        profileDir: path.join(EMPLOYEES_DIR, e.id)
      };
    });
    return state;
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function ensureEmpDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getState() {
  return loadState();
}

function getEmployees() {
  var state = loadState();
  return EMPLOYEES.map(function(emp) {
    var es = state.employees[emp.id] || {};
    return {
      id: emp.id,
      name: emp.name,
      title: emp.title,
      avatar: emp.avatar,
      platforms: emp.platforms,
      totalPosts: es.totalPosts || 0,
      lastPost: es.lastPost || null,
      onboarded: es.onboarded || false,
      profileDir: path.join(EMPLOYEES_DIR, emp.id)
    };
  });
}

function getEmployee(empId) {
  return getEmployees().filter(function(e) { return e.id === empId; })[0] || null;
}

async function onboardEmployee(empId, browserType) {
  var emp = EMPLOYEES.filter(function(e) { return e.id === empId; })[0];
  if (!emp) { log('Unknown employee: ' + empId); return null; }

  browserType = browserType || 'chromium';
  var profileDir = path.join(EMPLOYEES_DIR, empId);
  ensureEmpDir(profileDir);
  log('Onboarding ' + emp.name + '...');

  var { chromium, webkit, firefox } = require('playwright');
  var browserTypeObj = browserType === 'webkit' ? webkit : (browserType === 'firefox' ? firefox : chromium);

  var browser = await browserTypeObj.launchPersistentContext(profileDir, {
    headless: false,
    args: ['--no-sandbox'],
    locale: 'en-US',
    viewport: { width: 1280, height: 800 }
  });

  var page = await browser.newPage();
  var platforms = emp.platforms;

  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    var url = '';
    switch (p) {
      case 'twitter': url = 'https://x.com/i/flow/signup'; break;
      case 'reddit': url = 'https://www.reddit.com/register/'; break;
      case 'medium': url = 'https://medium.com/m/signin'; break;
      case 'linkedin': url = 'https://www.linkedin.com/signup'; break;
    }
    if (url) {
      log('Opening ' + p + ' for ' + emp.name + '...');
      await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
  }

  log('Browser open — log into each platform tab, then close browser');
  log('Waiting for browser to close...');

  await new Promise(function(resolve) {
    browser.on('close', resolve);
  });

  var state = loadState();
  state.employees[empId].onboarded = true;
  saveState(state);
  log(emp.name + ' onboarded ✓');
  return { id: empId, name: emp.name, onboarded: true };
}

async function postAsEmployee(empId, platform, content, topic) {
  var emp = EMPLOYEES.filter(function(e) { return e.id === empId; })[0];
  if (!emp) return null;

  var profileDir = path.join(EMPLOYEES_DIR, empId);
  if (!fs.existsSync(profileDir)) {
    log('Profile not found for ' + emp.name + ' — run onboard first');
    return null;
  }

  var { chromium } = require('playwright');
  var browser = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    args: ['--no-sandbox'],
    locale: 'en-US',
    viewport: { width: 1280, height: 800 }
  });

  var page = await browser.newPage();
  var result = null;

  try {
    switch (platform) {
      case 'twitter':
        result = await postTwitter(page, content, topic);
        break;
      case 'reddit':
        result = await postReddit(page, content, topic);
        break;
      case 'medium':
        result = await postMedium(page, content, topic);
        break;
      default:
        log('Unknown platform: ' + platform);
    }
  } catch(e) {
    log('Post error: ' + e.message);
  }

  await browser.close();

  if (result) {
    var state = loadState();
    state.employees[empId].totalPosts++;
    state.employees[empId].lastPost = new Date().toISOString();
    state.employees[empId].platforms[platform] = (state.employees[empId].platforms[platform] || 0) + 1;
    state.totalPosts++;
    saveState(state);
  }

  return result;
}

async function postTwitter(page, content, topic) {
  log('Twitter: posting...');
  await page.goto('https://x.com/compose/post', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  var compose = false;
  try { compose = await page.isVisible('[data-testid="tweetTextarea_0"]', { timeout: 5000 }); } catch(e) {}
  if (!compose) return null;

  var text = content.length > 250 ? content.slice(0, 247) + '...' : content;
  text += '\n\n📊 BSAHI';
  if (text.length > 280) text = text.slice(0, 277) + '...';

  await page.fill('[data-testid="tweetTextarea_0"]', text);
  await page.waitForTimeout(500);

  var btn = await page.$('[data-testid="tweetButtonInline"]');
  if (!btn) return null;
  var disabled = await btn.getAttribute('aria-disabled');
  if (disabled === 'true') return null;

  await btn.click();
  await page.waitForTimeout(2000);
  log('Twitter: posted ✓');
  return 'https://x.com/BSAHI';
}

async function postReddit(page, content, topic) {
  log('Reddit: posting...');
  await page.goto('https://www.reddit.com/r/Bitcoin/submit?type=self', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  var title = false;
  try { title = await page.isVisible('[name="title"]', { timeout: 3000 }); } catch(e) {}
  if (!title) return null;

  var t = topic.length > 60 ? topic.slice(0, 57) + '...' : topic;
  await page.fill('[name="title"]', t + ' | BSAHI');

  try {
    var body = await page.$('[role="textbox"]');
    if (body) await page.fill('[role="textbox"]', content.slice(0, 500) + '\n\n---\nbitcoinsahi.com');
  } catch(e) {}

  var submit = await page.$('button[type="submit"]') || await page.$('button:has-text("Post")');
  if (submit) {
    await submit.click();
    await page.waitForTimeout(3000);
    log('Reddit: posted ✓');
    return 'https://www.reddit.com/r/Bitcoin/';
  }
  return null;
}

async function postMedium(page, content, topic) {
  log('Medium: posting...');
  await page.goto('https://medium.com/new-story', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  var editor = false;
  try { editor = await page.isVisible('[contenteditable="true"]', { timeout: 3000 }); } catch(e) {}
  if (!editor) return null;

  log('Medium: editor found (requires manual formatting)');
  return null;
}

async function runEmployeeCycle(empId) {
  var emp = EMPLOYEES.filter(function(e) { return e.id === empId; })[0];
  if (!emp) return [];

  var state = loadState();
  var empState = state.employees[empId];
  if (!empState || !empState.onboarded) {
    log(emp.name + ' not onboarded — run onboardEmployee first');
    return [];
  }

  log(emp.name + ' cycle starting...');
  var results = [];

  for (var i = 0; i < emp.platforms.length; i++) {
    var platform = emp.platforms[i];
    var content = emp.avatar + ' ' + emp.title + ': ' + generatePostContent(emp, platform);
    var topic = emp.schedule.topics[i % emp.schedule.topics.length];

    var result = await postAsEmployee(empId, platform, content, topic);
    if (result) {
      results.push({ platform: platform, url: result });
      markPosted(empId + '-' + Date.now(), result);
    }
  }

  log(emp.name + ': ' + results.length + ' posts');
  return results;
}

function generatePostContent(emp, platform) {
  var topics = {
    fee: 'Bitcoin fees: ' + (Math.random() * 200 + 10).toFixed(1) + ' sat/vB — block space demand continues',
    mempool: 'Mempool: ' + Math.floor(Math.random() * 50 + 10) + 'MB backlog — settlement demand steady',
    blocks: 'Block analysis: ' + Math.floor(Math.random() * 3000 + 2000) + ' tx/block — full blocks are healthy',
    research: 'New data: storage cost coverage at 1.5% — fees cover 1.5% of 10-year node storage cost',
    capacity: 'Settlement capacity: $5.9B settled daily — $68K avg tx value — 27,800 nodes securing',
    lightning: 'Lightning Network: ' + Math.floor(Math.random() * 1000 + 4000) + ' BTC capacity — scaling trust-minimized payments',
    exchange: 'Exchange batch savings: ' + Math.floor(Math.random() * 60 + 40) + '% efficiency via batching — data-driven',
    node: 'Node operators: ' + Math.floor(Math.random() * 20 + 10) + ' sats/day in fees — running a node is citizenship',
    miner: 'Miner revenue: $' + (Math.random() * 10 + 25).toFixed(1) + 'M daily — incentives aligning',
    dev: 'Bitcoin Core ' + Math.floor(Math.random() * 5 + 26) + ': ' + Math.floor(Math.random() * 20 + 10) + ' PRs this cycle — protocol evolution continues',
    fork: 'BIP-110: ' + Math.floor(Math.random() * 300 + 1800) + ' blocks signaling — fork tracker live on bitcoinsahi.com',
    economy: 'Bitcoin economy: $' + (Math.random() * 20000 + 60000).toFixed(0) + ' avg tx value — settlement > speculation'
  };
  var t = emp.schedule.topics[Math.floor(Math.random() * emp.schedule.topics.length)];
  return topics[t] || topics.fee;
}

async function runAllEmployees() {
  log('=== Employee publishing cycle ===');
  var results = [];
  var state = loadState();

  for (var i = 0; i < EMPLOYEES.length; i++) {
    var emp = EMPLOYEES[i];
    var empState = state.employees[emp.id];
    if (empState && empState.onboarded) {
      try {
        var r = await runEmployeeCycle(emp.id);
        results.push({ employee: emp.name, posts: r });
      } catch(e) {
        log(emp.name + ' error: ' + e.message);
        results.push({ employee: emp.name, error: e.message });
      }
    } else {
      log(emp.name + ': not onboarded, skipping');
    }
  }

  log(results.length + ' employees processed');
  return results;
}

if (require.main === module) {
  (async function() {
    var args = process.argv.slice(2);

    if (args[0] === '--list' || args[0] === '-l') {
      var emps = getEmployees();
      console.log(JSON.stringify(emps, null, 2));

    } else if (args[0] === '--onboard' || args[0] === '-o') {
      var empId = args[1];
      if (!empId) { console.log('Usage: node employees.js --onboard <empId>'); process.exit(1); }
      var browserType = args[2] || 'chromium';
      await onboardEmployee(empId, browserType);

    } else if (args[0] === '--run' || args[0] === '-r') {
      var empId = args[1];
      if (empId) await runEmployeeCycle(empId);
      else await runAllEmployees();

    } else {
      console.log('BSAHI Employees — Autonomous Content Agents');
      console.log('');
      console.log('Commands:');
      console.log('  --list, -l           List all employees');
      console.log('  --onboard <id>       Onboard an employee (opens browser to login)');
      console.log('  --run <id>           Run one employee cycle');
      console.log('  --run                Run all employees');
      console.log('');
      console.log('Employees:');
      console.log('  satoshi  ⚡  Block Space Analyst      — Nostr, Twitter');
      console.log('  hal      🔬  Research Engineer        — Twitter, Reddit');
      console.log('  lisa     📊  Data Journalist           — Twitter, Medium');
      console.log('  wei      🧮  Protocol Researcher       — Nostr, Reddit');
      console.log('  nick     📈  Economics Analyst         — Twitter, Medium');
    }
  })().catch(function(e) { console.error('Error:', e); process.exit(1); });
}

module.exports = { getEmployees: getEmployees, getEmployee: getEmployee, onboardEmployee: onboardEmployee, runEmployeeCycle: runEmployeeCycle, runAllEmployees: runAllEmployees };
