var fs = require('fs');
var path = require('path');

// BSAHI — Compliant Content Generator
// Produces substantive, platform-native Bitcoin analysis from REAL captured data.
// Every post is genuine research — not links or promotional spam.

var BACKFILL_DIR = path.resolve(__dirname, '..', '..', 'captured-data', 'backfill');
var POSTED_LOG = path.resolve(__dirname, '..', '..', 'captured-data', 'compliant-posts.json');

function log(msg) { console.log('[' + new Date().toISOString().slice(11,19) + '] [Content] ' + msg); }

function getLatestCapture() {
  var dirs = fs.readdirSync(BACKFILL_DIR).filter(function(d) { return d.startsWith('2026'); }).sort();
  if (!dirs.length) return null;
  var dayDir = path.join(BACKFILL_DIR, dirs[dirs.length - 1]);
  var files = fs.readdirSync(dayDir).filter(function(f) { return f.endsWith('.json'); }).sort();
  if (!files.length) return null;
  return JSON.parse(fs.readFileSync(path.join(dayDir, files[files.length - 1]), 'utf8'));
}

function getMempoolSummary(mempool) {
  if (!mempool) return null;
  // mempool.space format: { count, vsize, total_fee, fee_histogram }
  if (typeof mempool === 'object' && !Array.isArray(mempool) && mempool.count != null) {
    return {
      totalVsize: mempool.vsize || 0,
      txCount: mempool.count || 0
    };
  }
  // array of {w, n} entries (older format)
  if (Array.isArray(mempool)) {
    var sizes = [];
    var counts = [];
    mempool.forEach(function(item) {
      if (item && item.w) sizes.push(item.w);
      if (item && item.n) counts.push(item.n);
    });
    return {
      totalVsize: sizes.reduce(function(a,b) { return a+b; }, 0),
      txCount: counts.reduce(function(a,b) { return a+b; }, 0)
    };
  }
  return null;
}

function loadPostedLog() {
  try { return JSON.parse(fs.readFileSync(POSTED_LOG, 'utf8')); } catch(e) { return { posts: [] }; }
}

function savePostedLog(d) { fs.writeFileSync(POSTED_LOG, JSON.stringify(d, null, 2)); }

function generateAnalysis(capture) {
  var fees = capture.endpoints.fees.data || {};
  var price = capture.endpoints.btc_price.data || {};
  var mempool = getMempoolSummary(capture.endpoints.mempool.data);
  var lightning = capture.endpoints.lightning.data || {};
  var blocks = capture.endpoints.blocks.data || [];
  var blockHeight = capture.endpoints.block_height ? capture.endpoints.block_height.data : null;

  var fastest = fees.fastestFee != null ? fees.fastestFee : '?';
  var economy = fees.economyFee != null ? fees.economyFee : '?';
  var priceUsd = price.USD ? '$' + Number(price.USD).toLocaleString() : '?';

  // Mempool analysis
  var mempoolMB = mempool ? (mempool.totalVsize / 1e6).toFixed(1) : '?';
  var mempoolTx = mempool ? mempool.txCount : '?';

  // Block analysis - fee percentiles or tx counts
  var blockTx = 0;
  var blockFeeMed = null;
  if (blocks && blocks.length) {
    blockTx = blocks[0].tx_count || blocks[0].tx || 0;
    if (blocks[0].fee_percentiles) blockFeeMed = blocks[0].fee_percentiles[2];
  }

  var lnCapacity = lightning.capacity ? (lightning.capacity / 1e8).toFixed(0) : null;

  return {
    fees: fees,
    priceUsd: priceUsd,
    mempoolMB: mempoolMB,
    mempoolTx: mempoolTx,
    blockTx: blockTx,
    blockFeeMed: blockFeeMed,
    lnCapacity: lnCapacity,
    blockHeight: blockHeight,
    capturedAt: capture.captureTime
  };
}

// ─── Platform-native content templates ───

function redditPost(a) {
  var title = '';
  var body = '';

  // Engagement feedback: weight angle pick by topic signal (fees/mempool/lightning/blocks)
  var signal = null;
  try {
    signal = require('./feedback.js').getSignal();
  } catch (e) {}
  var angleMap = { 0: 'fees', 1: 'mempool', 2: 'lightning', 3: 'blocks' };
  var angle;
  if (signal && signal.weights) {
    var options = Object.keys(angleMap).map(Number);
    var weights = {};
    options.forEach(function(k) {
      var topic = angleMap[k];
      var w = signal.weights[topic];
      if (signal.rotating_out && signal.rotating_out.indexOf(topic) !== -1) w = 0;
      if (typeof w !== 'number' || w <= 0) w = 0.15;
      weights[k] = w;
    });
    var total = options.reduce(function(s, k) { return s + weights[k]; }, 0);
    var r = Math.random() * total;
    angle = options[0];
    for (var i = 0; i < options.length; i++) {
      r -= weights[options[i]];
      if (r <= 0) { angle = options[i]; break; }
    }
  } else {
    angle = Math.floor(Math.random() * 4);
  }
  if (angle === 0) {
    title = 'Current state of the Bitcoin fee market (live data)';
    body = 'Looking at live network data right now:\n\n' +
      '- Fastest fee: ' + a.fees.fastestFee + ' sat/vB\n' +
      '- Economy fee: ' + a.fees.economyFee + ' sat/vB\n' +
      '- Mempool backlog: ' + a.mempoolMB + ' MB (' + a.mempoolTx + ' txs waiting)\n' +
      '- Block height: ' + a.blockHeight + '\n\n' +
      'The interesting part is what this tells us about demand. At ' + a.priceUsd + ', ' +
      'full blocks mean people are actively choosing to settle on-chain despite the fees. ' +
      'The fee market is working as intended — scarcity is priced, and the network prioritizes ' +
      'the transactions people value most.\n\n' +
      'What are you seeing in your node? Do the fee levels match your expectations?';
  } else if (angle === 1) {
    title = 'Why ' + a.mempoolMB + ' MB in the mempool is actually healthy';
    body = 'People often panic when they see a mempool backlog, but let us look at the numbers:\n\n' +
      '- Mempool: ' + a.mempoolMB + ' MB waiting\n' +
      '- ' + a.mempoolTx + ' transactions in queue\n' +
      '- Current fastest fee: ' + a.fees.fastestFee + ' sat/vB\n\n' +
      'A non-empty mempool means there is genuine settlement demand. Blocks clear ' +
      'in roughly 10 minutes, and the backlog represents people willing to wait ' +
      'or bid for confirmation. This is how a decentralized network prices scarcity — ' +
      'no central authority, just users and miners responding to market signals.\n\n' +
      'When the backlog clears quickly, fees drop (economy is ' + a.fees.economyFee + ' sat/vB now). ' +
      'That is elasticity, not fragility.';
  } else if (angle === 2) {
    title = 'Lightning vs on-chain: a real usage snapshot';
    body = 'The two layers are complementary, and the live numbers show it:\n\n' +
      '- On-chain blocks processing ~' + a.blockTx + ' txs each\n' +
      '- Lightning capacity: ' + (a.lnCapacity ? a.lnCapacity + ' BTC' : 'tracked') + '\n' +
      '- On-chain economy fee: ' + a.fees.economyFee + ' sat/vB\n\n' +
      'Settlement happens on-chain at higher fees; day-to-day spending routes ' +
      'through Lightning at near-zero cost. The data confirms the design: ' +
      'the base layer settles finality, the second layer handles volume.\n\n' +
      'Anyone else tracking both layers? Curious how the numbers compare to yours.';
  } else {
    title = 'Blocks are full — here is what the data says';
    body = 'Full blocks are by design, not a bug. Live data:\n\n' +
      '- Recent block: ~' + a.blockTx + ' transactions\n' +
      '- Median fee in block: ' + (a.blockFeeMed ? a.blockFeeMed + ' sat/vB' : 'variable') + '\n' +
      '- Mempool pressure: ' + a.mempoolMB + ' MB\n\n' +
      'The 1 MB block limit (and later SegWit effective size) creates a fixed supply ' +
      'of block space. Demand fluctuates; the fee market absorbs the difference. ' +
      'When demand is high, fees rise and users prioritize. When it drops, ' +
      'fees fall and the backlog clears.\n\n' +
      'This is the economics of a scarce settlement layer. Would love to hear how ' +
      'people are thinking about it.';
  }

  return { title: title, body: body };
}

function linkedinPost(a) {
  var body = 'Bitcoin network snapshot — live data from our monitoring:\n\n' +
    '• Price: ' + a.priceUsd + '\n' +
    '• Block height: ' + a.blockHeight + '\n' +
    '• Fastest fee: ' + a.fees.fastestFee + ' sat/vB\n' +
    '• Mempool: ' + a.mempoolMB + ' MB (' + a.mempoolTx + ' transactions)\n\n' +
    'What stands out: full blocks with moderate fees mean genuine settlement demand ' +
    'at current prices. The fee market continues to function as the coordination ' +
    'mechanism it was designed to be.\n\n' +
    'We track these metrics continuously as part of our block space research. ' +
    'Happy to share methodology with anyone working on similar questions.';
  return { body: body };
}

function mediumPost(a) {
  return {
    title: 'Bitcoin Network State: ' + new Date(a.capturedAt).toISOString().slice(0,10),
    body: '## Live network metrics\n\n' +
      '| Metric | Value |\n' +
      '|--------|-------|\n' +
      '| Price | ' + a.priceUsd + ' |\n' +
      '| Block height | ' + a.blockHeight + ' |\n' +
      '| Fastest fee | ' + a.fees.fastestFee + ' sat/vB |\n' +
      '| Economy fee | ' + a.fees.economyFee + ' sat/vB |\n' +
      '| Mempool | ' + a.mempoolMB + ' MB (' + a.mempoolTx + ' txs) |\n\n' +
      '## Interpretation\n\n' +
      'This snapshot illustrates how Bitcoin\'s fee market prices scarcity. ' +
      'Full blocks with ' + a.mempoolMB + ' MB of backlog indicate real settlement demand. ' +
      'The two-tier structure — on-chain finality plus Lightning for volume — ' +
      'continues to function as designed.\n\n' +
      'We publish continuous measurements as part of our open research into ' +
      'block space economics.'
  };
}

function generateFor(platform) {
  var capture = getLatestCapture();
  if (!capture) return null;
  var a = generateAnalysis(capture);
  var post = null;
  if (platform === 'reddit') post = redditPost(a);
  else if (platform === 'linkedin') post = linkedinPost(a);
  else if (platform === 'medium') post = mediumPost(a);
  if (post) post.capturedAt = capture.captureTime;
  return post;
}

// ─── Cadence management — anti-spam ───

var CADENCE = {
  reddit: { minHours: 6, maxPerDay: 2 },
  linkedin: { minHours: 12, maxPerDay: 1 },
  medium: { minHours: 24, maxPerDay: 1 }
};

function canPost(platform) {
  var logData = loadPostedLog();
  var now = Date.now();
  var recent = logData.posts.filter(function(p) { return p.platform === platform; });
  var sinceLast = recent.length ? now - new Date(recent[recent.length-1].at).getTime() : Infinity;
  var today = recent.filter(function(p) {
    return new Date(p.at).toISOString().slice(0,10) === new Date().toISOString().slice(0,10);
  });
  var cadence = CADENCE[platform] || { minHours: 24, maxPerDay: 1 };
  var ok = sinceLast >= cadence.minHours * 3600000 && today.length < cadence.maxPerDay;
  return {
    ok: ok,
    nextPostMs: Math.max(0, cadence.minHours * 3600000 - sinceLast),
    postsToday: today.length
  };
}

function recordPost(platform, url) {
  var logData = loadPostedLog();
  logData.posts.push({ platform: platform, url: url, at: new Date().toISOString() });
  savePostedLog(logData);
}

if (require.main === module) {
  var platform = process.argv[2] || 'reddit';
  var post = generateFor(platform);
  if (post) console.log(JSON.stringify(post, null, 2));
  else console.log('No data available');
}

module.exports = { generateFor: generateFor, canPost: canPost, recordPost: recordPost };
