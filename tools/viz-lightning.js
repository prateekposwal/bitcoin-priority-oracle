// Vrooom — Lightning Network Stats Visualization
// Reads real-time LN data from DATA_ENGINE, displays stats as HTML cards,
// and draws a network graph on canvas.
// Export: VIZ_Lightning
// Depends on: VIZ (viz-core.js), DATA_ENGINE (data-engine.js)

var VIZ_Lightning = (function() {
  var NODE_COUNT = 50;
  var nodes = [];
  var edges = [];
  var _data = {};
  var density = 0.5;

  function getData() {
    var eng = window.DATA_ENGINE ? DATA_ENGINE.get() : null;
    if (eng && eng.lightning) {
      _data = eng.lightning;
    }
    _data.channel_count = _data.channel_count || 21214;
    _data.node_count = _data.node_count || 6278;
    _data.total_capacity = _data.total_capacity || 2816.03;
    _data.avg_fee_rate = _data.avg_fee_rate || 131;
    _data.avg_base_fee_mtokens = _data.avg_base_fee_mtokens || 350;
    _data.med_capacity = _data.med_capacity || 0.02;
    _data.tor_nodes = _data.tor_nodes || 3201;
    _data.clearnet_nodes = _data.clearnet_nodes || 4914;
    var ch = _data.channel_count || 1;
    var nd = _data.node_count || 1;
    density = Math.min(1, (ch / nd) / 5);
    return _data;
  }

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(Math.round(n));
  }

  function card(label, id, value, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.id = id;
    el.className = 'ln-card';
    el.style.cssText = 'background:#111;border:1px solid #222;border-radius:8px;padding:12px 14px;';
    var l = document.createElement('div');
    l.style.cssText = 'font:9px "SF Mono",Monaco,monospace;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;';
    l.textContent = label;
    var v = document.createElement('div');
    v.className = 'stat-value';
    v.style.cssText = 'font:' + (opts.big ? '28px' : '15px') + ' "SF Mono",Monaco,monospace;color:' + (opts.color || '#F7931A') + ';';
    v.textContent = value;
    el.appendChild(l);
    el.appendChild(v);
    return el;
  }

  function updateCard(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    var v = el.querySelector('.stat-value');
    if (v) v.textContent = value;
  }

  function refresh() {
    var d = getData();
    updateCard('ln-nodes', fmt(d.node_count));
    updateCard('ln-channels', fmt(d.channel_count));
    updateCard('ln-capacity', Number(d.total_capacity).toLocaleString('en-US', {maximumFractionDigits:2}) + '\u00A0BTC');
    updateCard('ln-fee-rate', Number(d.avg_fee_rate).toLocaleString('en-US') + '\u00A0msat');
    updateCard('ln-base-fee', Number(d.avg_base_fee_mtokens).toLocaleString('en-US') + '\u00A0msat');
    updateCard('ln-med-cap', Number(d.med_capacity).toLocaleString('en-US', {maximumFractionDigits:3}) + '\u00A0BTC');
    var tor = d.tor_nodes || 0;
    var clr = d.clearnet_nodes || 0;
    var sum = tor + clr || 1;
    var pct = (tor / sum * 100).toFixed(1);
    updateCard('ln-health', pct + '% Tor\u00A0|\u00A0' + (100 - Number(pct)).toFixed(1) + '% Clr');
  }

  function initNodes(w, h) {
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * w * 0.8 + w * 0.1,
        y: Math.random() * h * 0.8 + h * 0.1,
        vx: 0, vy: 0
      });
    }
  }

  function generateEdges() {
    edges = [];
    var d = getData();
    var ch = d.channel_count || 1;
    var nd = d.node_count || 1;
    var dens = Math.min(1, (ch / nd) / 5);
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if (Math.random() < dens * 0.15) {
          edges.push({ a: i, b: j });
        }
      }
    }
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);

    var d = getData();
    var ch = d.channel_count || 1;
    var nd = d.node_count || 1;
    var dens = Math.min(1, (ch / nd) / 5);

    ctx.lineCap = 'round';
    for (var ei = 0; ei < edges.length; ei++) {
      var e = edges[ei];
      var na = nodes[e.a];
      var nb = nodes[e.b];
      if (!na || !nb) continue;
      var dx = na.x - nb.x;
      var dy = na.y - nb.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var alpha = dens * 0.4 * (1 - Math.min(1, dist / 150));
      ctx.globalAlpha = Math.max(0.05, alpha);
      ctx.strokeStyle = '#F7931A';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var pulse = Math.sin(t * 1.5 + i * 0.7) * 0.15 + 1;
      var r = 3 * pulse;
      var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
      grad.addColorStop(0, '#58A6FF44');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var pulse = Math.sin(t * 1.5 + i * 0.7) * 0.15 + 1;
      var r = 3 * pulse;
      ctx.fillStyle = '#58A6FF';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function init(canvasId) {
    if (document.getElementById('ln-nodes')) return;

    var c = VIZ.create(canvasId, { height: 350 });
    if (!c) return;

    getData();
    initNodes(c.w, c.h);
    generateEdges();

    var parent = c.el.parentElement;
    if (parent) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:12px;align-items:stretch;';
      parent.insertBefore(wrap, c.el);
      wrap.appendChild(c.el);

      var d = getData();

      var left = document.createElement('div');
      left.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:130px;';
      left.appendChild(card('Nodes', 'ln-nodes', fmt(d.node_count), { big: true }));
      left.appendChild(card('Channels', 'ln-channels', fmt(d.channel_count), { big: true }));
      left.appendChild(card('Capacity\u00A0(BTC)', 'ln-capacity', Number(d.total_capacity).toLocaleString('en-US', { maximumFractionDigits: 2 }) + '\u00A0BTC', { big: true }));
      wrap.insertBefore(left, c.el);

      var right = document.createElement('div');
      right.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:140px;';
      right.appendChild(card('Avg Fee Rate', 'ln-fee-rate', Number(d.avg_fee_rate).toLocaleString('en-US') + '\u00A0msat', { color: '#58A6FF' }));
      right.appendChild(card('Avg Base Fee', 'ln-base-fee', Number(d.avg_base_fee_mtokens).toLocaleString('en-US') + '\u00A0msat', { color: '#58A6FF' }));
      right.appendChild(card('Median Channel', 'ln-med-cap', Number(d.med_capacity).toLocaleString('en-US', { maximumFractionDigits: 3 }) + '\u00A0BTC', { color: '#58A6FF' }));
      var tor = d.tor_nodes || 0;
      var clr = d.clearnet_nodes || 0;
      var sum = tor + clr || 1;
      var pct = (tor / sum * 100).toFixed(1);
      right.appendChild(card('Tor\u00A0/\u00A0Clearnet', 'ln-health', pct + '% Tor\u00A0|\u00A0' + (100 - Number(pct)).toFixed(1) + '% Clr', { color: '#58A6FF' }));
      wrap.appendChild(right);
    }

    if (window.DATA_ENGINE) {
      DATA_ENGINE.onUpdate(refresh);
    }

    VIZ.start(canvasId, draw, 50);
  }

  return { init: init };
})();
