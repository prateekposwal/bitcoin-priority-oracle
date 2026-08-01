var https = require('https');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');
var STATE_FILE = path.resolve(__dirname, '..', '..', 'captured-data', 'sampler-state.json');
var API_DELAY = 2000;
var BLOCKS_PER_DAY_LIMIT = 140;

var state = { lastSampled: 0, totalSampled: 0, epochsComplete: [] };

function loadState() {
  try { if (fs.existsSync(STATE_FILE)) state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
}

function saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch (e) {}
}

function sqlExec(sql) {
  try {
    var tmp = '/tmp/bsahi-hist-' + Date.now() + '.sql';
    fs.writeFileSync(tmp, sql);
    child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
    try { fs.unlinkSync(tmp); } catch (e) {}
    return true;
  } catch (e) { return false; }
}

function sqlQuery(sql) {
  try {
    var tmp = '/tmp/bsahi-hist-q-' + Date.now() + '.sql';
    fs.writeFileSync(tmp, '.mode json\n' + sql);
    var result = child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmp + '"', { encoding: 'utf8', timeout: 10000 });
    try { fs.unlinkSync(tmp); } catch (e) {}
    try { return JSON.parse(result); } catch (e) { return []; }
  } catch (e) { return []; }
}

function fetchJson(url) {
  return new Promise(function(resolve) {
    try {
      var u = new URL(url);
      var opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', timeout: 15000, headers: { 'User-Agent': 'BitcoinSahiHistorical/1.0' } };
      var req = https.request(opts, function(res) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() {
          try { resolve({ ok: res.statusCode < 400, data: JSON.parse(body), status: res.statusCode }); }
          catch (e) { resolve({ ok: false, error: 'Parse error', status: res.statusCode }); }
        });
      });
      req.on('error', function(e) { resolve({ ok: false, error: e.message }); });
      req.on('timeout', function() { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
      req.end();
    } catch (e) { resolve({ ok: false, error: e.message }); }
  });
}

function sleep(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }

var EPOCHS = [
  { name: 'Genesis Era', start: 1, end: 50000, interval: 1000, desc: '2009-2010 — Early days' },
  { name: 'Early Adoption', start: 50000, end: 150000, interval: 1000, desc: '2010-2011 — First exchanges' },
  { name: 'Growth', start: 150000, end: 300000, interval: 1000, desc: '2012-2014 — First halving' },
  { name: 'Expansion', start: 300000, end: 500000, interval: 1000, desc: '2015-2017 — Scaling debate' },
  { name: 'Maturity', start: 500000, end: 700000, interval: 1000, desc: '2018-2021 — Institutional' },
  { name: 'Modern', start: 700000, end: 850000, interval: 500, desc: '2022-2024 — Ordinals, ETFs' },
  { name: 'Current', start: 850000, end: 1000000, interval: 250, desc: '2025-2026 — BIP-110 era' },
];

function getSampleBlocks(epoch) {
  var blocks = [];
  for (var h = epoch.start; h <= epoch.end && h <= 1000000; h += epoch.interval) {
    blocks.push(h);
  }
  return blocks;
}

async function fetchBlockFromBlockchainInfo(height) {
  var result = await fetchJson('https://blockchain.info/block-height/' + height + '?format=json');
  if (result.ok && result.data && result.data.blocks && result.data.blocks.length > 0) {
    var b = result.data.blocks[0];
    return { ok: true, data: { hash: b.hash, height: b.height, timestamp: b.time, tx_count: b.tx ? b.tx.length : 0, size: b.size, weight: b.weight || b.size * 4 } };
  }
  return { ok: false };
}

async function fetchBlockFromMempool(height) {
  var hashResult = await fetchJson('https://mempool.space/api/block-height/' + height);
  if (!hashResult.ok || !hashResult.data) return { ok: false };
  var hash = typeof hashResult.data === 'string' ? hashResult.data : '';
  if (!hash) return { ok: false };
  var blockResult = await fetchJson('https://mempool.space/api/block/' + hash);
  if (blockResult.ok && blockResult.data) return { ok: true, data: blockResult.data };
  return { ok: false };
}

async function fetchBlockHeight(height) {
  // For old blocks (< 500K), use blockchain.info (free, no key needed)
  if (height < 500000) {
    var result = await fetchBlockFromBlockchainInfo(height);
    if (result.ok) return result;
    await sleep(3000);
  }
  // For recent blocks, use mempool.space
  var result = await fetchBlockFromMempool(height);
  return result;
}

function storeBlock(height, data) {
  var b = data || {};
  var hash = b.hash || b.id || '';
  var timestamp = b.time || b.timestamp || 0;
  var txCount = b.tx_count || b.nTx || 0;
  var size = b.size || 0;
  var weight = b.weight || 0;
  var version = b.version || 0;
  var difficulty = b.difficulty || 0;
  var bits = b.bits || '';
  var nonce = b.nonce || 0;
  var mediantime = b.mediantime || b.medianTime || 0;
  var merkle = b.merkle_root || b.merkleroot || '';

  sqlExec("INSERT OR REPLACE INTO block_stats (height, hash, timestamp, tx_count, size, weight) VALUES (" +
    height + ", '" + (hash || '').replace(/'/g, "''") + "', " +
    (timestamp ? "'" + new Date(timestamp * 1000).toISOString() + "'" : "NULL") + ", " +
    (txCount || 0) + ", " + (size || 0) + ", " + (weight || 0) + ")");
}

async function sampleEpoch(epoch) {
  var blocks = getSampleBlocks(epoch);
  var sampled = 0;
  var today = new Date().toISOString().slice(0, 10);

  for (var i = 0; i < blocks.length && sampled < BLOCKS_PER_DAY_LIMIT; i++) {
    var height = blocks[i];
    if (state.lastSampled >= height) continue;

    await sleep(API_DELAY);
    var result = await fetchBlockHeight(height);
    if (result.ok) {
      storeBlock(height, result.data);
      state.lastSampled = height;
      state.totalSampled++;
      sampled++;
      if (sampled % 10 === 0) {
        saveState();
        var date = result.data.time ? new Date(result.data.time * 1000).toISOString().slice(0, 10) : '?';
        console.log('  [' + sampled + '/' + blocks.length + '] Block ' + height + ' (' + date + ') — ' + (result.data.tx_count || result.data.nTx || '?') + ' tx');
      }
    } else {
      console.log('  [SKIP] Block ' + height + ' — API unavailable');
      state.lastSampled = height;
    }
    saveState();
  }

  if (sampled < BLOCKS_PER_DAY_LIMIT && state.lastSampled >= blocks[blocks.length - 1]) {
    state.epochsComplete.push(epoch.name);
    console.log('  ✅ Epoch "' + epoch.name + '" complete (' + state.totalSampled + ' total blocks)');
  }

  return sampled;
}

function generateReport() {
  var data = sqlQuery("SELECT height, timestamp, tx_count, size, weight FROM block_stats WHERE height > 0 ORDER BY height ASC");
  if (!data || data.length === 0) return;

  var lines = [];
  lines.push('# Bitcoin Historical Block Analysis');
  lines.push('Generated: ' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push('| Total blocks sampled | ' + data.length + ' |');
  lines.push('| Date range | ' + (data[0].timestamp || '?') + ' → ' + (data[data.length - 1].timestamp || '?') + ' |');
  lines.push('| Height range | ' + data[0].height + ' → ' + data[data.length - 1].height + ' |');
  lines.push('');

  var totalTx = 0;
  for (var i = 0; i < data.length; i++) totalTx += data[i].tx_count || 0;

  lines.push('## Historical Trends');
  lines.push('');
  lines.push('| Decade | Blocks | Avg Tx/Block | Avg Size | Avg Weight |');
  lines.push('|--------|--------|-------------|----------|------------|');
  var decades = {};
  for (var i = 0; i < data.length; i++) {
    var ts = data[i].timestamp;
    var year = ts ? ts.slice(0, 4) : '?';
    if (!decades[year]) decades[year] = { count: 0, txs: 0, size: 0, weight: 0 };
    decades[year].count++;
    decades[year].txs += data[i].tx_count || 0;
    decades[year].size += data[i].size || 0;
    decades[year].weight += data[i].weight || 0;
  }
  var years = Object.keys(decades).sort();
  for (var i = 0; i < years.length; i++) {
    var y = decades[years[i]];
    lines.push('| ' + years[i] + 's | ' + y.count + ' | ' + Math.round(y.txs / y.count) + ' | ' + Math.round(y.size / y.count / 1000) + ' KB | ' + Math.round(y.weight / y.count / 1000) + ' KWU |');
  }
  lines.push('');

  lines.push('## Notable Blocks');
  lines.push('');
  lines.push('| Height | Date | Tx Count | Size | Notes |');
  lines.push('|--------|------|----------|------|-------|');
  var notable = data.filter(function(d) {
    return (d.tx_count || 0) > 3000 || (d.size || 0) > 1500000;
  });
  for (var i = 0; i < Math.min(notable.length, 20); i++) {
    var d = notable[i];
    var date = d.timestamp ? d.timestamp.slice(0, 10) : '?';
    lines.push('| ' + d.height + ' | ' + date + ' | ' + (d.tx_count || 0) + ' | ' + Math.round((d.size || 0) / 1000) + ' KB | Large block |');
  }
  lines.push('');
  lines.push('---');
  lines.push('*Bitcoin Sahi — Historical Block Sampler*');

  var reportDir = path.resolve(__dirname, '..', '..', 'reports', 'research');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  var dateStr = new Date().toISOString().slice(0, 10);
  var filePath = path.join(reportDir, 'historical-' + dateStr + '.md');
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('\n📄 Report saved: ' + filePath);
}

async function run() {
  loadState();
  console.log('═══ Historical Block Sampler ═══');
  console.log('Already sampled: ' + state.totalSampled + ' blocks');
  console.log('');

  for (var e = 0; e < EPOCHS.length; e++) {
    var epoch = EPOCHS[e];
    if (state.epochsComplete.indexOf(epoch.name) > -1) {
      console.log('⏭  Skipping "' + epoch.name + '" — already complete');
      continue;
    }
    console.log('📋 Sampling "' + epoch.name + '" — ' + epoch.desc);
    var count = await sampleEpoch(epoch);
    console.log('   Sampled ' + count + ' blocks today from this epoch');
    if (count < BLOCKS_PER_DAY_LIMIT) {
      console.log('   (rate limited — will continue next run)');
      break;
    }
  }

  console.log('\n═══ Done ═══');
  console.log('Total blocks collected: ' + state.totalSampled);
  saveState();
  generateReport();
}

if (require.main === module) { run().catch(function(e) { console.log('Error:', e.message); }); }
module.exports = { run: run, generateReport: generateReport, EPOCHS: EPOCHS };
