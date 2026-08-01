#!/usr/bin/env node
// BSAHI — 22 Content Optimizer Agent
// Generates the SEO-visible homepage text layer from real spool/tools data.
// Writes docs/data/content.json consumed by index.html. No HTML edits.
var path = require('path');
var fs = require('fs');

var REPO = path.resolve(__dirname, '..', '..');
var OUT = path.join(REPO, 'data', 'content.json');

function loadJson(p, fb) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fb; } }

function run() {
  var fc = loadJson(path.join(REPO, 'tools', 'fee_forecast.json'), null);
  var snapshot = loadJson(path.join(REPO, 'docs', 'data', 'snapshot.json'), null);
  var lastFee = snapshot && snapshot.fees && snapshot.fees.fastestFee !== undefined ? snapshot.fees.fastestFee : (fc && fc.latest_fastest_fee);
  var trend = fc ? fc.trend : 'stable';
  var price = snapshot && snapshot.btc_price ? snapshot.btc_price : null;
  var height = snapshot && snapshot.block_height ? snapshot.block_height : null;

  var heroH1 = 'Bitcoin Sahi — Block Space Research';
  var valueProp = 'An autonomous research engine measuring Bitcoin\'s fee market, mempool, and block space in real time. The network\'s economics, captured continuously and published openly.';
  var liveSnapshotMd = 'Live network snapshot: ';
  if (lastFee !== undefined) liveSnapshotMd += 'fastest fee ' + lastFee + ' sat/vB, ';
  if (price) liveSnapshotMd += 'price $' + price.toLocaleString() + ', ';
  if (height) liveSnapshotMd += 'height ' + height + '. ';
  liveSnapshotMd += 'Fee trend: ' + trend + '.';

  var out = {
    generated_at: new Date().toISOString(),
    hero_h1: heroH1,
    value_prop: valueProp,
    live_snapshot_md: liveSnapshotMd,
    last_updated: new Date().toISOString(),
    fee_trend: trend,
    latest_fee_satvb: lastFee !== undefined ? lastFee : null
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  if (require.main === module) console.log('content-optimizer: ' + liveSnapshotMd);
  return out;
}

if (require.main === module) { run(); process.exit(0); }
module.exports = { run: run };
