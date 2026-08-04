#!/usr/bin/env node
// BSAHI — backfill-block-stats.js (UTXO leg, G-06, 2026-08-04)
// Populates the block_stats table (incl. utxo_size_inc) from the two stores
// that actually carry per-block getblockstats data:
//   1) captured-data/btc-rpc/**/<ts>.json   (agent-06 raw captures, JSON)
//   2) captured-data/spool/index/btc_rpc/*.jsonl  (spool envelopes; source of truth)
// Idempotent: INSERT OR REPLACE keyed on block height. Safe to re-run.
var fs = require('fs');
var path = require('path');
var db = require('./init.js');

var ROOT = path.resolve(__dirname, '..', '..');
var RPC_DIR = path.join(ROOT, 'captured-data', 'btc-rpc');
var SPOOL_DIR = path.join(ROOT, 'captured-data', 'spool', 'index', 'btc_rpc');

var written = 0, skipped = 0, files = 0, utxoRows = 0, heights = [];

function toIso(secs) { try { return new Date((secs || 0) * 1000).toISOString(); } catch (e) { return ''; } }

function ingestBlocks(blocks, srcFile) {
  if (!Array.isArray(blocks)) return;
  blocks.forEach(function(b) {
    if (b == null || b.height == null) return;
    var ok = db.insertBlockStats(
      b.height, b.hash || '', toIso(b.time), b.txCount || 0, b.size || 0, b.weight || 0,
      b.avgFee || 0, b.avgFeeRate || 0, b.feePercentiles || [], (b.subsidy || 0) / 100000000,
      '', b.utxoSizeInc || 0
    );
    if (ok) { written++; heights.push(b.height); if (b.utxoSizeInc) utxoRows++; }
    else skipped++;
  });
  if (blocks.length) files++;
}

// 1) Raw agent-06 captures
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function(entry) {
    var p = path.join(dir, entry);
    var st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (entry.endsWith('.json')) {
      try {
        var d = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (d && d.ok && d.blocks) ingestBlocks(d.blocks, p);
      } catch (e) {}
    }
  });
})(RPC_DIR);

// 2) Spool envelopes (source of truth, includes days not on disk as raw)
if (fs.existsSync(SPOOL_DIR)) {
  fs.readdirSync(SPOOL_DIR).filter(function(f) { return f.endsWith('.jsonl'); }).forEach(function(dayFile) {
    var lines;
    try { lines = fs.readFileSync(path.join(SPOOL_DIR, dayFile), 'utf8').split('\n').filter(Boolean); } catch (e) { return; }
    lines.forEach(function(line) {
      try {
        var env = JSON.parse(line);
        var d = env && env.payload ? (env.payload.data || {}) : {};
        if (d && d.ok && d.blocks) ingestBlocks(d.blocks, dayFile);
      } catch (e) {}
    });
  });
}

var stats = { written: written, skipped: skipped, rawFiles: files, utxoRows: utxoRows };
if (heights.length) {
  stats.minHeight = Math.min.apply(null, heights);
  stats.maxHeight = Math.max.apply(null, heights);
  stats.uniqueHeights = Object.keys(heights.reduce(function(a, h) { a[h] = 1; return a; }, {})).length;
}
console.log('backfill: ' + JSON.stringify(stats));
module.exports = stats;
