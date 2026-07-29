// Bitcoin Sahi — Living Fee Waveform + Mempool Flow Tube
// Three ECG-like waveform layers: fastest (red), hour (yellow), economy (green)
// Wave height = fee rate, wave speed = congestion level
// Flow tube particles = mempool transactions (density = congestion)
// Export: VIZ_Fees
// Depends on: VIZ (viz-core.js), APP (app.js)

var VIZ_Fees = (function() {
  var BUF_LEN = 130;
  var H = 400;
  var bufs = { fastest: [], hour: [], economy: [] };
  var vals = { fastestFee: 5, hourFee: 2, economyFee: 1 };
  var mempoolCount = 100000;
  var particles = [];
  var prevVals = {};

  function init(canvasId) {
    var c = VIZ.create(canvasId, { height: H });
    if (!c) return;

    for (var i = 0; i < BUF_LEN; i++) {
      bufs.fastest.push(vals.fastestFee);
      bufs.hour.push(vals.hourFee);
      bufs.economy.push(vals.economyFee);
    }

    prevVals.fastestFee = vals.fastestFee;
    prevVals.hourFee = vals.hourFee;
    prevVals.economyFee = vals.economyFee;

    APP.onData(function(d) {
      if (d.fees) {
        vals.fastestFee = d.fees.fastestFee != null ? d.fees.fastestFee : vals.fastestFee;
        vals.hourFee = d.fees.hourFee != null ? d.fees.hourFee : (d.fees.halfHourFee != null ? d.fees.halfHourFee : vals.hourFee);
        vals.economyFee = d.fees.economyFee != null ? d.fees.economyFee : vals.economyFee;
      }
      if (d.mempool && d.mempool.unconfirmed_tx != null) {
        mempoolCount = d.mempool.unconfirmed_tx;
      }
    });

    VIZ.start(canvasId, draw, 30);
  }

  function pushSample(key, t) {
    var k = key === 'fastest' ? 'fastestFee' : key === 'hour' ? 'hourFee' : 'economyFee';
    var v = vals[k];
    var prev = prevVals[k];
    var congestion = Math.min(1, mempoolCount / 500000);
    var spike = Math.abs(v - prev) > 1 ? 1.2 : 0;
    var heartbeat = Math.sin(t * 2.5 + bufs[key].length * 0.2) * 0.5;
    var fastRipple = Math.sin(t * (4 + congestion * 4) + bufs[key].length * 0.3) * 0.3;
    var live = heartbeat + fastRipple + spike;
    var s = Math.max(0.1, v + live);
    bufs[key].push(s);
    bufs[key].shift();
    prevVals[k] = v;
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);
    h = Math.max(120, h);

    pushSample('fastest', t);
    pushSample('hour', t);
    pushSample('economy', t);

    var maxFee = Math.max(1, vals.fastestFee, vals.hourFee, vals.economyFee);
    var waveH = h * 0.62;

    var layers = [
      { key: 'fastest', color: '#F85149', glow: 'rgba(248,81,73,0.13)', lane: 0.17, label: 'Fastest' },
      { key: 'hour',    color: '#D29922', glow: 'rgba(210,153,34,0.13)', lane: 0.40, label: '1 Hour' },
      { key: 'economy', color: '#3FB950', glow: 'rgba(63,185,80,0.13)', lane: 0.63, label: 'Economy' }
    ];

    for (var li = 0; li < layers.length; li++) {
      drawWave(ctx, w, waveH, layers[li], maxFee, t);
    }

    drawTube(ctx, w, h, t);
  }

  function getVal(key) {
    return key === 'fastest' ? vals.fastestFee : key === 'hour' ? vals.hourFee : vals.economyFee;
  }

  function drawWave(ctx, w, areaH, layer, maxFee, t) {
    var buf = bufs[layer.key];
    var cur = getVal(layer.key);
    var midY = areaH * layer.lane + 22;
    var amp = areaH * 0.055 * (Math.min(cur, maxFee) / maxFee);
    var congestion = Math.min(1, mempoolCount / 500000);
    var freq = 1.8 + congestion * 4;

    ctx.strokeStyle = layer.glow;
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (var i = 0; i < buf.length; i++) {
      var x = (i / (buf.length - 1)) * w;
      var pulse = Math.sin(t * freq + i * 0.17) * amp * 0.55;
      var y = midY + (buf[i] / maxFee - 0.5) * amp * 1.6 + pulse;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j < buf.length; j++) {
      var x2 = (j / (buf.length - 1)) * w;
      var pulse2 = Math.sin(t * freq + j * 0.17) * amp * 0.55;
      var y2 = midY + (buf[j] / maxFee - 0.5) * amp * 1.6 + pulse2;
      if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    ctx.fillStyle = layer.color;
    ctx.font = '10px "SF Mono", Monaco, monospace';
    ctx.fillText(layer.label + ' ' + cur + ' sat/vB', 8, Math.max(14, midY - amp - 10));
  }

  function drawTube(ctx, w, h, t) {
    var tubeY = h * 0.73;
    var tubeH = h * 0.17;
    var congestion = Math.min(1, mempoolCount / 350000);
    var congestionColor = congestion < 0.35 ? '#3FB950' : congestion < 0.65 ? '#D29922' : '#F85149';

    ctx.fillStyle = '#0E0E18';
    VIZ.roundRect(ctx, 0, tubeY, w, tubeH, 6);
    ctx.fill();

    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 1;
    VIZ.roundRect(ctx, 0, tubeY, w, tubeH, 6);
    ctx.stroke();

    var fillGrad = ctx.createLinearGradient(0, 0, w * congestion, 0);
    fillGrad.addColorStop(0, congestionColor + '10');
    fillGrad.addColorStop(1, congestionColor + '25');
    ctx.fillStyle = fillGrad;
    VIZ.roundRect(ctx, 2, tubeY + 2, Math.max(4, (w - 4) * congestion), tubeH - 4, 5);
    ctx.fill();

    var txLabel = String(mempoolCount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    ctx.fillStyle = '#555';
    ctx.font = '9px "SF Mono", Monaco, monospace';
    ctx.fillText('MEMPOOL  ' + txLabel + ' tx  |  ' + Math.round(congestion * 100) + '% full', 8, tubeY + tubeH + 16);

    var targetCount = Math.round(5 + congestion * 45);

    while (particles.length < targetCount) {
      particles.push({
        x: -(Math.random() * 80),
        y: tubeY + tubeH * 0.15 + Math.random() * tubeH * 0.7,
        speed: 30 + Math.random() * 90 + congestion * 40,
        size: 0.8 + Math.random() * 2.8,
        alpha: 0.3 + Math.random() * 0.6
      });
    }
    while (particles.length > targetCount + 8) {
      particles.shift();
    }

    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var p = particles[pi];
      p.x += p.speed * 0.016;
      if (p.x > w + 20) {
        particles.splice(pi, 1);
        continue;
      }
      var a = p.alpha;
      if (p.x < 25) a *= p.x / 25;
      if (p.x > w - 25) a *= (w - p.x) / 25;
      a *= 0.55;
      ctx.globalAlpha = a;
      ctx.fillStyle = congestionColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { init: init };
})();
