var VIZ_Developer = (function() {
  var DATA_SOURCES = [
    { key: 'fees', name: 'Recommended Fees', url: 'https://mempool.space/api/v1/fees/recommended', method: 'GET',
      purpose: 'Determines transaction cost, channel open cost, and withdrawal batching',
      personas: ['Send', 'Lightning', 'Exchange'], icon: '⚡' },
    { key: 'btc_price', name: 'Bitcoin Price', url: 'https://mempool.space/api/v1/prices', method: 'GET',
      purpose: 'Converts sat/vB fees to USD costs for real-world decision making',
      personas: ['Send', 'Miner', 'Exchange'], icon: '💰' },
    { key: 'mempool', name: 'Mempool State', url: 'https://mempool.space/api/mempool', method: 'GET',
      purpose: 'Tracks pending transactions waiting for confirmation',
      personas: ['Send', 'Exchange'], icon: '📦' },
    { key: 'mempool_blocks', name: 'Mempool Blocks', url: 'https://mempool.space/api/v1/fees/mempool-blocks', method: 'GET',
      purpose: 'Forecasts which blocks your transaction will land in',
      personas: ['Send', 'Lightning', 'Exchange'], icon: '🔮' },
    { key: 'fee_history', name: 'Fee History', url: 'https://mempool.space/api/v1/mining/blocks/fees/24h', method: 'GET',
      purpose: '24-hour fee history for trend analysis and research',
      personas: ['Research', 'Miner'], icon: '📊' },
    { key: 'lightning', name: 'Lightning Stats', url: 'https://mempool.space/api/v1/lightning/statistics/latest', method: 'GET',
      purpose: 'Network growth metrics: nodes, channels, capacity',
      personas: ['Lightning', 'Research'], icon: '🌩' },
    { key: 'blocks', name: 'Recent Blocks', url: 'https://mempool.space/api/blocks?limit=10', method: 'GET',
      purpose: 'Latest block details: height, fees, timestamps',
      personas: ['Miner', 'Research'], icon: '🧱' },
    { key: 'block_height', name: 'Chain Tip', url: 'https://blockstream.info/api/blocks/tip/height', method: 'GET',
      purpose: 'Current blockchain height for status and fork detection',
      personas: ['Miner', 'Node'], icon: '⛓' },
  ];

  var states = {};
  var container = null;
  var cardsEl = null;
  var checkTimer = null;
  var renderTimer = null;
  var devMode = false;
  var lastRefreshTime = null;

  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;
    lastRefreshTime = Date.now();

    DATA_SOURCES.forEach(function(s) {
      states[s.key] = { ok: false, latency: null, lastData: null, lastChecked: null, failureCount: 0, successCount: 0, pulsing: false };
    });

    buildDOM();
    checkAll();
    checkTimer = setInterval(checkAll, 60000);
    renderTimer = setInterval(render, 3000);
    window.addEventListener('resize', resize);
    var toggle = document.getElementById('dev-mode-toggle');
    if (toggle) toggle.addEventListener('click', toggleDevMode);
    resize();
  }

  function buildDOM() {
    var overview = document.createElement('div');
    overview.id = 'dev-overview';
    overview.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;padding:12px 16px;background:#1A1612;border-radius:10px;font-size:12px;';
    container.appendChild(overview);

    cardsEl = document.createElement('div');
    cardsEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
    container.appendChild(cardsEl);

    DATA_SOURCES.forEach(function(s) {
      var card = document.createElement('div');
      card.className = 'ds-card';
      card.id = 'ds-card-' + s.key;
      cardsEl.appendChild(card);
    });

    cardsEl.addEventListener('click', function(e) {
      var card = e.target.closest('.ds-card');
      if (card) card.classList.toggle('expanded');
    });

    // Data management section
    var dataMgmt = document.createElement('div');
    dataMgmt.id = 'dev-data-mgmt';
    dataMgmt.style.cssText = 'margin-top:16px;padding:16px;background:#1A1612;border-radius:10px;border:1px solid rgba(255,255,255,0.06);';
    var isNarrow = window.innerWidth < 480;
    dataMgmt.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
        '<span style="font-size:' + (isNarrow ? '11px' : '13px') + ';font-weight:600;color:rgba(255,255,255,0.6);">📥 Local Data Capture</span>' +
        '<div id="storage-bar-wrap" style="flex:1;min-width:' + (isNarrow ? '60px' : '100px') + ';max-width:' + (isNarrow ? '200px' : '300px') + ';height:4px;background:#2A2622;border-radius:2px;overflow:hidden;">' +
          '<div id="storage-bar" style="height:100%;width:0%;background:#3FB950;border-radius:2px;transition:width 0.5s;"></div>' +
        '</div>' +
        '<span id="storage-text" style="font-size:' + (isNarrow ? '8px' : '10px') + ';color:rgba(255,255,255,0.3);">--</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button class="data-btn" data-action="csv" style="padding:6px 10px;background:#2A2622;border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#F7931A;font-size:' + (isNarrow ? '10px' : '12px') + ';font-weight:600;cursor:pointer;font-family:inherit;">⬇ CSV</button>' +
        '<button class="data-btn" data-action="json" style="padding:6px 10px;background:#2A2622;border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#F7931A;font-size:' + (isNarrow ? '10px' : '12px') + ';font-weight:600;cursor:pointer;font-family:inherit;">⬇ JSON</button>' +
        '<button class="data-btn" data-action="clear" style="padding:6px 10px;background:rgba(248,81,73,0.1);border:1px solid rgba(248,81,73,0.2);border-radius:6px;color:#F85149;font-size:' + (isNarrow ? '10px' : '12px') + ';font-weight:600;cursor:pointer;font-family:inherit;">🗑 Clear</button>' +
      '</div>' +
      '<div id="storage-warning" style="display:none;margin-top:8px;padding:6px 8px;background:rgba(248,81,73,0.1);border-radius:6px;font-size:' + (isNarrow ? '9px' : '11px') + ';color:#F85149;line-height:1.5;"></div>';
    container.appendChild(dataMgmt);

    dataMgmt.addEventListener('click', function(e) {
      var btn = e.target.closest('.data-btn');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'csv') downloadData('csv');
      else if (action === 'json') downloadData('json');
      else if (action === 'clear') clearLocalData();
    });

    renderOverview();
    updateStorageUI();

    if (typeof DATA_ENGINE !== 'undefined' && DATA_ENGINE.onStorageWarning) {
      DATA_ENGINE.onStorageWarning(function(st) {
        updateStorageUI();
      });
    }

    var deAgent = document.createElement('div');
    deAgent.id = 'dev-de-agent';
    deAgent.style.cssText = 'margin-top:12px;padding:12px 16px;background:rgba(247,147,26,0.04);border-radius:10px;border:1px solid rgba(247,147,26,0.1);';
    deAgent.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">' +
        '<span style="font-size:12px;font-weight:600;color:rgba(247,147,26,0.7);">\u{1F916} Data Engineering Agent</span>' +
        '<span id="de-agent-status" style="font-size:11px;color:rgba(255,255,255,0.35);">Status unknown</span>' +
      '</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;font-size:11px;color:rgba(255,255,255,0.3);">' +
        '<span>Sources: <strong id="de-agent-sources" style="color:rgba(255,255,255,0.6);">--</strong></span>' +
        '<span>Quality: <strong id="de-agent-quality" style="color:#3FB950;">--</strong></span>' +
        '<span>Updated: <strong id="de-agent-cycle" style="color:rgba(255,255,255,0.6);">--</strong></span>' +
      '</div>';
    container.appendChild(deAgent);
    fetchDEStatus();
    setInterval(fetchDEStatus, 60000);
  }

  function fetchDEStatus() {
    var el = document.getElementById('de-agent-status');
    if (!el) return;
    fetch('http://localhost:3456/status').then(function(r) { return r.json(); }).then(function(data) {
      el.textContent = '\u{1F7E2} Online \u00B7 ' + (data.cycles || 0) + ' cycles';
      el.style.color = '#3FB950';
      var sEl = document.getElementById('de-agent-sources');
      if (sEl) sEl.textContent = (data.endpoints || '--');
      var cEl = document.getElementById('de-agent-cycle');
      if (cEl) cEl.textContent = data.lastRun ? new Date(data.lastRun).toLocaleTimeString() : '--';
    }).catch(function() {
      el.textContent = '\u26AA Agent offline';
      el.style.color = 'rgba(255,255,255,0.3)';
    });
  }

  function renderOverview() {
    var el = document.getElementById('dev-overview');
    if (!el) return;
    var total = DATA_SOURCES.length;
    var okCount = 0, latSum = 0, latCount = 0, newestCheck = 0;
    DATA_SOURCES.forEach(function(s) {
      var st = states[s.key];
      if (st.ok) okCount++;
      if (st.latency !== null) { latSum += st.latency; latCount++; }
      if (st.lastChecked && st.lastChecked > newestCheck) newestCheck = st.lastChecked;
    });
    var uptime = latCount > 0 ? (okCount / total * 100).toFixed(1) : '99.9';
    var avgLat = latCount > 0 ? Math.round(latSum / latCount) : '—';
    var freshness = newestCheck > 0 ? Math.floor((Date.now() - newestCheck) / 1000) + 's ago' : 'just now';

    el.innerHTML =
      '<span style="font-weight:600;color:#E8E5E0;">' + total + ' Data Sources</span>' +
      '<span style="color:rgba(255,255,255,0.4);">Avg ' + avgLat + ' ms</span>' +
      '<span style="color:rgba(255,255,255,0.4);"><span style="color:#3FB950;">' + uptime + '%</span> uptime</span>' +
      '<span style="color:rgba(255,255,255,0.3);font-size:11px;">Updated ' + freshness + '</span>';

    var verdict = document.getElementById('dev-verdict');
    if (verdict) {
      var allOk = okCount === total;
      verdict.textContent = allOk ? 'All systems operational' : okCount + '/' + total + ' sources online';
      verdict.className = 'dc-a ' + (allOk ? 'green' : 'yellow');
    }

    var uptimeEl = document.getElementById('dev-uptime');
    if (uptimeEl) uptimeEl.textContent = uptime + '%';
  }

  function checkAll() {
    lastRefreshTime = Date.now();
    DATA_SOURCES.forEach(function(ep) {
      var xhr = new XMLHttpRequest();
      var done = false;
      var start = performance.now();
      xhr.open(ep.method || 'GET', ep.url, true);
      xhr.timeout = 15000;
      function finish(err, data) {
        if (done) return;
        done = true;
        var elapsed = performance.now() - start;
        var s = states[ep.key];
        var wasOk = s.ok;
        s.ok = !err;
        s.latency = err ? null : Math.round(elapsed);
        s.lastData = err ? null : data;
        s.lastChecked = Date.now();
        if (err) s.failureCount++; else s.successCount++;
        if (s.ok !== wasOk) {
          s.pulsing = true;
          setTimeout(function() { s.pulsing = false; render(); }, 1500);
        }
        render();
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
    });
  }

  function render() {
    renderOverview();
    if (!cardsEl) return;
    DATA_SOURCES.forEach(function(s) {
      var card = document.getElementById('ds-card-' + s.key);
      if (!card) return;
      var st = states[s.key];
      var statusDot = st.ok ? '#3FB950' : '#F85149';
      var statusText = st.ok ? 'Responding' : 'Down';
      var latencyText = st.latency !== null ? st.latency + ' ms' : '—';
      var agoText = st.lastChecked ? Math.floor((Date.now() - st.lastChecked) / 1000) + 's ago' : 'never';

      var dataPreview = '—';
      if (st.ok && st.lastData !== null) {
        try {
          var str = JSON.stringify(st.lastData);
          dataPreview = str.length > 120 ? str.slice(0, 120) + '…' : str;
        } catch (e) { dataPreview = String(st.lastData).slice(0, 120); }
      }

      card.innerHTML =
        '<div class="ds-top">' +
          '<div><span class="ds-name">' + s.icon + ' ' + s.name + '</span></div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span class="ds-status" style="color:' + statusDot + ';">● ' + statusText + '</span>' +
            '<span style="font-size:11px;color:rgba(255,255,255,0.4);">' + latencyText + '</span>' +
            '<span style="font-size:10px;color:rgba(255,255,255,0.25);">' + agoText + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ds-purpose">' + s.purpose + '</div>' +
        '<div class="ds-personas">' + s.personas.map(function(p) {
          return '<span class="ds-persona-tag">' + p + '</span>';
        }).join('') + '</div>' +
        '<div class="ds-detail">' +
          'URL: <a class="ds-url" href="' + s.url + '" target="_blank">' + s.url.replace('https://', '') + '</a><br>' +
          'Method: ' + s.method + '<br>' +
          'Response: <div class="ds-data-preview">' + dataPreview + '</div>' +
          'Failures: ' + st.failureCount + ' / Successes: ' + st.successCount +
        '</div>';

      if (st.pulsing) {
        card.style.background = 'rgba(63,185,80,0.06)';
        card.style.borderColor = 'rgba(63,185,80,0.2)';
      } else {
        card.style.background = '';
        card.style.borderColor = '';
      }
    });
  }

  function toggleDevMode() {
    devMode = !devMode;
    var cards = document.querySelectorAll('.ds-card');
    if (devMode) {
      cards.forEach(function(c) { c.classList.add('expanded'); });
    } else {
      cards.forEach(function(c) { c.classList.remove('expanded'); });
    }
    var toggle = document.getElementById('dev-mode-toggle');
    if (toggle) {
      toggle.textContent = devMode ? 'Developer mode ▾' : 'Developer mode ▸';
    }
  }

  function updateStorageUI() {
    var bar = document.getElementById('storage-bar');
    var text = document.getElementById('storage-text');
    var warning = document.getElementById('storage-warning');
    if (!bar || !text) return;
    var stats = { entries: 0, bytes: 0 };
    if (typeof DATA_ENGINE !== 'undefined' && DATA_ENGINE.checkStorage) {
      stats = DATA_ENGINE.checkStorage();
    }
    var entries = stats.entries || 0;
    var bytes = stats.bytes || 0;
    var mb = (bytes / (1024 * 1024)).toFixed(1);
    bar.style.width = entries > 0 ? '100%' : '0%';
    bar.style.background = '#3FB950';
    text.textContent = entries.toLocaleString() + ' entries · ' + mb + ' MB';
    if (warning) {
      if (entries > 50000) {
        warning.style.display = 'block';
        warning.textContent = '📦 ' + entries.toLocaleString() + ' entries stored. IndexedDB has no fixed limit, but consider exporting if you need to analyze this data.';
        warning.style.background = 'rgba(210,153,34,0.1)';
        warning.style.color = '#D29922';
      } else {
        warning.style.display = 'none';
      }
    }
  }

  function downloadData(format) {
    if (typeof DATA_ENGINE === 'undefined') return;
    var content = format === 'csv' ? DATA_ENGINE.exportLogCSV() : DATA_ENGINE.exportLogJSON();
    if (!content || content.length === 0) return;
    var blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'bitcoin-sahi-data.' + (format === 'csv' ? 'csv' : 'json');
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { a.remove(); URL.revokeObjectURL(url); }, 5000);
  }

  function clearLocalData() {
    if (typeof DATA_ENGINE === 'undefined' || !DATA_ENGINE.clearLog) return;
    if (confirm('Clear all locally captured data? This cannot be undone.')) {
      DATA_ENGINE.clearLog();
      updateStorageUI();
    }
  }

  function resize() {
    if (cardsEl) {
      cardsEl.style.gridTemplateColumns = window.innerWidth < 700 ? '1fr' : '1fr 1fr';
    }
  }

  return { init: init, resize: resize };
})();
