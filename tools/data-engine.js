var DATA_ENGINE = (function () {
  'use strict';

  var DATA = {
    fees: { fastestFee: 0, halfHourFee: 0, hourFee: 0, economyFee: 0, minimumFee: 0 },
    btc_price: 0,
    mempool: { count: 0, vsize: 0, fee_histogram: [] },
    mempool_blocks: [],
    fee_history: [],
    lightning: { channel_count: 0, node_count: 0, total_capacity: 0, avg_fee_rate: 0 },
    blocks: [],
    block_height: 0,
    last_updated: null
  };

  var listeners = [];
  var timer = null;
  var FETCH_INTERVAL = 60000;

  var ENDPOINTS = [
    { key: 'fees',            url: 'https://mempool.space/api/v1/fees/recommended' },
    { key: 'btc_price',       url: 'https://mempool.space/api/v1/prices' },
    { key: 'mempool',         url: 'https://mempool.space/api/mempool' },
    { key: 'mempool_blocks',  url: 'https://mempool.space/api/v1/fees/mempool-blocks' },
    { key: 'fee_history',     url: 'https://mempool.space/api/v1/mining/blocks/fees/24h' },
    { key: 'lightning',       url: 'https://mempool.space/api/v1/lightning/statistics/latest' },
    { key: 'blocks',          url: 'https://mempool.space/api/blocks?limit=10' },
    { key: 'block_height',    url: 'https://blockstream.info/api/blocks/tip/height' }
  ];

  function xhrGet(url, cb) {
    var xhr = new XMLHttpRequest();
    var done = false;
    xhr.open('GET', url, true);
    xhr.timeout = 10000;

    function finish(err, data) {
      if (done) return;
      done = true;
      cb(err, data);
    }

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { finish(null, JSON.parse(xhr.responseText)); }
        catch (e) { finish(e, null); }
      } else {
        finish(new Error('HTTP ' + xhr.status), null);
      }
    };
    xhr.onerror = function () { finish(new Error('Network error'), null); };
    xhr.ontimeout = function () { finish(new Error('Timeout'), null); };
    xhr.send();
  }

  function normalize(key, raw) {
    switch (key) {
      case 'fees':
        DATA.fees = {
          fastestFee: raw.fastestFee || 0,
          halfHourFee: raw.halfHourFee || 0,
          hourFee: raw.hourFee || 0,
          economyFee: raw.economyFee || 0,
          minimumFee: raw.minimumFee || 0
        };
        break;
      case 'btc_price':
        DATA.btc_price = raw.USD || 0;
        break;
      case 'mempool':
        DATA.mempool = {
          count: raw.count || 0,
          vsize: raw.vsize || 0,
          fee_histogram: Array.isArray(raw.fee_histogram) ? raw.fee_histogram : []
        };
        break;
      case 'mempool_blocks':
        DATA.mempool_blocks = Array.isArray(raw) ? raw : [];
        break;
      case 'fee_history':
        DATA.fee_history = Array.isArray(raw) ? raw : [];
        break;
      case 'lightning':
        var s = raw.latest || raw;
        DATA.lightning = {
          channel_count: s.channel_count || s.channelCount || 0,
          node_count: s.node_count || s.nodeCount || 0,
          total_capacity: s.total_capacity || s.totalCapacity || 0,
          avg_fee_rate: s.avg_fee_rate || s.avgFeeRate || 0
        };
        break;
      case 'blocks':
        DATA.blocks = (Array.isArray(raw) ? raw : []).map(function (b) {
          return {
            id: b.id || null,
            height: b.height || 0,
            timestamp: b.timestamp || 0,
            version: b.version || 0,
            bits: b.bits || null,
            tx_count: b.tx_count || b.txCount || 0,
            size: b.size || 0,
            weight: b.weight || 0,
            fee_span: b.fee_span || b.feeSpan || null,
            avg_fee: b.avg_fee || b.avgFee || null,
            avg_fee_rate: b.avg_fee_rate || b.avgFeeRate || null
          };
        });
        break;
      case 'block_height':
        DATA.block_height = (typeof raw === 'number') ? raw : parseInt(raw, 10) || 0;
        break;
    }
  }

  function notify() {
    DATA.last_updated = new Date().toISOString();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](DATA); } catch (e) { /* swallow */ }
    }
  }

  function fetchAll() {
    var remaining = ENDPOINTS.length;

    function done(err, key, raw) {
      if (err) {
        console.warn('DATA_ENGINE [' + key + ']', err.message);
      } else {
        normalize(key, raw);
      }
      remaining--;
      if (remaining === 0) notify();
    }

    for (var i = 0; i < ENDPOINTS.length; i++) {
      (function (ep) {
        xhrGet(ep.url, function (err, result) {
          done(err, ep.key, result);
        });
      })(ENDPOINTS[i]);
    }
  }

  function start() {
    if (timer) return;
    fetchAll();
    timer = setInterval(fetchAll, FETCH_INTERVAL);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  var LOG_KEY = 'bsahi_data_log';
  var MAX_LOG_ENTRIES = 50000;
  var BYTES_PER_ENTRY = 1024;
  var MAX_STORAGE_BYTES = 4500000;
  var storageListeners = [];

  function minimizeEntry(key, raw) {
    var m = { t: Date.now(), k: key, d: {} };
    switch (key) {
      case 'fees':
        m.d = { fr: raw.fastestFee, hf: raw.halfHourFee, hr: raw.hourFee, ec: raw.economyFee, mn: raw.minimumFee };
        break;
      case 'btc_price':
        m.d = { p: raw.USD || 0 };
        break;
      case 'mempool':
        m.d = { c: raw.count || 0, v: raw.vsize || 0 };
        break;
      case 'mempool_blocks':
        m.d = { n: Array.isArray(raw) ? raw.length : 0 };
        break;
      case 'fee_history':
        m.d = { n: Array.isArray(raw) ? raw.length : 0, l: raw.length > 0 ? (raw[raw.length-1].avgFees || 0) : 0 };
        break;
      case 'lightning':
        var s = raw.latest || raw;
        m.d = { nc: s.node_count || s.nodeCount || 0, cc: s.channel_count || s.channelCount || 0, cap: s.total_capacity || s.totalCapacity || 0 };
        break;
      case 'blocks':
        m.d = { n: Array.isArray(raw) ? raw.length : 0, h: raw.length > 0 ? (raw[0].height || 0) : 0 };
        break;
      case 'block_height':
        m.d = { h: (typeof raw === 'number') ? raw : parseInt(raw, 10) || 0 };
        break;
      default:
        m.d = {};
    }
    return m;
  }

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function estimatedBytes(log) {
    try { return new Blob([JSON.stringify(log)]).size; } catch (e) { return log.length * BYTES_PER_ENTRY; }
  }

  function saveLog(log) {
    try {
      while (log.length > MAX_LOG_ENTRIES) log.shift();
      var est = estimatedBytes(log);
      while (est > MAX_STORAGE_BYTES && log.length > 100) {
        log.splice(0, Math.floor(log.length / 10));
        est = estimatedBytes(log);
      }
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch (e) { /* storage full — aggressively trim */ }
  }

  function appendToLog(key, raw) {
    var entry = minimizeEntry(key, raw);
    var log = loadLog();
    log.push(entry);
    saveLog(log);
  }

  function onUpdate(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  function onStorageWarning(callback) {
    if (typeof callback === 'function') storageListeners.push(callback);
  }

  function get() {
    return DATA;
  }

  function getLog() {
    return loadLog();
  }

  function clearLog() {
    try { localStorage.removeItem(LOG_KEY); } catch (e) {}
  }

  function checkStorage() {
    var log = loadLog();
    var est = estimatedBytes(log);
    var pct = Math.round((est / MAX_STORAGE_BYTES) * 100);
    var quota = 0;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function(q) {
        quota = Math.round(q.usage / q.quota * 100);
        for (var i = 0; i < storageListeners.length; i++) {
          try { storageListeners[i]({ used: est, max: MAX_STORAGE_BYTES, pct: pct, quotaPct: quota }); } catch (e) {}
        }
      }).catch(function() {});
    }
    return { used: est, max: MAX_STORAGE_BYTES, pct: pct };
  }

  function getLogStats() {
    var log = loadLog();
    if (log.length === 0) return { entries: 0, firstEntry: null, days: 0, keys: {}, storage: checkStorage() };
    var first = log[0].t;
    var keys = {};
    for (var i = 0; i < log.length; i++) {
      var k = log[i].k;
      keys[k] = (keys[k] || 0) + 1;
    }
    return {
      entries: log.length,
      firstEntry: first,
      days: Math.round((Date.now() - first) / 86400000 * 10) / 10,
      keys: keys,
      storage: checkStorage()
    };
  }

  function exportLogCSV() {
    var log = loadLog();
    if (log.length === 0) return '';
    var csv = 'timestamp,source,data\n';
    for (var i = 0; i < log.length; i++) {
      var e = log[i];
      var dateStr = new Date(e.t).toISOString();
      var dataStr = JSON.stringify(e.d).replace(/"/g, '""');
      csv += dateStr + ',' + e.k + ',"' + dataStr + '"\n';
      if (csv.length > 5000000) break;
    }
    return csv;
  }

  function exportLogJSON() {
    return JSON.stringify(loadLog(), null, 2);
  }

  var originalNormalize = normalize;
  normalize = function(key, raw) {
    originalNormalize(key, raw);
    appendToLog(key, raw);
  };

  return {
    start: start, stop: stop, onUpdate: onUpdate, get: get,
    getLog: getLog, clearLog: clearLog, getLogStats: getLogStats,
    exportLogCSV: exportLogCSV, exportLogJSON: exportLogJSON,
    checkStorage: checkStorage, onStorageWarning: onStorageWarning
  };
})();
