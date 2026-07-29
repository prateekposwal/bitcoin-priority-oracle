(function () {
  'use strict';

  var DATA = {
    fees: { fastestFee: 0, halfHourFee: 0, hourFee: 0, economyFee: 0, minimumFee: 0 },
    btc_price: 0,
    mempool: { count: 0, vsize: 0, fee_histogram: [] },
    mempool_blocks: [],
    fee_history: [],
    lightning: { channel_count: 0, node_count: 0, total_capacity: 0 },
    blocks: [],
    block_height: 0,
    last_updated: null,
    listeners: []
  };

  var FETCH_INTERVAL = 60000;
  var timerId = null;

  function api(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 30000;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb(e, null); }
      } else {
        cb(new Error('HTTP ' + xhr.status + ' for ' + url), null);
      }
    };
    xhr.onerror = function () { cb(new Error('Network error for ' + url), null); };
    xhr.ontimeout = function () { cb(new Error('Timeout for ' + url), null); };
    xhr.send();
  }

  function notify() {
    DATA.last_updated = new Date().toISOString();
    for (var i = 0; i < DATA.listeners.length; i++) {
      try { DATA.listeners[i](DATA); } catch (e) { /* swallow */ }
    }
  }

  function fetchAll(cb) {
    var pending = 0;
    var errored = false;

    function wrap(name, handler) {
      pending++;
      return function (err, data) {
        if (errored) return;
        if (err) {
          errored = true;
          cb(err);
          return;
        }
        handler(data);
        pending--;
        if (pending === 0) cb(null);
      };
    }

    api('https://mempool.space/api/v1/fees/recommended', wrap('fees', function (d) {
      DATA.fees = {
        fastestFee: d.fastestFee || 0,
        halfHourFee: d.halfHourFee || 0,
        hourFee: d.hourFee || 0,
        economyFee: d.economyFee || 0,
        minimumFee: d.minimumFee || 0
      };
    }));

    api('https://mempool.space/api/v1/prices', wrap('btc_price', function (d) {
      DATA.btc_price = d.USD || 0;
    }));

    api('https://mempool.space/api/mempool', wrap('mempool', function (d) {
      DATA.mempool = {
        count: d.count || 0,
        vsize: d.vsize || 0,
        fee_histogram: d.fee_histogram || []
      };
    }));

    api('https://mempool.space/api/v1/fees/mempool-blocks', wrap('mempool_blocks', function (d) {
      DATA.mempool_blocks = d || [];
    }));

    api('https://mempool.space/api/v1/mining/blocks/fees/24h', wrap('fee_history', function (d) {
      DATA.fee_history = d || [];
    }));

    api('https://mempool.space/api/v1/lightning/statistics/latest', wrap('lightning', function (d) {
      var stats = d.latest || d;
      DATA.lightning = {
        channel_count: stats.channel_count || stats.channelCount || 0,
        node_count: stats.node_count || stats.nodeCount || 0,
        total_capacity: stats.total_capacity || stats.totalCapacity || 0
      };
    }));

    api('https://mempool.space/api/blocks?limit=10', wrap('blocks', function (d) {
      DATA.blocks = (d || []).map(function (b) {
        return {
          id: b.id,
          height: b.height,
          timestamp: b.timestamp,
          version: b.version,
          bits: b.bits || b.versionBits || null,
          tx_count: b.tx_count || b.txCount || 0,
          size: b.size,
          weight: b.weight,
          fee_span: b.fee_span || b.feeSpan || null,
          avg_fee_rate: b.avg_fee_rate || b.avgFeeRate || null
        };
      });
    }));

    api('https://blockstream.info/api/blocks/tip/height', wrap('block_height', function (d) {
      DATA.block_height = (typeof d === 'number') ? d : parseInt(d, 10) || 0;
    }));

    if (pending === 0) cb(null);
  }

  function start() {
    if (timerId) return;
    fetchAll(function (err) {
      if (err) console.warn('DATA_ENGINE initial fetch error:', err);
      notify();
    });
    timerId = setInterval(function () {
      fetchAll(function (err) {
        if (err) console.warn('DATA_ENGINE refresh error:', err);
        notify();
      });
    }, FETCH_INTERVAL);
  }

  function onUpdate(callback) {
    if (typeof callback === 'function') {
      DATA.listeners.push(callback);
    }
  }

  function get() {
    return DATA;
  }

  function getFeeHistory() {
    return DATA.fee_history;
  }

  window.DATA_ENGINE = {
    start: start,
    onUpdate: onUpdate,
    get: get,
    getFeeHistory: getFeeHistory
  };
})();
