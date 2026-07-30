var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var { generateSecretKey, getPublicKey, finalizeEvent } = require('nostr-tools/pure');
var { SimplePool } = require('nostr-tools/pool');
var { useWebSocketImplementation } = require('nostr-tools/pool');
var WebSocket = require('ws');
var { getQueue, markPosted } = require('./ops-center.js');

useWebSocketImplementation(WebSocket);

var KEY_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'nostr-key.json');
var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');
var AGENT = 'Nostr Publisher';

var RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.bitcoiner.social',
  'wss://relay.primal.net'
];

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

function loadOrCreateKeys() {
  if (fs.existsSync(KEY_PATH)) {
    var data = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
    log('Loaded existing key: ' + data.pubkey.slice(0, 12) + '...');
    return data;
  }
  var sk = generateSecretKey();
  var pk = getPublicKey(sk);
  var nsec = Buffer.from(sk).toString('hex');
  var keyData = { privkey: nsec, pubkey: pk, createdAt: new Date().toISOString() };
  fs.writeFileSync(KEY_PATH, JSON.stringify(keyData, null, 2));
  log('Generated new keypair: ' + pk.slice(0, 12) + '...');
  log('  Public key (npub): ' + pk);
  log('  Private key saved to: ' + KEY_PATH);
  return keyData;
}

function hexToBytes(hex) {
  var bytes = new Uint8Array(hex.length / 2);
  for (var i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  return bytes;
}

function getDb() {
  try { return require('better-sqlite3')(DB_PATH); } catch (e) {
    try {
      var init = require('child_process').execSync('which sqlite3').toString().trim();
      if (init) return null;
    } catch (e2) {}
    return null;
  }
}

function logPostToDb(platform, content, status, eventId) {
  try {
    var db = getDb();
    if (!db) return;
    db.prepare("INSERT INTO research_findings (agent, finding, category, confidence) VALUES (?, ?, ?, ?)").run(
      'nostr-publisher',
      JSON.stringify({ platform: platform, content: content.slice(0, 200), status: status, eventId: eventId, timestamp: new Date().toISOString() }),
      'social_post',
      1.0
    );
    db.close();
  } catch (e) {
    log('DB error: ' + e.message);
  }
}

// ─── Tag helpers ───

function bsaHiTags() {
  return [
    ['t', 'Bitcoin'],
    ['t', 'BlockSpace'],
    ['t', 'BSAHI'],
    ['t', 'economics']
  ];
}

function contentForPlatform(platform, topic, baseContent) {
  var tags = '';
  switch (platform) {
    case 'nostr':
      return baseContent + '\n\n#Bitcoin #BlockSpace #BSAHI';
    default:
      return baseContent;
  }
}

// ─── Publish cycle ───

async function publishCycle() {
  log('=== Nostr publishing cycle ===');

  var keys = loadOrCreateKeys();
  var skBytes = hexToBytes(keys.privkey);

  var queue = getQueue('queued');
  if (queue.length === 0) {
    log('Queue empty — generating content');
    var { generateDailyQueue } = require('./ops-center.js');
    generateDailyQueue();
    queue = getQueue('queued');
  }

  if (queue.length === 0) {
    log('Nothing to publish');
    return [];
  }

  var pool = new SimplePool();
  var results = [];

  for (var i = 0; i < Math.min(queue.length, 3); i++) {
    var post = queue[i];
    var content = contentForPlatform('nostr', post.topic, post.content);

    try {
      var event = finalizeEvent({
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ...bsaHiTags(),
          ['d', post.topic],
          ['source', 'BSAHI']
        ],
        content: content
      }, skBytes);

      var published = await Promise.any(
        pool.publish(RELAYS.slice(0, 3), event)
      );

      markPosted(post.id, 'nostr:event:' + event.id);
      logPostToDb('nostr', content, 'posted', event.id);
      log('POSTED | ' + post.topic + ' | event: ' + event.id.slice(0, 16) + '...');
      results.push({ id: post.id, platform: 'nostr', status: 'posted', eventId: event.id, timestamp: new Date().toISOString() });

    } catch (e) {
      log('FAILED | ' + post.topic + ' | ' + e.message);
      logPostToDb('nostr', content, 'failed: ' + e.message, null);
      results.push({ id: post.id, platform: 'nostr', status: 'failed', error: e.message });
    }
  }

  pool.close(RELAYS);
  log(results.length + ' events processed (' + results.filter(r => r.status === 'posted').length + ' posted)');
  log('=== Cycle complete ===');
  return results;
}

// ─── CLI ───

if (require.main === module) {
  (async function() {
    var args = process.argv.slice(2);
    if (args[0] === '--pubkey' || args[0] === '-k') {
      var keys = loadOrCreateKeys();
      console.log('Public key: ' + keys.pubkey);
      console.log('npub:       npub1' + keys.pubkey);
      console.log('Created:    ' + keys.createdAt);
      console.log('Relays:     ' + RELAYS.join(', '));
      console.log('');
      console.log('Find this profile at: https://snort.social/p/npub1' + keys.pubkey);
    } else {
      await publishCycle();
    }
  })().catch(function(e) { console.error(e); process.exit(1); });
}

module.exports = { publishCycle: publishCycle, loadOrCreateKeys: loadOrCreateKeys, RELAYS: RELAYS };
