// Bitcoin Sahi Live API — fetches from mempool.space and blockchain.info directly every 60s
// Falls back to daily live_data.json for historical data

var API = (function() {
  var data = null;
  var ready = false;
  var listeners = [];
  var timer = null;
  var retryTimer = null;
  var _debugEl = null;
  var _flashTimer = null;

  function flashDataElements() {
    // Brief visual pulse on all live data elements
    var els = document.querySelectorAll('.live-data, [id^=kpi-], [id^=stat-], [id^=seg-], [id^=fr-], [id^=mk-], [id^=md-], [id^=cc-], [id^=so-], [id^=ex-], [id^=proj-], [id^=fee-], .gauge-fg');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('data-flash');
    }
    if (_flashTimer) clearTimeout(_flashTimer);
    _flashTimer = setTimeout(function() {
      for (var i = 0; i < els.length; i++) {
        els[i].classList.remove('data-flash');
      }
    }, 600);
  }

  function fetchJson(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url + (url.indexOf('?') < 0 ? '?_=' : '&_=') + Date.now(), true);
    xhr.timeout = 10000;
    xhr.onload = function() {
      if (xhr.status === 200) { try { cb(JSON.parse(xhr.responseText)); } catch(e) {} }
    };
    xhr.send();
  }

  function load() {
    var merged = { timestamp: new Date().toISOString(), alerts: [], sources: {} };

    fetchJson('https://mempool.space/api/v1/fees/recommended', function(f) {
      if (f.fastestFee != null) {
        merged.fees = { fastestFee: f.fastestFee, halfHourFee: f.halfHourFee, hourFee: f.hourFee, economyFee: f.economyFee, minimumFee: f.minimumFee };
      }
    });

    fetchJson('https://blockchain.info/ticker', function(t) {
      if (t && t.USD && t.USD.last) { merged.btc_price = t.USD.last; }
    });

    fetchJson('https://mempool.space/api/mempool', function(m) {
      if (m && m.count != null) {
        merged.mempool = { unconfirmed_tx: m.count, vsize: m.vsize || 0, total_fee_sats: m.total_fee || 0 };
      }
    });

    var bhXhr = new XMLHttpRequest();
    bhXhr.open('GET', 'https://blockstream.info/api/blocks/tip/height?_=' + Date.now(), true);
    bhXhr.timeout = 10000;
    bhXhr.onload = function() {
      if (bhXhr.status === 200) {
        var h = parseInt(bhXhr.responseText.trim());
        if (h > 0) { merged.block_height = h; }
      }
    };
    bhXhr.send();

    fetchJson('/tools/live_data.json', function(d) {
      if (d) {
        if (d.fee_history) merged.fee_history = d.fee_history;
        if (d.miners_revenue_24h) merged.miners_revenue_24h = d.miners_revenue_24h;
        if (d.latest_block) merged.latest_block = d.latest_block;
        if (d.bip110_signaling) merged.bip110_signaling = d.bip110_signaling;
        if (!merged.fees) merged.fees = d.fees;
        if (!merged.btc_price) merged.btc_price = d.btc_price;
        if (!merged.mempool) merged.mempool = d.mempool;
        if (!merged.block_height) merged.block_height = d.block_height;
      }
      data = merged;
      ready = true;
      if (_debugEl) _debugEl.textContent = (merged.fees ? merged.fees.fastestFee + '/' + merged.fees.economyFee : '...') + ' sat/vB | ' + (merged.btc_price ? '$' + merged.btc_price : '...');
      for (var i = 0; i < listeners.length; i++) { try { listeners[i](data); } catch(e) {} }
      flashDataElements();
    });
  }

  function startPolling(interval) {
    var pipeTimeout = setTimeout(function() {
      if (!ready) {
        fetchJson('/tools/live_data.json', function(d) {
          if (d) { data = d; ready = true; for (var i = 0; i < listeners.length; i++) { try { listeners[i](data); } catch(e) {} } }
        });
      }
    }, 8000);
    load();
    if (timer) clearInterval(timer);
    timer = setInterval(load, interval);
  }

  return {
    start: function(opts) {
      opts = opts || {};
      startPolling(opts.interval || 60000);
      _debugEl = document.getElementById('api-debug');
    },
    onData: function(cb) {
      listeners.push(cb);
      if (ready && data) { try { cb(data); } catch(e) {} }
    },
    get: function(path) {
      if (!data) return null;
      var parts = path.split('.');
      var val = data;
      for (var i = 0; i < parts.length; i++) {
        if (val == null) return null;
        val = val[parts[i]];
      }
      return val;
    },
    isReady: function() { return ready; },
    getData: function() { return data; }
  };
})();
