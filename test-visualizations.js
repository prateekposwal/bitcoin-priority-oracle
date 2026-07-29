const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://bitcoinsahi.com';
const TOOLS_DIR = path.join(__dirname, 'tools');

const REQUIRED_FILES = [
  'data-engine.js',
  'viz-core.js',
  'viz-fees.js',
  'viz-blockspace.js',
  'viz-utxo.js',
  'viz-lightning.js',
];

const RESULTS = { pass: 0, fail: 0, errors: [] };

function pass(name) {
  RESULTS.pass++;
  console.log(`  PASS  ${name}`);
}

function fail(name, detail) {
  RESULTS.fail++;
  const msg = `${name}: ${detail}`;
  RESULTS.errors.push(msg);
  console.log(`  FAIL  ${name}`);
  console.log(`        ${detail}`);
}

function checkFiles() {
  console.log('\n[1] Checking required tool files...');
  let ok = true;
  for (const f of REQUIRED_FILES) {
    const fp = path.join(TOOLS_DIR, f);
    if (fs.existsSync(fp)) {
      pass(`tools/${f} exists`);
    } else {
      fail(`tools/${f} exists`, `File not found: ${fp}`);
      ok = false;
    }
  }
  return ok;
}

async function testLivePage(browser) {
  console.log('\n[2] Testing /live page...');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const jsErrors = [];

  page.on('pageerror', err => jsErrors.push(err.message));

  // Navigate and wait for scripts to load
  await page.goto(`${BASE}/live`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait a bit for JS to execute & data engine to initialize
  await page.waitForTimeout(3000);

  // Check DATA_ENGINE exists
  const hasDataEngine = await page.evaluate(() => typeof window.DATA_ENGINE !== 'undefined');
  if (hasDataEngine) {
    pass('/live: DATA_ENGINE is defined');
  } else {
    fail('/live: DATA_ENGINE is defined', 'DATA_ENGINE not found on window');
  }

  // Check VIZ_Fees exists
  const hasVizFees = await page.evaluate(() => typeof window.VIZ_Fees !== 'undefined');
  if (hasVizFees) {
    pass('/live: VIZ_Fees is defined');
  } else {
    fail('/live: VIZ_Fees is defined', 'VIZ_Fees not found on window');
  }

  // Check DATA_ENGINE.get().fee_history (may be empty array if fetch hasn't completed)
  const hasFeeHistory = await page.evaluate(() => {
    try {
      const de = window.DATA_ENGINE;
      if (!de || !de.get) return 'no_get';
      const data = de.get();
      return Array.isArray(data.fee_history) ? data.fee_history.length : 'not_array';
    } catch (e) { return 'error: ' + e.message; }
  });

  if (typeof hasFeeHistory === 'number') {
    if (hasFeeHistory > 0) {
      pass(`/live: fee_history has ${hasFeeHistory} entries`);
    } else {
      pass(`/live: fee_history exists (empty array, API may need more time)`);
    }
  } else if (hasFeeHistory === 'no_get') {
    fail('/live: fee_history accessible', 'DATA_ENGINE.get is not a function');
  } else {
    fail('/live: fee_history accessible', String(hasFeeHistory));
  }

  // Check canvas renders
  const canvasExists = await page.evaluate(() => !!document.getElementById('fees-canvas'));
  if (canvasExists) pass('/live: fees-canvas element exists');
  else fail('/live: fees-canvas element exists', 'Element not found');

  // Record JS errors
  if (jsErrors.length > 0) {
    fail('/live: zero JS errors', jsErrors.join('; '));
  } else {
    pass('/live: zero JS errors');
  }

  await ctx.close();
}

async function testHomePage(browser) {
  console.log('\n[3] Testing / (home) page...');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const jsErrors = [];

  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check persona cards — 8 cards
  const personaCards = await page.evaluate(() => {
    return document.querySelectorAll('.persona-card').length;
  });
  if (personaCards === 8) {
    pass(`/: ${personaCards} persona cards found`);
  } else {
    fail(`/: 8 persona cards`, `Found ${personaCards}`);
  }

  // Check stats bar has live values
  const statsLive = await page.evaluate(() => {
    const names = ['stat-nodecost', 'stat-storage', 'stat-externality', 'stat-ratio'];
    const vals = {};
    for (const id of names) {
      const el = document.getElementById(id);
      vals[id] = el ? el.textContent.trim() : 'MISSING';
    }
    return vals;
  });

  let statsOk = 0;
  for (const [id, val] of Object.entries(statsLive)) {
    if (val !== 'MISSING' && val.length > 0) statsOk++;
    else fail(`/: stats bar "${id}" has value`, val === 'MISSING' ? 'Element missing' : 'Empty value');
  }
  if (statsOk === 4) {
    pass(`/: stats bar has 4 live values`);
  }

  // Check VIZ_Fees exists (fees viz on home page)
  const vizFeesHome = await page.evaluate(() => typeof window.VIZ_Fees !== 'undefined');
  if (vizFeesHome) pass('/: VIZ_Fees is defined');
  else fail('/: VIZ_Fees is defined', 'VIZ_Fees not found');

  // Check canvas renders
  const vizCanvas = await page.evaluate(() => !!document.getElementById('viz-fees'));
  if (vizCanvas) pass('/: viz-fees canvas exists');
  else fail('/: viz-fees canvas exists', 'Element not found');

  if (jsErrors.length > 0) {
    fail('/: zero JS errors', jsErrors.join('; '));
  } else {
    pass('/: zero JS errors');
  }

  await ctx.close();
}

async function testBip110Page(browser) {
  console.log('\n[4] Testing /bip110 page...');
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const jsErrors = [];

  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto(`${BASE}/bip110`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check fork viz canvas exists
  const bip110Canvas = await page.evaluate(() => !!document.getElementById('bip110-viz'));
  if (bip110Canvas) {
    pass('/bip110: bip110-viz canvas exists');
  } else {
    fail('/bip110: bip110-viz canvas exists', 'Canvas element not found');
  }

  // Check status grid populated
  const statusGrid = await page.evaluate(() => {
    const el = document.getElementById('status-grid');
    return el ? el.children.length : 0;
  });
  if (statusGrid > 0) {
    pass(`/bip110: status-grid has ${statusGrid} cards`);
  } else {
    fail('/bip110: status-grid populated', statusGrid === 0 ? 'No status cards' : 'Element missing');
  }

  // Check fork timeline exists
  const timeline = await page.evaluate(() => !!document.getElementById('tl-passed'));
  if (timeline) {
    pass('/bip110: fork timeline segments exist');
  } else {
    fail('/bip110: fork timeline segments exist', 'tl-passed not found');
  }

  if (jsErrors.length > 0) {
    fail('/bip110: zero JS errors', jsErrors.join('; '));
  } else {
    pass('/bip110: zero JS errors');
  }

  await ctx.close();
}

async function main() {
  console.log('=== Block Space Economics — Visualization Tests ===\n');

  // 1. Check file existence first
  const filesOk = checkFiles();
  if (!filesOk) {
    console.log('\nRequired files missing. Exiting.');
    process.exit(1);
  }

  // 2. Launch Playwright
  console.log('\nLaunching Playwright (Chromium)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    await testLivePage(browser);
    await testHomePage(browser);
    await testBip110Page(browser);
  } catch (err) {
    console.error('\nFATAL:', err.message);
    RESULTS.fail++;
    RESULTS.errors.push('FATAL: ' + err.message);
  } finally {
    await browser.close();
  }

  // Summary
  const total = RESULTS.pass + RESULTS.fail;
  console.log(`\n=== Results: ${RESULTS.pass}/${total} passed, ${RESULTS.fail} failed ===`);
  if (RESULTS.errors.length > 0) {
    console.log('\nFailure details:');
    for (const e of RESULTS.errors) {
      console.log(`  - ${e}`);
    }
  }

  process.exit(RESULTS.fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Unhandled:', err);
  process.exit(1);
});
