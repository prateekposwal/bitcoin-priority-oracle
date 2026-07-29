var VIZ_Node = (function() {
  var canvas, ctx, w = 0, h = 0;
  var animFrame = null;
  var pulseTime = 0;

  var values = {
    hardware: 500,
    bandwidth: 50,
    power: 150,
    rate: 0.12
  };

  var STORAGE_FIXED = 50;
  var DEPRECIATION_YEARS = 3;

  var COLORS = {
    hardware: '#F7931A',
    bandwidth: '#58A6FF',
    electricity: '#3FB950',
    storage: '#BC8CFF'
  };

  var SEG_ORDER = ['hardware', 'bandwidth', 'electricity', 'storage'];
  var SEG_LABELS = {
    hardware: 'Hardware',
    bandwidth: 'Bandwidth',
    electricity: 'Electricity',
    storage: 'Storage'
  };

  var targetCosts = { hw: 0, bw: 0, elec: 0, storage: 0, total: 0 };
  var currentCosts = { hw: 0, bw: 0, elec: 0, storage: 0, total: 0 };
  var animating = false;
  var animStart = 0;
  var animDuration = 300;
  var prevCosts = { hw: 0, bw: 0, elec: 0, storage: 0, total: 0 };

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    if (typeof DATA_ENGINE !== 'undefined') {
      var btcPrice = DATA_ENGINE.get().btc_price;
      if (btcPrice && btcPrice > 0) {
        values.hardware = Math.round(Math.min(2000, Math.max(200, btcPrice * 0.025)));
      }
    }

    createControls();
    resize();
    window.addEventListener('resize', resize);
    computeTarget();
    for (var k in targetCosts) currentCosts[k] = targetCosts[k];
    loop();
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

      slider.addEventListener('input', function() {
        var v = parseFloat(this.value);
        var key = keyFromId(this.id);
        values[key] = v;
        document.getElementById(this.id + '-val').textContent = s.fmt(v);
        var pct = ((v - this.min) / (this.max - this.min)) * 100;
        this.style.background = 'linear-gradient(to right,#58A6FF 0%,#58A6FF ' + pct + '%,#30363D ' + pct + '%,#30363D 100%)';
        onSliderChange();
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

  function onSliderChange() {
    prevCosts = { hw: currentCosts.hw, bw: currentCosts.bw, elec: currentCosts.elec, storage: currentCosts.storage, total: currentCosts.total };
    computeTarget();
    animStart = performance.now();
    animating = true;
  }

  function computeTarget() {
    var hw = values.hardware / DEPRECIATION_YEARS;
    var bw = values.bandwidth * 12;
    var elec = (values.power * 24 * 365 / 1000) * values.rate;
    var storage = STORAGE_FIXED;
    var total = hw + bw + elec + storage;
    targetCosts = { hw: hw, bw: bw, elec: elec, storage: storage, total: total };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function updateAnimation() {
    if (!animating) return;
    var elapsed = performance.now() - animStart;
    var t = Math.min(1, elapsed / animDuration);
    var ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    currentCosts.hw = lerp(prevCosts.hw, targetCosts.hw, ease);
    currentCosts.bw = lerp(prevCosts.bw, targetCosts.bw, ease);
    currentCosts.elec = lerp(prevCosts.elec, targetCosts.elec, ease);
    currentCosts.storage = lerp(prevCosts.storage, targetCosts.storage, ease);
    currentCosts.total = lerp(prevCosts.total, targetCosts.total, ease);
    if (t >= 1) {
      currentCosts = { hw: targetCosts.hw, bw: targetCosts.bw, elec: targetCosts.elec, storage: targetCosts.storage, total: targetCosts.total };
      animating = false;
    }
  }

  function draw() {
    if (!ctx) return;
    updateAnimation();

    var c = currentCosts;
    pulseTime += 0.02;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    var segs = SEG_ORDER.map(function(k) {
      return {
        key: k,
        label: SEG_LABELS[k],
        cost: c[k],
        color: COLORS[k]
      };
    }).filter(function(s) { return s.cost > 0; });

    var totalCost = c.total || 1;
    var cx = w / 2;
    var cy = h / 2 - 20;
    var outerR = Math.min(w, h) * 0.3;
    var innerR = outerR * 0.55;
    var pulse = 1 + Math.sin(pulseTime) * 0.008;
    outerR *= pulse;

    var startAngle = -Math.PI / 2;
    var glowGap = 0.04;

    segs.forEach(function(s, idx) {
      var segAngle = (s.cost / totalCost) * Math.PI * 2;
      if (segAngle < 0.001) return;

      var endAngle = startAngle + segAngle - glowGap;

      ctx.save();
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();

      startAngle += segAngle;
    });

    var centerGlow = ctx.createRadialGradient(cx, cy, innerR * 0.1, cx, cy, innerR * 0.9);
    centerGlow.addColorStop(0, 'rgba(26,22,18,0)');
    centerGlow.addColorStop(1, 'rgba(26,22,18,0.6)');
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 34px -apple-system, sans-serif';
    ctx.fillStyle = '#E6EDF3';
    ctx.fillText('$' + totalCost.toFixed(0), cx, cy + 4);

    ctx.textBaseline = 'top';
    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillStyle = '#8B949E';
    ctx.fillText('/ year', cx, cy + 8);

    var labelR = outerR + 28;
    startAngle = -Math.PI / 2;
    segs.forEach(function(s) {
      var segAngle = (s.cost / totalCost) * Math.PI * 2;
      if (segAngle < 0.001) return;
      var midAngle = startAngle + segAngle / 2;
      var lx = cx + Math.cos(midAngle) * labelR;
      var ly = cy + Math.sin(midAngle) * labelR;

      ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('$' + s.cost.toFixed(0), lx, ly);
      startAngle += segAngle;
    });

    var legendY = cy + outerR + 60;
    var legendX = cx - 180;
    var itemHeight = 20;
    var colW = 180;

    segs.forEach(function(s, idx) {
      var col = Math.floor(idx / 2);
      var row = idx % 2;
      var lx = legendX + col * colW;
      var ly = legendY + row * itemHeight;

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(lx + 6, ly + 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillStyle = '#8B949E';
      ctx.fillText(s.label, lx + 16, ly + 6);

      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.fillStyle = '#E6EDF3';
      ctx.textAlign = 'right';
      ctx.fillText('$' + s.cost.toFixed(0), lx + colW - 10, ly + 6);
    });
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  function resize() {
    var r = VIZ.responsiveSize(canvas, 600);
    w = r.w;
    h = r.h;
    ctx = r.ctx;
  }

  return { init: init, resize: resize };
})();
