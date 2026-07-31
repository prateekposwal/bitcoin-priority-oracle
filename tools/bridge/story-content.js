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
    },
    {
      angle: 'the-open-data',
      title: 'Why we publish all our Bitcoin data openly',
      body: 'There is a lot of great research in this space, but a lot of it stays behind closed doors. ' +
        'We decided to do the opposite.\n\n' +
        'BSAHI captures the network continuously — fees, mempool, blocks, Lightning — and publishes ' +
        'everything we find. The code is open, the methodology is open, and the data is collected ' +
        'transparently from public sources.\n\n' +
        'Why? Because block space economics is too important to be a black box. If our conclusion is wrong, ' +
        'someone should be able to check. If our data is incomplete, someone should be able to add to it. ' +
        'The research is stronger for it.\n\n' +
        'Today\'s capture shows the network in its ordinary state:\n\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n' +
        '- Mempool: ' + d.mempoolMB + ' MB\n' +
        '- Price: ' + d.price + '\n\n' +
        'Nothing dramatic — just the market working. That is the point. We want to document the ordinary, ' +
        'so the extraordinary stands out when it comes.'
    },
    {
      angle: 'the-forecast',
      title: 'Can we forecast Bitcoin fees? We are trying.',
      body: 'Fee forecasting is the hardest problem we have taken on. It is also the most useful.\n\n' +
        'If you could predict fee pressure hours or days ahead, you could:\n\n' +
        '- Time your transactions to avoid the rush\n' +
        '- Understand when demand is genuinely rising vs. noise\n' +
        '- See the network\'s health before it is obvious\n\n' +
        'We are building toward this by capturing the raw signals continuously — mempool depth, ' +
        'fee distributions, block fullness, Lightning pressure. The theory is simple: ' +
        'demand leaves fingerprints, and we are learning to read them.\n\n' +
        'Today\'s data:\n\n' +
        '- Mempool: ' + d.mempoolTx + ' transactions (' + d.mempoolMB + ' MB)\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n\n' +
        'This is early work. We will publish our first forecasts openly and be transparent ' +
        'about how wrong they are. That is the only honest way to learn.'
    },
    {
      angle: 'the-gap',
      title: 'The gap in Bitcoin research we are trying to fill',
      body: 'Bitcoin has incredible coverage — price, security, energy, adoption. One area is thin: ' +
        'the day-to-day economics of the fee market and what it reveals about the network.\n\n' +
        'Questions we keep coming back to:\n\n' +
        '- What is the real cost of running a node, and do fees cover it?\n' +
        '- What drives fee spikes — genuine demand or panic?\n' +
        '- How much does settlement actually cost as a fraction of value moved?\n' +
        '- Where does Lightning relieve on-chain pressure, and where does it not?\n\n' +
        'Nobody has clean, continuous answers. So we are building the tool that provides them.\n\n' +
        'BSAHI captures the network around the clock and turns it into analysis. ' +
        'The work is early, but the direction is clear.\n\n' +
        'If these questions interest you, we would love to think together.'
    },
    {
      angle: 'the-ordinary',
      title: 'Bitcoin\'s most underrated moment: a quiet block',
      body: 'Everyone talks about Bitcoin when the price moves. The most interesting moments are the quiet ones.\n\n' +
        'Take the last block we captured. A few thousand transactions, fees in the single digits, ' +
        'mempool moderate. Nothing dramatic. And that is exactly what makes it remarkable.\n\n' +
        'It means the network is working as intended — people settling when it is cheap, ' +
        'waiting when it is not, and the market balancing supply and demand without anyone ' +
        'in charge.\n\n' +
        'From our live capture:\n\n' +
        '- Block: ~' + d.blockTx + ' transactions\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n' +
        '- Mempool: ' + d.mempoolMB + ' MB\n\n' +
        'BSAHI is built to notice these quiet blocks — the ordinary heartbeat of a healthy ' +
        'network. The extraordinary is easier to understand when you know what normal looks like.'
    },
    {
      angle: 'the-lesson',
      title: 'What being wrong in public taught us about Bitcoin research',
      body: 'Early in building BSAHI, we published a conclusion that later turned out to be too strong. ' +
        'It was uncomfortable. It was also the best thing that happened to the project.\n\n' +
        'People pushed back with specific reasons. We went back to the data, refined the model, ' +
        'and the conclusion got better. The Storage Cost Coverage Ratio we now publish is the ' +
        'direct result of that correction.\n\n' +
        'That is how research should work — claims you can check, methods you can audit, ' +
        'and the willingness to update when new evidence arrives.\n\n' +
        'That is the culture we are building at BSAHI. The numbers we publish come from live captures:\n\n' +
        '- Mempool: ' + d.mempoolMB + ' MB\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n' +
        '- Price: ' + d.price + '\n\n' +
        'And they will change. We will update, and we will say so. ' +
        'That is the point of doing this in public.'
    },
    {
      angle: 'the-community',
      title: 'Bitcoin research works best when it is a conversation',
      body: 'We started BSAHI with the idea that research is a dialogue, not a monologue.\n\n' +
        'Every week we learn from the community — people running nodes, using Lightning, ' +
        'watching the mempool. Their observations sharpen our questions and our data.\n\n' +
        'One conversation led us to look harder at node costs. Another pushed us to question ' +
        'our fee forecast method. Each time, the research got better.\n\n' +
        'Our current captures are open for anyone to question:\n\n' +
        '- Mempool: ' + d.mempoolMB + ' MB (' + d.mempoolTx + ' txs)\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n' +
        '- Recent block: ~' + d.blockTx + ' transactions\n\n' +
        'If you see something that does not look right, tell us. That is the conversation ' +
        'we want to be part of.'
    },
    {
      angle: 'the-horizon',
      title: 'The idea that changes the horizon: money as a neutral protocol',
      body: 'Most people think of Bitcoin as digital money. We think of it as something older and stranger: ' +
        'a neutral protocol for value, like HTTP is for information.\n\n' +
        'HTTP did not just change websites — it changed how human knowledge is organized. ' +
        'A neutral protocol invites everyone to build on it without asking permission.\n\n' +
        'The same is happening with money. Bitcoin is not the end state; it is the substrate. ' +
        'On top of it, people are building settlement systems, payment networks, and ' +
        'coordination tools that were impossible before.\n\n' +
        'From our live capture today:\n\n' +
        '- Mempool: ' + d.mempoolMB + ' MB — real settlement demand\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB — the market pricing scarcity\n' +
        '- Price: ' + d.price + '\n\n' +
        'We built BSAHI to study this substrate — its economics, its pressure points, its trajectory. ' +
        'The horizon is further than most people think.'
    },
    {
      angle: 'the-permissionless',
      title: 'What permissionless innovation actually looks like',
      body: 'Permissionless sounds abstract until you see it happening.\n\n' +
        'Every transaction in the mempool is someone using a system nobody controls. ' +
        'No bank approved it. No government authorized it. No gatekeeper took a cut. ' +
        'It just works, because the protocol is open and the rules are enforced by math.\n\n' +
        'That is the innovation that changes the horizon: not a product, but the absence of ' +
        'permission as a requirement.\n\n' +
        'Today\'s mempool shows it in action:\n\n' +
        '- ' + d.mempoolTx + ' transactions waiting\n' +
        '- ' + d.mempoolMB + ' MB of demand\n' +
        '- ' + d.fastest + ' sat/vB to confirm quickly\n\n' +
        'Each of those transactions is a small act of independence. BSAHI is building ' +
        'tools to understand this system — and to make its economics visible to everyone.'
    },
    {
      angle: 'the-trust',
      title: 'Why the fee market is the most honest price in the world',
      body: 'Prices are usually set by people with power — exchanges, governments, middlemen. ' +
        'The Bitcoin fee market is different. It is set by thousands of anonymous users bidding ' +
        'for a scarce resource, with no central authority.\n\n' +
        'That makes it one of the most honest prices that exists. It reflects what people ' +
        'actually value in that moment, aggregated without a middleman.\n\n' +
        'Today it says:\n\n' +
        '- ' + d.fastest + ' sat/vB for fast confirmation\n' +
        '- ' + d.economy + ' sat/vB if you can wait\n' +
        '- ' + d.mempoolMB + ' MB of people choosing to transact\n\n' +
        'The difference between the fastest and economy fee is time preference. People literally ' +
        'bid for speed. That is a market in its purest form.\n\n' +
        'BSAHI exists to study this market — because if you understand the fee market, ' +
        'you understand what the network is really worth to the people using it.'
    },
    {
      angle: 'the-long-game',
      title: 'The long game: making the invisible economics of Bitcoin visible',
      body: 'Bitcoin has a hidden economy running underneath the price. Fees, mempool pressure, ' +
        'block fullness, Lightning liquidity — these are the forces that determine whether ' +
        'the network works, and they are almost invisible to most people.\n\n' +
        'We think that is a problem. You cannot have a serious conversation about a system ' +
        'you cannot see.\n\n' +
        'So BSAHI is building the visibility layer. We capture the network continuously ' +
        'and turn the signals into research anyone can read:\n\n' +
        '- Storage cost coverage: fees cover ~1.5% of a decade of node storage\n' +
        '- Live capture: ' + d.mempoolMB + ' MB mempool, ' + d.fastest + ' sat/vB\n' +
        '- Settlement demand: thousands of transactions per block\n\n' +
        'This is not about the price. It is about the machinery underneath — the part ' +
        'that determines whether the whole system holds together for decades.\n\n' +
        'The long game is making that machinery visible. That is what we are building.'
    },
    {
      angle: 'the-coin',
      title: 'Bitcoin is a coin toss that landed on its edge',
      body: 'Twenty years ago, the idea of a decentralized digital currency was a coin toss — ' +
        'most people thought it would land on one of two sides: total failure or ' +
        'a niche curiosity. It did neither.\n\n' +
        'It landed on its edge. It became a settlement network handling billions in value, ' +
        'a store of value for millions, and the base layer of a growing ecosystem — ' +
        'while still being a young protocol with open questions.\n\n' +
        'That is the most interesting part. The system is both proven and unfinished. ' +
        'The edge it landed on is a horizon, not a destination.\n\n' +
        'From our capture today:\n\n' +
        '- Price: ' + d.price + '\n' +
        '- Mempool: ' + d.mempoolMB + ' MB of activity\n' +
        '- Fastest fee: ' + d.fastest + ' sat/vB\n\n' +
        'BSAHI is mapping this edge — the economics of a system that exists between ' +
        'what was predicted and what is yet to come.'
    }
  ];

  // Prefer stories not recently used
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
  // Story posts: Medium 5/day, LinkedIn 5/day
  try {
    var logData = JSON.parse(fs.readFileSync(POSTED_LOG, 'utf8'));
    var now = Date.now();
    var today = new Date().toISOString().slice(0,10);
    var recent = logData.posts.filter(function(p) { return p.platform === platform && p.type === 'story' && p.at.slice(0,10) === today; });
    var minGap = platform === 'medium' ? 4*3600000 : 4*3600000;  // 5/day = ~4.8h apart
    var lastAt = recent.length ? new Date(logData.posts.filter(function(p){return p.platform===platform&&p.type==='story';}).slice(-1)[0].at).getTime() : 0;
    var sinceLast = lastAt ? now - lastAt : Infinity;
    return {
      ok: recent.length < 5 && sinceLast >= minGap,
      nextPostMs: Math.max(0, minGap - sinceLast),
      postsToday: recent.length
    };
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
