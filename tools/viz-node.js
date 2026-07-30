var VIZ_Node = (function() {
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

  var targetCosts = { hardware: 0, bandwidth: 0, electricity: 0, storage: 0, total: 0 };
  var currentCosts = { hardware: 0, bandwidth: 0, electricity: 0, storage: 0, total: 0 };
  var animating = false;
  var animStart = 0;
  var animDuration = 300;
  var prevCosts = { hardware: 0, bandwidth: 0, electricity: 0, storage: 0, total: 0 };

  function isMobile() {
    return w < 480;
  }

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    if (typeof DATA_ENGINE !== 'undefined') {
      var initPrice = DATA_ENGINE.get().btc_price;
      if (initPrice && initPrice > 0) {
        values.hardware = Math.round(Math.min(2000, Math.max(200, initPrice * 0.025)));
      }
      DATA_ENGINE.onUpdate(function(state) {
        var newPrice = state.btc_price;
        if (newPrice && newPrice > 0) {
          values.hardware = Math.round(Math.min(2000, Math.max(200, newPrice * 0.025)));
          draw();
        }
      });
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
    prevCosts = { hardware: currentCosts.hardware, bandwidth: currentCosts.bandwidth, electricity: currentCosts.electricity, storage: currentCosts.storage, total: currentCosts.total };
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
    targetCosts = { hardware: hw, bandwidth: bw, electricity: elec, storage: storage, total: total };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function updateAnimation() {
    if (!animating) return;
    var elapsed = performance.now() - animStart;
    var t = Math.min(1, elapsed / animDuration);
    var ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    currentCosts.hardware = lerp(prevCosts.hardware, targetCosts.hardware, ease);
    currentCosts.bandwidth = lerp(prevCosts.bandwidth, targetCosts.bandwidth, ease);
    currentCosts.electricity = lerp(prevCosts.electricity, targetCosts.electricity, ease);
    currentCosts.storage = lerp(prevCosts.storage, targetCosts.storage, ease);
    currentCosts.total = lerp(prevCosts.total, targetCosts.total, ease);
    if (t >= 1) {
      currentCosts = { hardware: targetCosts.hardware, bandwidth: targetCosts.bandwidth, electricity: targetCosts.electricity, storage: targetCosts.storage, total: targetCosts.total };
      animating = false;
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  var animT = 0;
  function draw() {
    if (!ctx) return;
    animT += 0.025;
    updateAnimation();

    var c = currentCosts;
    var mobile = isMobile();
    var pulse = Math.sin(animT * 1.5) * 0.04 + 0.96;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillStyle = '#EADCC8';
    ctx.fillText('⬡ Your Node\'s Impact', 30, 14);

    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillStyle = '#6A5D4E';
    ctx.fillText('What running a full Bitcoin node accomplishes', 30, 40);

    var cardW = mobile ? w - 80 : Math.min(200, (w - 80) / 3);
    var cardGap = mobile ? 16 : (w - 80 - cardW * 3) / 2;
    var cardsStartY = 90;

    var cardData = [
      { value: '$924', label: 'Annual Cost', sub: 'hardware + bandwidth + power' },
      { value: '4,426', label: 'Tx/Block', sub: 'avg transactions verified' },
      { value: '960K', label: 'Blocks', sub: 'processed since genesis' }
    ];

    for (var i = 0; i < 3; i++) {
      var cx = mobile ? 40 : 40 + i * (cardW + cardGap);
      var cy = mobile ? cardsStartY + i * 90 : cardsStartY;
      var glow = Math.sin(animT * 1.2 + i * 2.1) * 3 + 4;

      ctx.fillStyle = '#231F19';
      ctx.strokeStyle = '#3A3228';
      ctx.lineWidth = 1;
      if (i === 2) { ctx.shadowColor = 'rgba(212,147,58,0.08)'; ctx.shadowBlur = glow; }
      roundRect(ctx, cx, cy, cardW, 80, 10);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 28px -apple-system, sans-serif';
      ctx.fillStyle = '#EADCC8';
      ctx.fillText(cardData[i].value, cx + cardW / 2, cy + 30);

      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#6A5D4E';
      ctx.fillText(cardData[i].label, cx + cardW / 2, cy + 58);

      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = '#6A5D4E';
      ctx.fillText(cardData[i].sub, cx + cardW / 2, cy + 72);
    }

    var barY = mobile ? cardsStartY + 3 * 90 + 16 : 200;
    var barH = 36;
    var barPad = 40;
    var barW = w - barPad * 2;

    var segs = [
      { key: 'hardware', label: 'Hardware', color: '#D4933A', cost: c.hardware },
      { key: 'bandwidth', label: 'Bandwidth', color: '#58A6FF', cost: c.bandwidth },
      { key: 'electricity', label: 'Electricity', color: '#3BA35D', cost: c.electricity },
      { key: 'storage', label: 'Storage', color: '#BC8CFF', cost: c.storage }
    ];

    var total = segs.reduce(function(s, seg) { return s + seg.cost; }, 0);
    if (total < 1) total = 1;
    var x = barPad;

    segs.forEach(function(seg) {
      var segW = (seg.cost / total) * barW;
      if (segW < 1 && seg.cost > 0) segW = 1;
      ctx.fillStyle = seg.color;
      ctx.fillRect(x, barY, segW, barH);

      if (segW > 80) {
        ctx.fillStyle = '#1A1612';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$' + Math.round(seg.cost) + ' ' + seg.label, x + segW / 2, barY + barH / 2);
      } else {
        ctx.fillStyle = '#9B8B78';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(seg.label + ' $' + Math.round(seg.cost), x + segW / 2, barY + barH + 4);
      }
      x += segW;
    });

    var textY = mobile ? barY + barH + 36 : 280;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (mobile ? '11px' : '13px') + ' -apple-system, sans-serif';
    ctx.fillStyle = '#9B8B78';
    var lines = [
      'Your node has verified 960,142 blocks and relayed',
      '1.4 billion transactions. Running a full node',
      'strengthens the network\'s security and decentralization.'
    ];
    for (var li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], 40, textY + li * 20);
    }
  }

  function loop() { try { draw(); } catch (e) {}
    requestAnimationFrame(loop);
  }

  function getCosts() {
    var hw = values.hardware / DEPRECIATION_YEARS;
    var bw = values.bandwidth * 12;
    var elec = (values.power * 24 * 365 / 1000) * values.rate;
    var storage = STORAGE_FIXED;
    return { hw: Math.round(hw), bw: Math.round(bw), elec: Math.round(elec), storage: Math.round(storage), total: Math.round(hw + bw + elec + storage) };
  }

  function resize() {
    var r = VIZ.responsiveSize(canvas, 600);
    w = r.w;
    h = r.h;
    ctx = r.ctx;
  }

  return { init: init, resize: resize, getCosts: getCosts };
})();
