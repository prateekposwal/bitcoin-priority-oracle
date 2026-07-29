// Bitcoin Sahi — Shared Application Layer
// Single data source, element registry, animations, error handling

var APP = (function() {
  var data = null;
  var ready = false;
  var listeners = [];
  var registry = []; // { id, path, format, el }
  var ws = null;
  var pollTimer = null;
  var reconnectTimer = null;
  var _loadStart = 0;

  // ── Element Registry ──
  // Pages register: APP.register('kpi-btc', 'btc_price', 'usd')
  function register(id, path, format) {
    registry.push({ id: id, path: path, format: format || 'text', el: null });
  }

  function updateRegistry() {
    for (var i = 0; i < registry.length; i++) {
      var r = registry[i];
      if (!r.el) r.el = document.getElementById(r.id);
      if (!r.el || !data) continue;
      var val = getPath(data, r.path);
      if (val === null || val === undefined) continue;
      r.el.textContent = formatValue(val, r.format);
    }
  }

  function getPath(obj, path) {
    var parts = path.split('.');
    var v = obj;
    for (var i = 0; i < parts.length; i++) {
      if (v === null || v === undefined) return null;
      v = v[parts[i]];
    }
    return v;
  }

  function formatValue(val, format) {
    if (format === 'usd') return '$' + Number(val).toLocaleString('en-US');
    if (format === 'btc') return '$' + Number(val).toLocaleString('en-US');
    if (format === 'fee') return val + ' sat/vB';
    if (format === 'number') return Number(val).toLocaleString('en-US');
    if (format === 'percent') return (val >= 10 ? Math.round(val) : Number(val).toFixed(1)) + '%';
    return String(val);
  }

  // ── Data Fetching ──
  function fetchJson(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url + '?_=' + Date.now(), true);
    xhr.timeout = 10000;
    xhr.onload = function() {
      if (xhr.status === 200) { try { cb(JSON.parse(xhr.responseText)); } catch(e) {} }
    };
    xhr.send();
  }

  function mergeLiveData() {
    var merged = { timestamp: new Date().toISOString() };

    fetchJson('https://mempool.space/api/v1/fees/recommended', function(f) {
      if (f.fastestFee != null) merged.fees = f;
    });

    fetchJson('https://mempool.space/api/v1/prices', function(p) {
      if (p && p.USD) merged.btc_price = p.USD;
    });

    fetchJson('https://mempool.space/api/mempool', function(m) {
      if (m && m.count != null) merged.mempool = { unconfirmed_tx: m.count, vsize: m.vsize, total_fee_sats: m.total_fee, fee_histogram: m.fee_histogram };
    });

    fetchJson('https://mempool.space/api/v1/fees/mempool-blocks', function(mb) {
      if (mb && mb.length) merged.mempool_blocks = mb;
    });

    fetchJson('https://mempool.space/api/v1/difficulty-adjustment', function(da) {
      if (da && da.difficultyChange != null) merged.difficulty = da;
    });

    // Block height
    var bh = new XMLHttpRequest();
    bh.open('GET', 'https://mempool.space/api/blocks/tip/height?_=' + Date.now(), true);
    bh.timeout = 10000;
    bh.onload = function() {
      if (bh.status === 200) {
        var h = parseInt(bh.responseText.trim());
        if (h > 0) merged.block_height = h;
      }
    };
    bh.send();

    // Lightning stats
    fetchJson('https://mempool.space/api/v1/lightning/statistics/latest', function(ln) {
      if (ln && ln.latest) merged.lightning = ln.latest;
    });

    // Pipeline fallback for historical data
    fetchJson('/tools/live_data.json', function(d) {
      if (d) {
        if (d.latest_block) merged.latest_block = d.latest_block;
        if (d.bip110_signaling) merged.bip110_signaling = d.bip110_signaling;
        if (d.miners_revenue_24h) merged.miners_revenue_24h = d.miners_revenue_24h;
        merged.pipeline = true;
      }
      // Merge complete — publish
      data = merged;
      ready = true;
      updateRegistry();
      flashElements();
      for (var i = 0; i < listeners.length; i++) { try { listeners[i](data); } catch(e) {} }
    });
  }

  // ── WebSocket ──
  function connectWebSocket() {
    try {
      ws = new WebSocket('wss://mempool.space/api/v1/ws');
      ws.onopen = function() {
        // Subscribe to live data
        ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'mempool-blocks', 'stats'] }));
      };
      ws.onmessage = function(e) {
        try {
          var msg = JSON.parse(e.data);
          if (data) {
            if (msg.blocks) data.blocks = msg.blocks;
            if (msg['mempool-blocks']) data.mempool_blocks = msg['mempool-blocks'];
            if (msg.fees) data.fees = msg.fees;
            updateRegistry();
            flashElements();
          }
        } catch(e) {}
      };
      ws.onclose = function() {
        setTimeout(connectWebSocket, 5000);
      };
    } catch(e) {}
  }

  // ── Animations ──
  function flashElements() {
    var els = document.querySelectorAll('[data-live], [id^=kpi-], [id^=stat-], [id^=seg-], [id^=fr-]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.remove('data-flash');
      void els[i].offsetWidth;
      els[i].classList.add('data-flash');
    }
  }

  // ── Init ──
  function init() {
    _loadStart = Date.now();

    // Try WebSocket first
    connectWebSocket();

    // REST API polling as primary (WebSocket is bonus)
    mergeLiveData();
    pollTimer = setInterval(mergeLiveData, 5000);

    // Update live indicators every second
    setInterval(function() {
      var indicators = document.querySelectorAll('.live-indicator, .live-clock, #live-ticker');
      var elapsed = Math.floor((Date.now() - _loadStart) / 1000);
      for (var i = 0; i < indicators.length; i++) {
        var el = indicators[i];
        if (!el || el.id === 'live-ticker') continue;
        var txt = el.innerHTML || '';
        if (txt.includes('Live')) {
          el.innerHTML = '<span class=\"live-dot\"></span> Live . ' + (elapsed < 60 ? elapsed + 's' : Math.round(elapsed/60) + 'm') + ' ago';
        }
      }
    }, 1000);
  }

  return {
    init: init,
    onData: function(cb) {
      listeners.push(cb);
      if (ready && data) { try { cb(data); } catch(e) {} }
    },
    register: register,
    get: function(path) { return getPath(data, path); },
    isReady: function() { return ready; },
    getData: function() { return data; }
  };
})();
