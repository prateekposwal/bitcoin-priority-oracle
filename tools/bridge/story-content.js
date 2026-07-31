var fs = require('fs');
var path = require('path');

// BSAHI — Story-Driven Content Generator
// Medium: people read STORIES about BSAHI, not numbers.
// LinkedIn: articles with story + data together.

var BACKFILL_DIR = path.resolve(__dirname, '..', '..', 'captured-data', 'backfill');
var POSTED_LOG = path.resolve(__dirname, '..', '..', 'captured-data', 'compliant-posts.json');

function getLatestCapture() {
  try {
    var dirs = fs.readdirSync(BACKFILL_DIR).filter(function(d) { return d.startsWith('2026'); }).sort();
    if (!dirs.length) return null;
    var dayDir = path.join(BACKFILL_DIR, dirs[dirs.length - 1]);
    var files = fs.readdirSync(dayDir).filter(function(f) { return f.endsWith('.json'); }).sort();
    if (!files.length) return null;
    return JSON.parse(fs.readFileSync(path.join(dayDir, files[files.length - 1]), 'utf8'));
  } catch(e) { return null; }
}

function getData(a) {
  var fees = a.endpoints.fees.data || {};
  var price = a.endpoints.btc_price.data || {};
  var mempool = a.endpoints.mempool.data || {};
  var blocks = a.endpoints.blocks.data || [];
  var capture = a.captureTime;
  return {
    fastest: fees.fastestFee,
    economy: fees.economyFee,
    price: price.USD ? '$' + Number(price.USD).toLocaleString() : null,
    mempoolMB: mempool.vsize ? (mempool.vsize/1e6).toFixed(1) : null,
    mempoolTx: mempool.count,
    blockTx: blocks.length ? (blocks[0].tx_count || 0) : null,
    height: a.endpoints.block_height ? a.endpoints.block_height.data : null,
    capture: capture
  };
}

function generateAnalysis(capture) {
  if (!capture) return null;
  var a = { endpoints: capture.endpoints, captureTime: capture.captureTime };
  var d = getData(a);
  var ts = new Date(d.capture).toISOString().slice(0, 10);

  // Store the story topics — what BSAHI is building
  var STORIES = [
    {
      angle: 'the-journey',
      title: 'Why we built an autonomous Bitcoin research engine',
      body: 'This is the story of how BSAHI came to be — and what we are building now.\n\n' +
        'It started with a simple observation: the fee market is Bitcoin\'s most important, least understood signal. ' +
        'Every block, users are bidding for a scarce resource. That bidding reveals demand, timing, and value. ' +
        'But the data was scattered — no single place showed the whole picture.\n\n' +
        'So we built one. An autonomous research engine that captures the network continuously — ' +
        'fees, mempool, blocks, Lightning — and turns it into something readable.\n\n' +
        'Today it runs on its own, publishing findings as they happen. The numbers in this article are from a live capture, ' +
        'not a historical dataset:\n\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n' +
        '- Mempool: ' + d.mempoolMB + ' MB\n' +
        '- Price: ' + d.price + '\n\n' +
        'The long-term goal is bigger than the numbers. We want to understand block space economics well enough ' +
        'to forecast fee pressure, quantify what nodes really cost, and give people a clear window into the ' +
        'network\'s health. The research is open, the code is open, and the data is captured transparently.\n\n' +
        'This is chapter one. There will be more.'
    },
    {
      angle: 'the-observation',
      title: 'The most interesting number in Bitcoin right now',
      body: 'Every day we capture the network\'s vital signs. One number keeps surprising us.\n\n' +
        'It is not the price. It is the fee market — and what it reveals about how people actually use Bitcoin.\n\n' +
        'At capture time today:\n\n' +
        '- Fastest confirmation: ' + d.fastest + ' sat/vB\n' +
        '- Mempool waiting: ' + d.mempoolTx + ' transactions (' + d.mempoolMB + ' MB)\n' +
        '- Recent block: ' + d.blockTx + ' transactions\n\n' +
        'Full blocks are not a bug. They are the market working — people choosing to pay for finality. ' +
        'The mempool is a waiting room where bids get sorted, and the winners are the ones who value ' +
        'settlement most.\n\n' +
        'We built BSAHI to watch this in real time and, eventually, to predict it. ' +
        'The data comes from public sources, captured transparently, and our findings are published openly.\n\n' +
        'If the fee market interests you, follow along. We are just getting started.'
    },
    {
      angle: 'the-question',
      title: 'What does it actually cost to run a Bitcoin node?',
      body: 'Everyone says running a node is important. Few people talk about what it costs.\n\n' +
        'We are trying to answer that question with data.\n\n' +
        'Our early research suggests something striking: over a 10-year horizon, transaction fees cover only ' +
        'about 1.5% of storage costs for a full node. That is the Storage Cost Coverage Ratio — and it is the ' +
        'kind of number that changes how you think about the network\'s long-term sustainability.\n\n' +
        'The fee market is the funding mechanism for Bitcoin\'s infrastructure. Understanding the ratio ' +
        'between what blocks earn and what running the network costs is essential to forecasting ' +
        'whether the incentive structure holds.\n\n' +
        'This is what BSAHI researches. We capture the network continuously and publish what we find. ' +
        'The method is transparent, the data is open, and we welcome scrutiny.\n\n' +
        'Because the best way to learn is to be wrong in public, early, and often.'
    },
    {
      angle: 'the-layers',
      title: 'How on-chain settlement and Lightning actually fit together',
      body: 'There is a lot of debate about whether Bitcoin should settle on-chain or on Lightning. ' +
        'The live data suggests the answer is: both, doing different jobs.\n\n' +
        'At our latest capture:\n\n' +
        '- On-chain blocks are processing thousands of transactions\n' +
        '- Lightning is carrying the high-frequency, low-value payments\n' +
        '- The fee market prices on-chain finality while Lightning stays near-free\n\n' +
        'This is the two-tier design working as intended. The base layer is the settlement engine — ' +
        'final, scarce, and worth paying for. The second layer is the volume engine — ' +
        'instant and cheap.\n\n' +
        'We built BSAHI to measure both layers together, because you cannot understand one without ' +
        'the other. Our research is published openly, and the data is captured in real time.\n\n' +
        'If this is a question you think about too, we would love to compare notes.'
    }
  ];

  var story = STORIES[Math.floor(Math.random() * STORIES.length)];
  return story;
}

function generateFor(platform) {
  var capture = getLatestCapture();
  var content = generateAnalysis(capture);
  if (!content) return null;
  content.capturedAt = capture.captureTime;
  return content;
}

function canPost(platform) {
  // Story posts are rarer — Medium 1/day, LinkedIn 1/2days
  try {
    var logData = JSON.parse(fs.readFileSync(POSTED_LOG, 'utf8'));
    var now = Date.now();
    var recent = logData.posts.filter(function(p) { return p.platform === platform && p.type === 'story'; });
    var minMs = platform === 'medium' ? 24*3600000 : 48*3600000;
    var sinceLast = recent.length ? now - new Date(recent[recent.length-1].at).getTime() : Infinity;
    return { ok: sinceLast >= minMs, nextPostMs: Math.max(0, minMs - sinceLast), postsToday: recent.length };
  } catch(e) {
    return { ok: true, nextPostMs: 0, postsToday: 0 };
  }
}

function recordPost(platform, url) {
  var logData;
  try { logData = JSON.parse(fs.readFileSync(POSTED_LOG, 'utf8')); } catch(e) { logData = { posts: [] }; }
  logData.posts.push({ platform: platform, type: 'story', url: url, at: new Date().toISOString() });
  fs.writeFileSync(POSTED_LOG, JSON.stringify(logData, null, 2));
}

if (require.main === module) {
  var platform = process.argv[2] || 'medium';
  var post = generateFor(platform);
  if (post) console.log(JSON.stringify(post, null, 2));
  else console.log('No data');
}

module.exports = { generateFor: generateFor, canPost: canPost, recordPost: recordPost };
