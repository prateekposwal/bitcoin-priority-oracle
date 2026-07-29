var VIZ_Developer = (function() {
  var ENDPOINTS = [
    { key: 'fees',           url: 'https://mempool.space/api/v1/fees/recommended',         method: 'GET' },
    { key: 'btc_price',      url: 'https://mempool.space/api/v1/prices',                   method: 'GET' },
    { key: 'mempool',        url: 'https://mempool.space/api/mempool',                     method: 'GET' },
    { key: 'mempool_blocks', url: 'https://mempool.space/api/v1/fees/mempool-blocks',      method: 'GET' },
    { key: 'fee_history',    url: 'https://mempool.space/api/v1/mining/blocks/fees/24h',   method: 'GET' },
    { key: 'lightning',      url: 'https://mempool.space/api/v1/lightning/statistics/latest', method: 'GET' },
    { key: 'blocks',         url: 'https://mempool.space/api/blocks?limit=10',             method: 'GET' },
    { key: 'block_height',   url: 'https://blockstream.info/api/blocks/tip/height',        method: 'GET' }
  ];

  var states = {};
  var container = null;
  var gridEl = null;
  var checkTimer = null;
  var refreshTimer = null;

  var FRESH_THRESHOLD = 120000;
  var CHECK_INTERVAL = 60000;
  var PULSE_DURATION = 1500;

  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;

    ENDPOINTS.forEach(function(ep) {
      states[ep.key] = {
        ok: false,
        latency: null,
        lastData: null,
        lastChecked: null,
        pulsing: false
      };
    });

    var title = document.createElement('h3');
    title.textContent = 'API Endpoint Status';
    Object.assign(title.style, {
      fontSize: '15px',
      fontWeight: '700',
      color: '#E8E5E0',
      margin: '0 0 12px 0'
    });
    container.appendChild(title);

    gridEl = document.createElement('div');
    gridEl.style.cssText =
      'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;';
    container.appendChild(gridEl);

    ENDPOINTS.forEach(function(ep) {
      var card = document.createElement('div');
      card.id = 'dev-card-' + ep.key;
      card.style.cssText =
        'background:#2A2622;border-radius:10px;padding:14px;transition:background 0.3s;' +
        'border:1px solid transparent;position:relative;overflow:hidden;';
      gridEl.appendChild(card);
    });

    var footer = document.createElement('div');
    footer.textContent = 'All endpoints are free, no auth required.';
    Object.assign(footer.style, {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.35)',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '4px 0 2px 0'
    });
    container.appendChild(footer);

    render();
    checkAll();
    checkTimer = setInterval(checkAll, CHECK_INTERVAL);
    refreshTimer = setInterval(render, 3000);

    var resizeObserver = new ResizeObserver(function() {
      render();
    });
    resizeObserver.observe(container);
  }

  function xhrProbe(ep, cb) {
    var xhr = new XMLHttpRequest();
    var done = false;
    var start = performance.now();

    xhr.open('GET', ep.url, true);
    xhr.timeout = 15000;

    function finish(err, data) {
      if (done) return;
      done = true;
      var elapsed = performance.now() - start;
      cb(err, data, elapsed);
    }

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { finish(null, JSON.parse(xhr.responseText)); }
        catch (e) { finish(null, xhr.responseText); }
      } else {
        finish(new Error('HTTP ' + xhr.status), null);
      }
    };
    xhr.onerror = function() { finish(new Error('Network error'), null); };
    xhr.ontimeout = function() { finish(new Error('Timeout'), null); };
    xhr.send();
  }

  function checkAll() {
    ENDPOINTS.forEach(function(ep) {
      xhrProbe(ep, function(err, data, elapsed) {
        var s = states[ep.key];
        var wasOk = s.ok;
        s.ok = !err;
        s.latency = err ? null : Math.round(elapsed);
        s.lastData = err ? null : data;
        s.lastChecked = Date.now();

        if (s.ok !== wasOk || (s.ok && elapsed < 1000)) {
          s.pulsing = true;
          setTimeout(function() { s.pulsing = false; render(); }, PULSE_DURATION);
        }

        render();
      });
    });
  }

  function render() {
    if (!gridEl) return;

    ENDPOINTS.forEach(function(ep) {
      var card = document.getElementById('dev-card-' + ep.key);
      if (!card) return;
      var s = states[ep.key];

      var methodColor = '#F7931A';

      var statusClass = s.ok ? '#3FB950' : '#F85149';
      var pulseBg = s.pulsing ? 'rgba(63,185,80,0.08)' : 'transparent';
      var pulseBorder = s.pulsing ? '1px solid rgba(63,185,80,0.25)' : '1px solid transparent';

      var dataPreview = '—';
      if (s.ok && s.lastData !== null) {
        try {
          var str = JSON.stringify(s.lastData);
          dataPreview = str.length > 80 ? str.slice(0, 80) + '…' : str;
        } catch (e) {
          dataPreview = String(s.lastData).slice(0, 80);
        }
      }

      var latencyText = s.latency !== null ? s.latency + ' ms' : '—';

      card.innerHTML =
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="font-size:12px;font-weight:600;color:#E8E5E0;font-family:monospace;word-break:break-all;line-height:1.3;flex:1;min-width:0;padding-right:8px;">' +
            ep.url.replace('https://', '') +
          '</div>' +
          '<span style="font-size:10px;font-weight:700;color:' + methodColor + ';background:' + methodColor + '15;padding:2px 6px;border-radius:4px;white-space:nowrap;flex-shrink:0;">' + ep.method + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">' +
          '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + statusClass + ';box-shadow:0 0 4px ' + statusClass + ';"></span>' +
          '<span style="font-size:11px;color:' + (s.ok ? '#3FB950' : '#F85149') + ';font-weight:500;">' + (s.ok ? 'Responding' : 'Down') + '</span>' +
          '<span style="font-size:11px;color:rgba(255,255,255,0.45);">' + latencyText + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.35);font-family:monospace;background:#1A1612;border-radius:4px;padding:5px 7px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;max-height:36px;word-break:break-all;">' +
          dataPreview +
        '</div>';

      card.style.background = pulseBg;
      card.style.borderColor = pulseBorder;
    });
  }

  function resize() {}

  return { init: init, resize: resize };
})();
