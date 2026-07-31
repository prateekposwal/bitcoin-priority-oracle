#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var STATE_FILE = path.join(__dirname, '..', '..', 'captured-data', 'seen-state.json');

function sha1(s) { return crypto.createHash('sha1').update(s).digest('hex'); }

function defaultState() {
  return { version: 1, updated_at: new Date().toISOString(), pages: {}, items: {} };
}

function load() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      var s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (!s.pages) s.pages = {};
      if (!s.items) s.items = {};
      return s;
    }
  } catch (e) {}
  return defaultState();
}

function save(state) {
  state.updated_at = new Date().toISOString();
  var dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  var tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

function pageFresh(kind, key, ttlMs) {
  var state = load();
  var rec = state.pages[kind + ':' + key];
  if (!rec || !rec.last_scanned) return false;
  return Date.now() - new Date(rec.last_scanned).getTime() < (ttlMs || 0);
}

function markPageScanned(kind, key, meta) {
  var state = load();
  var k = kind + ':' + key;
  var prev = state.pages[k] || {};
  state.pages[k] = Object.assign({ last_scanned: new Date().toISOString(), hits: (prev.hits || 0) + (meta && meta.hits ? meta.hits : 0) }, meta || {});
  save(state);
  return state.pages[k];
}

function itemSeen(kind, key) {
  var state = load();
  return !!state.items[kind + ':' + key];
}

function markItem(kind, key, action) {
  var state = load();
  var k = kind + ':' + key;
  var prev = state.items[k];
  var now = new Date().toISOString();
  state.items[k] = {
    first_seen: prev ? prev.first_seen : now,
    last_seen: now,
    action: action || 'discovered',
    attempts: (prev ? prev.attempts : 0) + (action === 'attempted' ? 1 : 0)
  };
  save(state);
  return state.items[k];
}

function itemState(kind, key) {
  var state = load();
  return state.items[kind + ':' + key] || null;
}

function prune(ttlDays) {
  var state = load();
  var cutoff = Date.now() - (ttlDays || 30) * 24 * 3600 * 1000;
  Object.keys(state.items).forEach(function(k) {
    var rec = state.items[k];
    if (new Date(rec.last_seen).getTime() < cutoff) delete state.items[k];
  });
  Object.keys(state.pages).forEach(function(k) {
    var rec = state.pages[k];
    if (new Date(rec.last_scanned).getTime() < cutoff) delete state.pages[k];
  });
  save(state);
  return { items: Object.keys(state.items).length, pages: Object.keys(state.pages).length };
}

function stats() {
  var state = load();
  var byAction = {};
  Object.keys(state.items).forEach(function(k) { var a = state.items[k].action; byAction[a] = (byAction[a] || 0) + 1; });
  return { pages: Object.keys(state.pages).length, items: Object.keys(state.items).length, byAction: byAction, updated_at: state.updated_at };
}

// --- CLI ---
if (require.main === module) {
  var cmd = process.argv[2];
  var kind = process.argv[3];
  var key = process.argv[4];
  var extra = process.argv[5];

  if (cmd === 'page-fresh' && kind && key) {
    var ttl = parseInt(process.argv[5] || '0', 10);
    if (!ttl) ttl = parseInt(process.argv[6] || '0', 10);
    process.stdout.write(pageFresh(kind, key, ttl) ? '1' : '0');
  } else if (cmd === 'page-mark' && kind && key) {
    markPageScanned(kind, key, {});
    process.stdout.write('ok');
  } else if (cmd === 'item-seen' && kind && key) {
    process.stdout.write(itemSeen(kind, key) ? '1' : '0');
  } else if (cmd === 'item-mark' && kind && key) {
    markItem(kind, key, extra || 'discovered');
    process.stdout.write('ok');
  } else if (cmd === 'stats') {
    process.stdout.write(JSON.stringify(stats()));
  } else if (cmd === 'prune') {
    process.stdout.write(JSON.stringify(prune(parseInt(extra || '30', 10))));
  } else {
    console.log('usage: node seen-state.js <page-fresh|page-mark|item-seen|item-mark|stats|prune> <kind> <key> [ttl|action]');
    process.exit(1);
  }
}

module.exports = { load: load, save: save, pageFresh: pageFresh, markPageScanned: markPageScanned, itemSeen: itemSeen, markItem: markItem, itemState: itemState, prune: prune, stats: stats, sha1: sha1, STATE_FILE: STATE_FILE };
