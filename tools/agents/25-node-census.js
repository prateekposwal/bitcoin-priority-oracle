#!/usr/bin/env node
// BSAHI — Node Census Capture (real Core data, replaces the 10K-100K assumption)
// Pulls getnodeaddresses (real reachable-node knowledge from this Core node) and
// getpeerinfo, persists to spool as source 'node_census' with expectedIntervalMinutes.
// This is PRIMARY-SOURCE data: the census band (10K-100K) was an assumption; this
// records what a real node actually observes.
var path = require('path');
var child_process = require('child_process');

var REPO = path.resolve(__dirname, '..', '..');
var RPC_ARGS = '-rpcuser=bsahi -rpcpassword=bsahi';
var BITCOIN_CLI = process.env.HOME + '/.local/bin/bitcoin-cli';

function rpc(method, params) {
  try {
    var cmd = BITCOIN_CLI + ' ' + RPC_ARGS + ' ' + method;
    if (params) cmd += ' ' + params;
    return JSON.parse(child_process.execSync(cmd, { encoding: 'utf8', timeout: 20000, shell: '/bin/zsh', maxBuffer: 64 * 1024 * 1024 }));
  } catch (e) { return null; }
}

async function run() {
  var out = { ok: false, totalKnownAddresses: 0, liveConnections: 0, inbound: 0, outbound: 0, observedAt: new Date().toISOString() };

  // Real census: how many node addresses does a live Core node know about?
  // Note: RPC max is 32,000 but the address DB may return fewer; some builds error
  // on large requests — fall back to 10,000 (verified working on this node).
  var addrs = rpc('getnodeaddresses', '32000');
  if ((!addrs || !Array.isArray(addrs)) ) {
    addrs = rpc('getnodeaddresses', '10000');
  }
  if (addrs && Array.isArray(addrs)) {
    out.totalKnownAddresses = addrs.length;
    out.sample = addrs.slice(0, 3).map(function(a) { return a.address; });
    out.ok = true;
  }

  var peers = rpc('getpeerinfo');
  if (peers && Array.isArray(peers)) {
    out.liveConnections = peers.length;
    peers.forEach(function(p) { if (p.inbound) out.inbound++; else out.outbound++; });
  }

  var net = rpc('getnetworkinfo');
  if (net) {
    out.networkVersion = net.version;
    out.connections = net.connections;
  }

  var spoolMod = require('../data-engineering/spool.js');
  var now = new Date();
  var ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0');
  var day = ts.slice(0, 10);
  var spool = await spoolMod.init();
  var result = await spool.enqueue('node_census', {
    status: out.ok ? 200 : 0,
    data: out,
    fetchedAt: new Date().toISOString()
  }, { captureTime: ts, day: day, producer: 'node-census', expectedIntervalMinutes: 60 * 24 });

  if (require.main === module) {
    console.log('node-census: ' + out.totalKnownAddresses + ' known addresses, ' + out.liveConnections + ' live connections, ' + (result.ok ? 'enqueued' : 'duplicate'));
  }
  return out;
}

if (require.main === module) { run().then(function() { process.exit(0); }).catch(function(e) { console.error(e); process.exit(1); }); }

module.exports = { run: run };
