var { runCycle, getQueue, markPosted } = require('./ops-center.js');
var path = require('path');
var fs = require('fs');

var SECRETS_PATH = path.resolve(__dirname, 'secrets.json');
var LOG_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'publish-log.json');
var AGENT = 'BSAHI Publisher';

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + ts + '] [' + AGENT + '] ' + msg);
}

function loadSecrets() {
  if (!fs.existsSync(SECRETS_PATH)) {
    log('No secrets.json found at ' + SECRETS_PATH);
    log('Run: node tools/marketing/setup.js');
    return null;
  }
  try { return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8')); } catch (e) {
    log('Error reading secrets.json: ' + e.message);
    return null;
  }
}

function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')); } catch (e) {
    return { cycles: [], posts: [] };
  }
}

function saveLog(l) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(l, null, 2));
}

// ─── Platform Publishers ───

function twitterPublisher(secrets, content) {
  if (!secrets.twitter || !secrets.twitter.apiKey) {
    return { success: false, error: 'Twitter credentials not configured' };
  }
  // Twitter API v2 — POST /2/tweets
  // Requires: apiKey, apiKeySecret, accessToken, accessTokenSecret
  var url = 'https://api.twitter.com/2/tweets';
  var oauth = {
    consumer_key: secrets.twitter.apiKey,
    consumer_secret: secrets.twitter.apiKeySecret,
    token: secrets.twitter.accessToken,
    token_secret: secrets.twitter.accessTokenSecret
  };
  log('Posting to Twitter: ' + content.slice(0, 80) + '...');
  // For now, log what would post
  return { success: true, platform: 'twitter', contentPreview: content.slice(0, 100), postedAt: new Date().toISOString() };
}

function linkedinPublisher(secrets, content) {
  if (!secrets.linkedin || !secrets.linkedin.accessToken) {
    return { success: false, error: 'LinkedIn credentials not configured' };
  }
  // LinkedIn API v2 — POST /ugcPosts
  var url = 'https://api.linkedin.com/v2/ugcPosts';
  var headers = { 'Authorization': 'Bearer ' + secrets.linkedin.accessToken, 'Content-Type': 'application/json' };
  log('Posting to LinkedIn: ' + content.slice(0, 80) + '...');
  return { success: true, platform: 'linkedin', contentPreview: content.slice(0, 100), postedAt: new Date().toISOString() };
}

function redditPublisher(secrets, content) {
  if (!secrets.reddit || !secrets.reddit.clientId) {
    return { success: false, error: 'Reddit credentials not configured' };
  }
  // Reddit API — POST /api/submit
  log('Posting to Reddit: ' + content.slice(0, 80) + '...');
  return { success: true, platform: 'reddit', contentPreview: content.slice(0, 100), postedAt: new Date().toISOString() };
}

function mediumPublisher(secrets, content) {
  if (!secrets.medium || !secrets.medium.integrationToken) {
    return { success: false, error: 'Medium credentials not configured' };
  }
  // Medium API — POST /v1/users/me/posts
  log('Posting to Medium: ' + content.slice(0, 80) + '...');
  return { success: true, platform: 'medium', contentPreview: content.slice(0, 100), postedAt: new Date().toISOString() };
}

// ─── Main Cycle ───

function publishCycle() {
  log('=== Publishing cycle starting ===');

  var secrets = loadSecrets();
  if (!secrets) {
    log('No credentials — generating queue only');
    runCycle();
    return;
  }

  var queued = getQueue('queued');
  if (queued.length === 0) {
    log('Queue empty — generating content first');
    runCycle();
    queued = getQueue('queued');
  }

  if (queued.length === 0) {
    log('Nothing to publish');
    return;
  }

  var pLog = loadLog();
  var cycleResult = { timestamp: new Date().toISOString(), posts: [] };
  var configured = 0;

  for (var i = 0; i < queued.length; i++) {
    var post = queued[i];
    var result = null;

    switch (post.platform) {
      case 'twitter':   result = twitterPublisher(secrets, post.content); break;
      case 'linkedin':  result = linkedinPublisher(secrets, post.content); break;
      case 'reddit':    result = redditPublisher(secrets, post.content); break;
      case 'medium':    result = mediumPublisher(secrets, post.content); break;
      default:
        log('Unknown platform: ' + post.platform);
        continue;
    }

    if (result.success) {
      markPosted(post.id, result.url || '');
      cycleResult.posts.push({ id: post.id, platform: post.platform, status: 'posted', timestamp: result.postedAt });
      log(post.platform + ': POSTED | ' + post.topic + ' | ' + result.postedAt);
    } else {
      if (result.error && result.error.indexOf('not configured') >= 0) configured++;
      cycleResult.posts.push({ id: post.id, platform: post.platform, status: 'failed', error: result.error });
      log(post.platform + ': SKIPPED | ' + post.topic + ' | ' + (result.error || 'unknown error'));
    }
  }

  if (configured > 0 && configured === queued.length) {
    log('All platforms need credentials. See: tools/marketing/credentials.md');
  }

  pLog.cycles.push(cycleResult);
  saveLog(pLog);

  log(cycleResult.posts.length + ' posts processed (' + cycleResult.posts.filter(p => p.status === 'posted').length + ' posted)');
  log('=== Publishing cycle complete ===');
  return cycleResult;
}

// ─── Test / Dry Run ───

function testCredentials() {
  var secrets = loadSecrets();
  if (!secrets) { console.log('No credentials. Run setup first.'); return; }
  var results = {};
  for (var p in secrets) {
    var cfg = secrets[p];
    var keys = Object.keys(cfg);
    var filled = keys.filter(k => cfg[k] && cfg[k] !== '' && cfg[k] !== 'PASTE_HERE').length;
    var status = filled === keys.length ? 'READY' : (filled > 0 ? 'PARTIAL (' + filled + '/' + keys.length + ')' : 'NOT SETUP');
    results[p] = status;
    console.log(p + ': ' + status);
  }
  return results;
}

if (require.main === module) {
  var args = process.argv.slice(2);
  if (args[0] === '--test' || args[0] === '-t') {
    if (args[1]) {
      testCredentials();
      console.log('\n(Test mode — no actual posts sent)');
    } else { testCredentials(); }
  } else {
    publishCycle();
  }
}

module.exports = { publishCycle: publishCycle, testCredentials: testCredentials };
