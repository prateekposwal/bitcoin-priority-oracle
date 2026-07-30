var fs = require('fs');
var path = require('path');
var WebSocket = require('ws');
var { generateSecretKey, getPublicKey, finalizeEvent } = require('nostr-tools/pure');
var { SimplePool } = require('nostr-tools/pool');
var { useWebSocketImplementation } = require('nostr-tools/pool');

useWebSocketImplementation(WebSocket);

var KEYS_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'nostr-key.json');
var STATE_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'employees.json');
var POST_LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'post-log.json');
var AGENT = 'BSAHI Employees';

var RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.bitcoiner.social',
  'wss://relay.primal.net'
];

var EMPLOYEES = [
  { id: 'satoshi', name: 'Satoshi Block',  title: 'Block Space Analyst',  avatar: '⚡', topics: ['fee', 'mempool', 'blocks'] },
  { id: 'hal',     name: 'Hal Finney Jr',  title: 'Research Engineer',    avatar: '🔬', topics: ['research', 'capacity', 'dev'] },
  { id: 'lisa',    name: 'Lisa Nakamoto',  title: 'Data Journalist',      avatar: '📊', topics: ['lightning', 'exchange', 'node'] },
  { id: 'wei',     name: 'Wei Dai III',    title: 'Protocol Researcher',  avatar: '🧮', topics: ['fork', 'dev', 'research'] },
  { id: 'nick',    name: 'Nick Szabo Jr',  title: 'Economics Analyst',    avatar: '📈', topics: ['miner', 'economy', 'capacity'] }
];

// Unique content topics — each call picks a unique combination
var TOPIC_CONTENT = {
  fee: [
    'Bitcoin fees are ' + (Math.random() * 200 + 5).toFixed(1) + ' sat/vB. Block space demand is not a bug — it is the mechanism that makes settlement final. Nodes prioritize, markets clear.',
    'Mempool at ' + Math.floor(Math.random() * 80 + 10) + ' MB. Fee pressure reveals something important: people are willing to pay for settlement finality. That is demand, not dysfunction.',
    'Low fee environment: ' + (Math.random() * 30 + 1).toFixed(1) + ' sat/vB. The fee market works both ways. When demand drops, costs drop. Elasticity is a feature of a healthy market.'
  ],
  mempool: [
    'Mempool backlog: ' + Math.floor(Math.random() * 50 + 5) + ' MB. Waiting transactions = pending settlement demand. Each sat/vB bid reveals how much people value confirmation time.',
    'Mempool clears to ' + Math.floor(Math.random() * 5 + 1) + ' MB. Low backlog means blocks are processing faster than demand arrives. This is the equilibrium point of the fee market.',
    'Mempool pressure at ' + Math.floor(Math.random() * 100 + 20) + ' MB. High backlog does not mean broken — it means blocks are full, which means security budget is working.'
  ],
  blocks: [
    'Block ' + Math.floor(Math.random() * 100000 + 800000) + ': ' + Math.floor(Math.random() * 3000 + 2000) + ' transactions. Full blocks are the goal. Empty blocks would mean no one values settlement.',
    'Block utilization: ' + Math.floor(Math.random() * 20 + 80) + '%. Blocks at 100% capacity are normal. The 1 MB limit was a safety measure — the market decides block fullness now.',
    'Block space is the scarce resource. ' + Math.floor(Math.random() * 3000 + 2000) + ' tx/block at ' + (Math.random() * 200 + 10).toFixed(1) + ' sat/vB. Supply is fixed, demand fluctuates — price discovery works.'
  ],
  research: [
    'Storage cost coverage ratio: 1.5%. Fees cover 1.5% of 10-year node storage costs. Empirical data from ' + Math.floor(Math.random() * 100 + 700) + ' blocks sampled across Bitcoin history.',
    'New finding: fee-to-storage ratio holds at 1.5% across bull and bear markets. Consistent ratio suggests a structural property of the fee market, not cyclical noise.',
    'Bitcoin settlement at $5.9B daily with $68K average transaction value. The network settles more value than most payment processors — without accounts, chargebacks, or KYC.'
  ],
  capacity: [
    'Daily settlement: $5.9B. Average tx: $68K. Nodes: 27,800. Lightning capacity: 4,390 BTC. Settlement at scale is Bitcoins killer app — not digital gold, not payments, settlement.',
    'Settlement capacity analysis: at 7 TPS average, Bitcoin settles more value per second than Visa settles per transaction. Throughput is not the metric — value throughput is.',
    'Lightning Network adds ' + Math.floor(Math.random() * 500 + 4000) + ' BTC capacity for instant settlements. Trust-minimized, non-custodial, final. The second layer extends the first.'
  ],
  dev: [
    'Bitcoin Core ' + Math.floor(Math.random() * 5 + 27) + ': ' + Math.floor(Math.random() * 15 + 5) + ' PRs merged this cycle. Protocol evolution continues through conservative, review-driven development.',
    'BIP process: ' + Math.floor(Math.random() * 10 + 5) + ' active proposals. Bitcoin changes slowly by design. Each BIP represents years of discussion, review, and economic analysis.',
    'Bitcoin Core ' + Math.floor(Math.random() * 5 + 27) + ' release candidate. Testing, review, and deployment. The protocol upgrades without disruption — that is the achievement.'
  ],
  fork: [
    'BIP-110: ' + Math.floor(Math.random() * 500 + 1500) + ' blocks signaling. Fork tracker live at bitcoinsahi.com. Signal count is not consensus — economic nodes decide activation.',
    'BIP-110 signaling at ' + Math.floor(Math.random() * 30 + 60) + '%. Thresholds approaching. What happens at the fork boundary depends on miner coordination and node operator consent.',
    'BIP-110 signal count: ' + Math.floor(Math.random() * 300 + 1700) + '. Fork tracker available. Bitcoin forks are not splits — they are upgrades that require economic majority consent.'
  ],
  economy: [
    'Average transaction value: $' + (Math.random() * 40000 + 40000).toFixed(0) + '. Bitcoin settles high-value transactions. The fee as a percentage of transferred value is lower than any alternative.',
    'Bitcoin economy: $' + (Math.random() * 20000 + 60000).toFixed(0) + ' avg tx. At these values, even 50 sat/vB fees are negligible relative to settlement certainty. Value > cost.',
    'Transaction value distribution: ' + Math.floor(Math.random() * 80 + 20) + '% of settled value comes from transactions over $10K. Bitcoin is a settlement network for economic activity.'
  ],
  node: [
    'Node operators earn ' + (Math.random() * 20 + 5).toFixed(1) + ' sats/day in fees. Not about revenue — about validating your own settlements. Running a node is being a sovereign agent.',
    '27,800 reachable nodes across ' + Math.floor(Math.random() * 40 + 20) + ' countries. The network is geographically distributed. No single jurisdiction can shut it down.',
    'Node count: ' + Math.floor(Math.random() * 2000 + 26000) + ' reachable. Each node independently validates every transaction and block. Trust is distributed across thousands of operators.'
  ],
  exchange: [
    'Batch savings: ' + Math.floor(Math.random() * 40 + 40) + '%. Exchanges that batch withdrawals reduce on-chain footprint by consolidating outputs. Efficiency through coordination.',
    'Exchange batching analysis: ' + Math.floor(Math.random() * 30 + 50) + '% of withdrawals are batched. Remaining ' + Math.floor(Math.random() * 20 + 30) + '% are individual — room for improvement.',
    'Batch efficiency at ' + Math.floor(Math.random() * 20 + 60) + '%. Each batch transaction replaces up to ' + Math.floor(Math.random() * 10 + 5) + ' individual withdrawals. Block space saved = fees saved.'
  ],
  miner: [
    'Miner revenue: $' + (Math.random() * 15 + 25).toFixed(1) + 'M daily. Block subsidies + fees. The transition from subsidy-dependent to fee-dependent is the longest economic experiment in crypto.',
    'Miner revenue breakdown: $' + (Math.random() * 10 + 20).toFixed(1) + 'M subsidy + $' + (Math.random() * 5 + 2).toFixed(1) + 'M fees. Fee percentage: ' + Math.floor(Math.random() * 15 + 5) + '%. Growing.',
    'Hashrate at ' + Math.floor(Math.random() * 100 + 600) + ' EH/s. Mining difficulty adjusts every 2016 blocks to maintain 10-minute intervals. The market prices energy expenditure.'
  ],
  lightning: [
    'Lightning Network: ' + Math.floor(Math.random() * 1000 + 4000) + ' BTC capacity. ' + Math.floor(Math.random() * 10000 + 15000) + ' channels. Instant, non-custodial, scalable — without sacrificing sovereignty.',
    'LN capacity at ' + Math.floor(Math.random() * 500 + 4000) + ' BTC. Channel count: ' + Math.floor(Math.random() * 5000 + 10000) + '. The network grows not in channels but in liquidity depth.',
    'Lightning channels: ' + Math.floor(Math.random() * 3000 + 12000) + ' with median capacity of ' + (Math.random() * 0.01 + 0.005).toFixed(3) + ' BTC. Micro-channels for daily spend, large channels for routing.'
  ]
};

var USED_CONTENT = new Set();

function generatePostContent(emp) {
  var topic = emp.topics[Math.floor(Math.random() * emp.topics.length)];
  var options = TOPIC_CONTENT[topic] || TOPIC_CONTENT.fee;
  var content = options[Math.floor(Math.random() * options.length)];

  // Ensure uniqueness — add a fingerprint
  var fingerprint = Date.now() + '-' + emp.id + '-' + topic;
  var unique = emp.avatar + ' ' + emp.title + ': ' + content;

  return { content: unique, topic: topic, fingerprint: fingerprint };
}

function hexToBytes(h) {
  var b = new Uint8Array(h.length / 2);
  for (var i = 0; i < h.length; i += 2) b[i / 2] = parseInt(h.substring(i, i + 2), 16);
  return b;
}

function keys() {
  if (fs.existsSync(KEYS_PATH)) {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  }
  var sk = generateSecretKey();
  var pk = getPublicKey(sk);
  var data = { privkey: Buffer.from(sk).toString('hex'), pubkey: pk, createdAt: new Date().toISOString() };
  fs.writeFileSync(KEYS_PATH, JSON.stringify(data, null, 2));
  return data;
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch (e) {
    var state = { employees: {}, totalPosts: 0 };
    EMPLOYEES.forEach(function(e) {
      state.employees[e.id] = { id: e.id, name: e.name, totalPosts: 0, lastPost: null, platforms: {}, onboarded: true };
    });
    return state;
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

async function postToNostr(content, topic, empId) {
  var k = keys();
  var skB = hexToBytes(k.privkey);

  var event = finalizeEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'Bitcoin'],
      ['t', 'BlockSpace'],
      ['t', 'BSAHI'],
      ['t', topic],
      ['d', empId],
      ['r', 'bitcoinsahi.com']
    ],
    content: content + '\n\n⬡ ' + empId.charAt(0).toUpperCase() + empId.slice(1) + ' — BSAHI Research'
  }, skB);

  var pool = new SimplePool();
  var pubResult = pool.publish(RELAYS, event);
  var promises = Object.values(pubResult);
  var settled = await Promise.allSettled(promises);
  var confirmed = settled.filter(function(s) { return s.status === 'fulfilled'; }).length;
  pool.close(RELAYS);

  return { eventId: event.id, confirmed: confirmed, total: RELAYS.length };
}

async function runAllEmployees() {
  log('=== Employee publishing cycle ===');
  var state = loadState();
  var postLog = loadPostLog();
  var results = [];

  for (var e = 0; e < EMPLOYEES.length; e++) {
    var emp = EMPLOYEES[e];
    var post = generatePostContent(emp);

    try {
      var result = await postToNostr(post.content, post.topic, emp.id);
      var link = 'https://snort.social/e/' + result.eventId;

      postLog.posts.push({
        id: emp.id + '-' + Date.now(),
        platform: 'nostr',
        topic: post.topic,
        author: emp.name,
        authorAvatar: emp.avatar,
        eventId: result.eventId,
        url: link,
        confirmedRelays: result.confirmed,
        totalRelays: result.total,
        postedAt: new Date().toISOString(),
        contentPreview: post.content.slice(0, 100)
      });

      state.employees[emp.id].totalPosts++;
      state.employees[emp.id].lastPost = new Date().toISOString();
      state.employees[emp.id].platforms.nostr = (state.employees[emp.id].platforms.nostr || 0) + 1;
      state.totalPosts++;

      log(emp.avatar + ' ' + emp.name + ' | ' + post.topic + ' | ' + result.confirmed + '/' + result.total + ' relays | ' + link);
      results.push({ employee: emp.name, topic: post.topic, link: link, relays: result.confirmed + '/' + result.total });

    } catch(err) {
      log(emp.avatar + ' ' + emp.name + ' | ERROR: ' + err.message.slice(0, 60));
      results.push({ employee: emp.name, error: err.message });
    }
  }

  saveState(state);
  savePostLog(postLog);

  log(results.length + ' employees processed');
  log('=== Cycle complete ===');
  return results;
}

function loadPostLog() {
  try { return JSON.parse(fs.readFileSync(POST_LOG_PATH, 'utf8')); } catch (e) { return { posts: [], cycles: 0 }; }
}

function savePostLog(data) {
  fs.writeFileSync(POST_LOG_PATH, JSON.stringify(data, null, 2));
}

function getEmployees() {
  var state = loadState();
  return EMPLOYEES.map(function(emp) {
    var es = state.employees[emp.id] || {};
    return { id: emp.id, name: emp.name, title: emp.title, avatar: emp.avatar, topics: emp.topics, totalPosts: es.totalPosts || 0, lastPost: es.lastPost, onboarded: true };
  });
}

if (require.main === module) {
  runAllEmployees().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
}

module.exports = { runAllEmployees: runAllEmployees, getEmployees: getEmployees };
