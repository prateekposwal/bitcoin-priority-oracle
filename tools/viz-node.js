// Bitcoin Sahi — Interactive Node Cost Breakdown
// Stacked horizontal bar chart showing annual cost of running a Bitcoin node

var VIZ_Node = (function () {
  'use strict';

  var canvas, ctx, w = 0, h = 0;
  var animFrame = null;

  var values = {
    hardware: 500,
    bandwidth: 50,
    power: 150,
    rate: 0.12
  };

  var STORAGE_FIXED = 50;
  var DEPRECIATION_YEARS = 3;

  var COLORS = {
    hardware:    { bg: '#D29922', text: '#1A1612' },
    bandwidth:   { bg: '#58A6FF', text: '#1A1612' },
    electricity: { bg: '#3FB950', text: '#1A1612' },
    storage:     { bg: '#BC8CFF', text: '#1A1612' }
  };

  var SEG_ORDER = ['hardware', 'bandwidth', 'electricity', 'storage'];
  var SEG_LABELS = {
    hardware: 'Hardware',
    bandwidth: 'Bandwidth',
    electricity: 'Electricity',
    storage: 'Storage'
  };

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    try {
      if (typeof DATA_ENGINE !== 'undefined') {
        var btcPrice = DATA_ENGINE.get().btc_price;
        if (btcPrice && btcPrice > 0) {
          values.hardware = Math.round(Math.min(2000, Math.max(200, btcPrice * 0.025)));
        }
      }
    } catch (_) {}

    createControls();
    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  function createControls() {
    var existing = document.getElementById('viz-node-controls');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'viz-node-controls';
    container.style.cssText = 'max-width:800px;margin:16px auto 0;padding:0 20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;';

    var sliderDefs = [
      { id: 'slider-hw', label: 'Hardware Cost',   min: 200, max: 2000, val: values.hardware, step: 50, fmt: function(v) { return '$' + Math.round(v); } },
      { id: 'slider-bw', label: 'Bandwidth',        min: 20,  max: 200,  val: values.bandwidth, step: 5,  fmt: function(v) { return '$' + Math.round(v) + '/mo'; } },
      { id: 'slider-pw', label: 'Power Draw',       min: 30,  max: 300,  val: values.power, step: 5,  fmt: function(v) { return Math.round(v) + 'W'; } },
      { id: 'slider-rate', label: 'Electricity Rate', min: 0.08, max: 0.40, val: values.rate, step: 0.01, fmt: function(v) { return '$' + parseFloat(v).toFixed(2) + '/kWh'; } }
    ];

    sliderDefs.forEach(function(s) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;margin:5px 0;';

      var label = document.createElement('span');
      label.style.cssText = 'width:130px;color:#8B949E;font-size:13px;flex-shrink:0;';
      label.textContent = s.label;

      var slider = document.createElement('input');
      slider.type = 'range';
      slider.id = s.id;
      slider.min = s.min;
      slider.max = s.max;
      slider.value = s.val;
      slider.step = s.step;
      slider.style.cssText = 'flex:1;height:5px;-webkit-appearance:none;appearance:none;background:#30363D;border-radius:3px;outline:none;cursor:pointer;';
      slider.style.background = 'linear-gradient(to right,#58A6FF 0%,#58A6FF ' + ((slider.value - slider.min) / (slider.max - slider.min) * 100) + '%,#30363D ' + ((slider.value - slider.min) / (slider.max - slider.min) * 100) + '%,#30363D 100%)';

      var valSpan = document.createElement('span');
      valSpan.id = s.id + '-val';
      valSpan.style.cssText = 'width:90px;text-align:right;color:#E6EDF3;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;flex-shrink:0;';
      valSpan.textContent = s.fmt(s.val);

      slider.addEventListener('input', function () {
        var v = parseFloat(this.value);
        var key = keyFromId(this.id);
        values[key] = v;
        document.getElementById(this.id + '-val').textContent = sliderDefs.filter(function(d) { return d.id === this.id; }.bind(this))[0].fmt(v);
        var pct = ((v - this.min) / (this.max - this.min)) * 100;
        this.style.background = 'linear-gradient(to right,#58A6FF 0%,#58A6FF ' + pct + '%,#30363D ' + pct + '%,#30363D 100%)';
        draw();
      });

      row.appendChild(label);
      row.appendChild(slider);
      row.appendChild(valSpan);
      container.appendChild(row);
    });

    canvas.parentNode.insertBefore(container, canvas.nextSibling);
  }

  function keyFromId(id) {
    var map = { 'slider-hw': 'hardware', 'slider-bw': 'bandwidth', 'slider-pw': 'power', 'slider-rate': 'rate' };
    return map[id] || 'hardware';
  }

  function computeCosts() {
    var hw = values.hardware / DEPRECIATION_YEARS;
    var bw = values.bandwidth * 12;
    var elec = (values.power * 24 * 365 / 1000) * values.rate;
    var storage = STORAGE_FIXED;
    var total = hw + bw + elec + storage;
    return { hw: hw, bw: bw, elec: elec, storage: storage, total: total };
  }

  function draw() {
    if (!ctx) return;

    var c = computeCosts();

    var segs = SEG_ORDER.map(function (k) {
      return {
        key: k,
        label: SEG_LABELS[k],
        cost: c[k],
        color: COLORS[k]
      };
    }).filter(function (s) { return s.cost > 0; });

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';

    ctx.textBaseline = 'bottom';
    ctx.font = '12px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
    ctx.fillStyle = '#8B949E';
    ctx.fillText('YOUR ANNUAL NODE COST', w / 2, 26);

    ctx.textBaseline = 'middle';
    var totalStr = '$' + c.total.toFixed(0);
    ctx.font = 'bold 50px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
    ctx.fillStyle = '#E6EDF3';
    ctx.fillText(totalStr, w / 2 - 20, 64);

    ctx.font = '18px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
    ctx.fillStyle = '#8B949E';
    ctx.textAlign = 'left';
    ctx.fillText('/ year', w / 2 + ctx.measureText(totalStr).width / 2 + 6, 64);

    var barY = 100;
    var barH = 50;
    var padX = Math.max(40, w * 0.06);
    var availW = w - padX * 2;

    if (availW < 50) { availW = 50; }

    ctx.textAlign = 'center';

    ctx.fillStyle = '#21262D';
    var r = 6;
    ctx.beginPath();
    ctx.moveTo(padX + r, barY);
    ctx.lineTo(padX + availW - r, barY);
    ctx.quadraticCurveTo(padX + availW, barY, padX + availW, barY + r);
    ctx.lineTo(padX + availW, barY + barH - r);
    ctx.quadraticCurveTo(padX + availW, barY + barH, padX + availW - r, barY + barH);
    ctx.lineTo(padX + r, barY + barH);
    ctx.quadraticCurveTo(padX, barY + barH, padX, barY + barH - r);
    ctx.lineTo(padX, barY + r);
    ctx.quadraticCurveTo(padX, barY, padX + r, barY);
    ctx.closePath();
    ctx.fill();

    var x = padX;
    segs.forEach(function (s) {
      var segW = (s.cost / c.total) * availW;
      if (segW < 1) return;

      ctx.fillStyle = s.color.bg;
      ctx.fillRect(x, barY, segW, barH);

      var dollarLabel = '$' + s.cost.toFixed(0);

      if (segW > 70) {
        ctx.font = 'bold 14px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
        ctx.fillStyle = s.color.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dollarLabel, x + segW / 2, barY + barH / 2);

        ctx.font = '10px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
        ctx.fillStyle = s.color.text;
        ctx.globalAlpha = 0.7;
        ctx.fillText(s.label, x + segW / 2, barY + barH / 2 + 16);
        ctx.globalAlpha = 1;
      } else {
        ctx.font = 'bold 12px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
        ctx.fillStyle = '#8B949E';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(dollarLabel, x + 2, barY + barH + 6);
      }

      x += segW;
    });

    var legendY = barY + barH + 28;
    var legendX = padX;
    var legendGap = 24;

    segs.forEach(function (s) {
      ctx.fillStyle = s.color.bg;
      ctx.beginPath();
      ctx.arc(legendX + 5, legendY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '12px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8B949E';
      ctx.fillText(s.label, legendX + 14, legendY);

      legendX += ctx.measureText(s.label).width + legendGap + 24;

      if (legendX > w - padX) {
        legendY += 22;
        legendX = padX;
      }
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '12px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif';
    ctx.fillStyle = 'rgba(139,148,158,0.45)';
    ctx.fillText('Adjust the sliders to match your setup', w / 2, h - 12);
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var cw = rect.width || canvas.clientWidth || 800;
    if (cw !== w) {
      canvas.width = cw;
      w = cw;
    }
    canvas.height = 350;
    h = 350;
    if (ctx) draw();
  }

  return { init: init };
})();
