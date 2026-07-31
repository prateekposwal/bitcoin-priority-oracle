#!/usr/bin/env node
// BSAHI — Ledger Gate (cross-stack dedupe for the Python publishing stack).
// Reads captured-data/publishing-queue.json and reports whether a platform is
// blocked within its cadence window (per tools/marketing/cadence.js).
// Usage: node ledger-gate.js <platform> [topic]
// Exit 0 = allowed, exit 1 = blocked (prints reason).
var path = require('path');
var fs = require('fs');

var REPO = path.resolve(__dirname, '..', '..');
var LEDGER = path.join(REPO, 'captured-data', 'publishing-queue.json');

function main() {
  var platform = process.argv[2];
  var topic = process.argv[3];
  if (!platform) { console.error('usage: node ledger-gate.js <platform> [topic]'); process.exit(2); }
  var cadence = require('../marketing/cadence.js');
  var ledger = { items: [] };
  try { ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch (e) {}
  var now = Date.now();
  for (var i = 0; i < (ledger.items || []).length; i++) {
    var it = ledger.items[i];
    if (it.status !== 'posted' || !it.postedAt) continue;
    if (String(it.platform) !== String(platform)) continue;
    var ageMs = now - new Date(it.postedAt).getTime();
    if (isNaN(ageMs) || ageMs > cadence.windowMs(platform)) continue;
    if (!topic || String(it.topic) === String(topic) || !it.topic || it.topic === 'unknown') {
      console.log('BLOCKED: ' + platform + ' posted ' + Math.round(ageMs / 3600000) + 'h ago');
      process.exit(1);
    }
  }
  process.exit(0);
}

main();
