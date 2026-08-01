var child_process = require('child_process');
var path = require('path');

var RPC_ARGS = '-rpcuser=bsahi -rpcpassword=bsahi';
var TX_CAPTURE = path.resolve(__dirname, '08-tx-capture.js');
var CHECK_INTERVAL = 300000;
var LAST_BLOCK = 0;
var TX_CAPTURED_FOR = {};

function bitcoinCli(method, params) {
  try {
    var cmd = '~/.local/bin/bitcoin-cli ' + RPC_ARGS + ' ' + method;
    if (params) cmd += ' ' + params;
    var r = child_process.execSync(cmd, { encoding: 'utf8', timeout: 15000, shell: '/bin/zsh' });
    return JSON.parse(r);
  } catch (e) { return null; }
}

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[Sync Watcher ' + ts + '] ' + msg);
}

function checkAndCapture() {
  var info = bitcoinCli('getblockchaininfo');
  if (!info) { return; }

  var blocks = info.blocks;
  var headers = info.headers;
  var progress = info.verificationprogress;

  if (blocks === 0) {
    log('Syncing: ' + Math.round(progress * 100) + '% (' + blocks + '/' + headers + ' blocks)');
    return;
  }

  // Check if new blocks since last check
  if (blocks > LAST_BLOCK) {
    log('New blocks: ' + LAST_BLOCK + ' → ' + blocks + ' (' + Math.round(progress * 100) + '%)');
    LAST_BLOCK = blocks;
  }

  // Capture transactions for new blocks
  var newBlockCount = 0;
  for (var h = blocks; h > blocks - 10 && h > 0; h--) {
    if (!TX_CAPTURED_FOR[h]) {
      TX_CAPTURED_FOR[h] = true;
      newBlockCount++;
    }
  }

  if (newBlockCount > 0 || (blocks >= headers && progress > 0.99)) {
    log('Capturing transactions for new blocks...');
    try {
      var r = child_process.execSync('node "' + TX_CAPTURE + '"', { encoding: 'utf8', timeout: 120000 });
      log(r.trim().split('\n').pop());
    } catch (e) {
      log('Capture error: ' + e.message);
    }
  }

  if (blocks >= headers && progress > 0.9999) {
    log('✅ Fully synced: ' + blocks + ' blocks, ' + Math.round(progress * 100) + '%');
  }
}

log('Started — checking every 5 minutes');
checkAndCapture();
setInterval(checkAndCapture, CHECK_INTERVAL);
