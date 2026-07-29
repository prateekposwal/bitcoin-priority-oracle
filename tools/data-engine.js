(function () {
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
  var FETCH_INTERVAL = 60000;
  var TIMEOUT = 10000;
  var timerId = null;

  var ENDPOINTS = [
    { key: 'fees', url: 'https://mempool.space/api/v1/fees/recommended' },
    { key: 'btc_price', url: 'https://mempool.space/api/v1/prices' },
    { key: 'mempool', url: 'https://mempool.space/api/mempool' },
    { key: 'mempool_blocks', url: 'https://mempool.space/api/v1/fees/mempool-blocks' },
    { key: 'fee_history', url: 'https://mempool.space/api/v1/mining/blocks/fees/24h' },
    { key: 'lightning', url: 'https://mempool.space/api/v1/lightning/statistics/latest' },
    { key: 'blocks', url: 'https://mempool.space/api/blocks?limit=10' },
    { key: 'block_height', url: 'https://blockstream.info/api/blocks/tip/height' }
  ];

  function fetchOne(url, cb) {
    var xhr = new XMLHttpRequest();
    var fired = false;
    xhr.open('GET', url, true);
    xhr.timeout = TIMEOUT;

    function done(err, result) {
      if (fired) return;
      fired = true;
      cb(err, result);
    }

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { done(null, JSON.parse(xhr.responseText)); }
        catch (e) { done(e, null); }
      } else {
        done(new Error('HTTP ' + xhr.status + ' for ' + url), null);
      }
    };
    xhr.onerror = function () { done(new Error('Network error for ' + url), null); };
    xhr.ontimeout = function () { done(new Error('Timeout for ' + url), null); };
    xhr.send();
  }

  function applyEndpoint(key, raw) {
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

  function fetchAll(done) {
    var remaining = ENDPOINTS.length;

    function onComplete(err, key, raw) {
      if (err) {
        console.warn('DATA_ENGINE [' + key + ']', err.message);
      } else {
        applyEndpoint(key, raw);
      }
      remaining--;
      if (remaining === 0 && done) done();
    }

    for (var i = 0; i < ENDPOINTS.length; i++) {
      (function (ep) {
        fetchOne(ep.url, function (err, result) {
          onComplete(err, ep.key, result);
        });
      })(ENDPOINTS[i]);
    }
  }

  function start() {
    if (timerId) return;
    fetchAll(function () {
      notify();
    });
    timerId = setInterval(function () {
      fetchAll(function () {
        notify();
      });
    }, FETCH_INTERVAL);
  }

  function onUpdate(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  function get() {
    return DATA;
  }

  window.DATA_ENGINE = {
    start: start,
    onUpdate: onUpdate,
    get: get
  };
})();
