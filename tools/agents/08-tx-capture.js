var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');

var RPC_ARGS = '-rpcuser=bsahi -rpcpassword=bsahi';

function bitcoinCli(method, params) {
  try {
    var cmd = '~/.local/bin/bitcoin-cli ' + RPC_ARGS + ' ' + method;
    if (params) cmd += ' ' + params;
    var result = child_process.execSync(cmd, { encoding: 'utf8', timeout: 60000, shell: '/bin/zsh' });
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
}

function sqlExec(sql) {
  try {
    var tmpFile = '/tmp/bsahi-tx-' + Date.now() + '.sql';
    fs.writeFileSync(tmpFile, sql);
    child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmpFile + '"', { stdio: 'pipe', timeout: 30000 });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    return true;
  } catch (e) {
    console.error('SQL error:', e.message);
    return false;
  }
}

function sqlQuery(sql) {
  try {
    var tmpFile = '/tmp/bsahi-tx-q-' + Date.now() + '.sql';
    fs.writeFileSync(tmpFile, '.mode json\n' + sql + ';');
    var result = child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + tmpFile + '"', { encoding: 'utf8', timeout: 30000 });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    try { return JSON.parse(result); } catch (e) { return []; }
  } catch (e) { return []; }
}

function classifyTx(tx) {
  if (tx.vin && tx.vin.length === 1 && tx.vin[0].coinbase) return 'coinbase';
  var hasWitness = false;
  if (tx.vin) {
    for (var i = 0; i < tx.vin.length; i++) {
      if (tx.vin[i].txinwitness && tx.vin[i].txinwitness.length > 0) { hasWitness = true; break; }
    }
  }
  // Check for inscription (OP_FALSE OP_IF ... OP_ENDIF in witness)
  if (hasWitness && tx.vout) {
    for (var i = 0; i < tx.vout.length; i++) {
      if (tx.vout[i].scriptPubKey && tx.vout[i].scriptPubKey.hex && tx.vout[i].scriptPubKey.hex.includes('0063')) {
        return 'inscription';
      }
    }
  }
  return hasWitness ? 'segwit' : 'legacy';
}

function processBlock(block, height) {
  if (!block || !block.tx) return 0;
  var count = 0;
  var values = [];
  var txCount = block.tx.length;

  for (var i = 0; i < txCount; i++) {
    var tx = block.tx[i];
    var txid = tx.txid || tx.hash || '';
    if (!txid) continue;

    var fee = tx.fee || 0;
    var vsize = tx.vsize || tx.size || 0;
    var weight = tx.weight || (vsize * 4) || 0;
    var feeRate = vsize > 0 ? Math.round(fee / vsize) : 0;
    var txType = classifyTx(tx);
    var isCoinbase = txType === 'coinbase' ? 1 : 0;
    var inputCount = tx.vin ? tx.vin.length : 0;
    var outputCount = tx.vout ? tx.vout.length : 0;
    var totalOut = 0;
    if (tx.vout) { for (var j = 0; j < tx.vout.length; j++) { totalOut += tx.vout[j].value || 0; } }
    totalOut = Math.round(totalOut * 100000000);

    // Escape for SQL
    var esc = function(v) { return "'" + String(v).replace(/'/g, "''") + "'"; };
    values.push('(' + esc(txid) + ',' + height + ',' + esc(block.hash || '') + ',' + fee + ',' + vsize + ',' + feeRate + ',' + esc(txType) + ',' + isCoinbase + ',' + inputCount + ',' + outputCount + ',' + totalOut + ',' + weight + ')');
    count++;

    if (count >= 5000) break;
  }

  if (count > 0) {
    var sql = 'INSERT OR IGNORE INTO transactions (txid, block_height, block_hash, fee_sats, vsize, fee_rate_satvb, tx_type, is_coinbase, input_count, output_count, total_output_sats, weight) VALUES ' + values.join(',\n') + ';';
    sqlExec(sql);
  }

  return count;
}

async function captureLatestBlocks() {
  var info = bitcoinCli('getblockchaininfo');
  if (!info) { console.log('Bitcoin Core offline'); return 0; }

  var currentHeight = info.blocks;
  if (currentHeight === 0) { console.log('Bitcoin Core still syncing'); return 0; }

  var lastHeight = 0;
  var existing = sqlQuery('SELECT MAX(block_height) as h FROM transactions');
  if (existing && existing.length > 0 && existing[0].h) lastHeight = existing[0].h;

  var startHeight = Math.max(lastHeight + 1, currentHeight - 5);
  var totalTx = 0;

  for (var h = startHeight; h <= currentHeight; h++) {
    try {
      var hashCmd = bitcoinCli('getblockhash', h);
      if (!hashCmd) continue;
      var hash = hashCmd;
      var block = bitcoinCli('getblock', '"' + hash + '" 2');
      if (!block) {
        block = bitcoinCli('getblock', '"' + hash + '" 3');
      }
      if (block) {
        var txCount = processBlock(block, h);
        totalTx += txCount;
        console.log('  Block ' + h + ': ' + txCount + ' transactions');
      }
    } catch (e) {
      console.log('  Block ' + h + ': error — ' + e.message);
    }
  }

  // Update block_stats with tx type breakdown
  if (totalTx > 0) {
    var breakdown = sqlQuery("SELECT tx_type, COUNT(*) as c FROM transactions WHERE block_height >= " + startHeight + " GROUP BY tx_type");
    if (breakdown && breakdown.length > 0) {
      var parts = [];
      for (var i = 0; i < breakdown.length; i++) {
        parts.push(breakdown[i].tx_type + ': ' + breakdown[i].c);
      }
      console.log('  Breakdown: ' + parts.join(', '));
    }
  }

  return totalTx;
}

if (require.main === module) {
  // Update schema first
  var schemaPath = path.resolve(__dirname, '..', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    try { child_process.execSync('sqlite3 "' + DB_PATH + '" < "' + schemaPath + '"', { stdio: 'pipe', timeout: 30000 }); } catch (e) {}
  }

  captureLatestBlocks().then(function(txCount) {
    if (txCount > 0) console.log('Captured ' + txCount + ' transactions');
    else console.log('No new transactions');
  }).catch(function(e) {
    console.log('Error:', e.message);
  });
}

module.exports = { captureLatestBlocks: captureLatestBlocks };
