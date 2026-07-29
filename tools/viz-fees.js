// Bitcoin Sahi — Fee Time-Series + Mempool Composition
// Line chart of fee rates from last 144 blocks with quadratic bezier smoothing
// Right-side vertical bar overlay = current mempool fee histogram
// Export: VIZ_Fees
// Depends on: VIZ (viz-core.js), DATA_ENGINE (data-engine.js)

var VIZ_Fees = (function() {
  var MAX_POINTS = 144;
  var series = { timestamps: [], fastest: [], hour: [], economy: [] };
  var mempoolHistogram = [];
  var currentFees = { fastestFee: 5, hourFee: 3, economyFee: 1 };
  var dataReady = false;

  var LAYERS = [
    { key: 'fastest', color: '#F85149', glow: 'rgba(248,81,73,0.12)', gradTop: 'rgba(248,81,73,0.06)' },
    { key: 'hour',    color: '#D29922', glow: 'rgba(210,153,34,0.12)', gradTop: 'rgba(210,153,34,0.06)' },
    { key: 'economy', color: '#3FB950', glow: 'rgba(63,185,80,0.12)', gradTop: 'rgba(63,185,80,0.06)' }
  ];

  function init(canvasId) {
    var c = VIZ.create(canvasId, { height: 400 });
    if (!c) return;

    seedData();

    DATA_ENGINE.onUpdate(function(d) {
      if (d.fees) {
        currentFees.fastestFee = d.fees.fastestFee != null ? d.fees.fastestFee : currentFees.fastestFee;
        currentFees.hourFee = d.fees.hourFee != null ? d.fees.hourFee : (d.fees.halfHourFee != null ? d.fees.halfHourFee : currentFees.hourFee);
        currentFees.economyFee = d.fees.economyFee != null ? d.fees.economyFee : currentFees.economyFee;
      }
      if (d.mempool && d.mempool.fee_histogram) {
        mempoolHistogram = d.mempool.fee_histogram;
      }
      if (d.fee_history && d.fee_history.length > 0) {
        rebuildFromHistory(d.fee_history);
        dataReady = true;
      }
    });

    VIZ.start(canvasId, draw, 5000);
  }

  function seedData() {
    var now = Date.now();
    series.timestamps = [];
    series.fastest = [];
    series.hour = [];
    series.economy = [];
    for (var i = 0; i < MAX_POINTS; i++) {
      series.timestamps.push(now - (MAX_POINTS - i) * 600000);
      series.fastest.push(currentFees.fastestFee);
      series.hour.push(currentFees.hourFee);
      series.economy.push(currentFees.economyFee);
    }
  }

  function rebuildFromHistory(history) {
    var slice = history.slice(0, MAX_POINTS);
    var times = [];
    var fast = [];
    var med = [];
    var econ = [];

    for (var i = 0; i < slice.length; i++) {
      var entry = slice[i];
      var ts = (entry.timestamp || 0) * 1000;
      var feeRate;
      if (entry.avgFeeRate != null && entry.avgFeeRate > 0) {
        feeRate = entry.avgFeeRate;
      } else {
        feeRate = (entry.avgFees || 0) / 2500000;
      }
      feeRate = Math.min(500, Math.max(0.1, feeRate));
      times.push(ts);
      fast.push(Math.round(feeRate * 2.5 * 10) / 10);
      med.push(Math.round(feeRate * 1.0 * 10) / 10);
      econ.push(Math.round(feeRate * 0.4 * 10) / 10);
    }

    series.timestamps = times;
    series.fastest = fast;
    series.hour = med;
    series.economy = econ;
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#F5F2ED';
    ctx.fillRect(0, 0, w, h);
    h = Math.max(200, h);

    var margin = { top: 25, right: 5, bottom: 35, left: 44 };
    var histW = Math.min(70, w * 0.14);
    var chartW = w - margin.left - margin.right - histW - 10;
    var plotW = chartW;
    var plotH = h - margin.top - margin.bottom;
    var plotX = margin.left;
    var plotY = margin.top;

    var maxFee = computeMaxFee();

    drawGrid(ctx, plotX, plotY, plotW, plotH, maxFee);
    drawTimeSeries(ctx, plotX, plotY, plotW, plotH, maxFee);

    var histX = plotX + plotW + 8;
    drawHistogram(ctx, histX, plotY, histW, plotH);

    drawXLabels(ctx, plotX, plotW, plotY, plotH);
    drawFeeLabels(ctx, plotX + plotW, plotY, plotH, maxFee);
  }

  function computeMaxFee() {
    var m = 1;
    for (var i = 0; i < series.fastest.length && i < MAX_POINTS; i++) {
      m = Math.max(m, series.fastest[i], series.hour[i], series.economy[i]);
    }
    m = Math.max(m, currentFees.fastestFee, currentFees.hourFee, currentFees.economyFee);
    if (m < 1) m = 50;
    if (!isFinite(m) || isNaN(m)) m = 50;
    var mag = Math.pow(10, Math.floor(Math.log10(m)));
    if (mag < 1) mag = 1;
    return Math.ceil((m * 1.15) / mag) * mag;
  }

  function drawGrid(ctx, x, y, w, h, maxFee) {
    var lines = 5;
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 1;
    for (var i = 0; i <= lines; i++) {
      var gy = y + h - (i / lines) * h;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '9px "SF Mono", Monaco, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((i / lines) * maxFee) + '', x - 6, gy + 3);
    }
  }

  function drawXLabels(ctx, x, w, y, h) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#555';
    ctx.font = '9px "SF Mono", Monaco, monospace';
    ctx.fillText('24h ago', x, y + h + 16);
    ctx.textAlign = 'right';
    ctx.fillText('now', x + w, y + h + 16);
    ctx.textAlign = 'left';
  }

  function drawTimeSeries(ctx, x, y, w, h, maxFee) {
    var n = series.timestamps.length;
    if (n < 2) return;

    var minT = series.timestamps[0];
    var maxT = series.timestamps[n - 1];
    if (maxT - minT < 1000) { minT = maxT - 86400000; }
    var tRange = maxT - minT;

    var pts = { fastest: [], hour: [], economy: [] };
    for (var i = 0; i < n; i++) {
      var px = x + (series.timestamps[i] - minT) / tRange * w;
      px = Math.max(x, Math.min(x + w, px));
      for (var li = 0; li < 3; li++) {
        var key = LAYERS[li].key;
        var py = y + h - (series[key][i] / maxFee) * h;
        pts[key].push({ x: px, y: Math.max(y, Math.min(y + h, py)) });
      }
    }

    for (var li2 = 0; li2 < 3; li2++) {
      var k = LAYERS[li2].key;
      var p = pts[k];
      if (p.length < 2) continue;

      var grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, LAYERS[li2].gradTop);
      grad.addColorStop(0.5, LAYERS[li2].glow);
      grad.addColorStop(1, 'rgba(10,10,15,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p[0].x, y + h);
      ctx.lineTo(p[0].x, p[0].y);
      for (var j = 0; j < p.length - 1; j++) {
        var xc = (p[j].x + p[j + 1].x) / 2;
        var yc = (p[j].y + p[j + 1].y) / 2;
        ctx.quadraticCurveTo(p[j].x, p[j].y, xc, yc);
      }
      ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      ctx.lineTo(p[p.length - 1].x, y + h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = LAYERS[li2].glow;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (var j2 = 0; j2 < p.length - 1; j2++) {
        var xc2 = (p[j2].x + p[j2 + 1].x) / 2;
        var yc2 = (p[j2].y + p[j2 + 1].y) / 2;
        ctx.quadraticCurveTo(p[j2].x, p[j2].y, xc2, yc2);
      }
      ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      ctx.stroke();

      ctx.strokeStyle = LAYERS[li2].color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (var j3 = 0; j3 < p.length - 1; j3++) {
        var xc3 = (p[j3].x + p[j3 + 1].x) / 2;
        var yc3 = (p[j3].y + p[j3 + 1].y) / 2;
        ctx.quadraticCurveTo(p[j3].x, p[j3].y, xc3, yc3);
      }
      ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      ctx.stroke();
    }
  }

  function drawHistogram(ctx, x, y, w, h) {
    if (!mempoolHistogram || mempoolHistogram.length === 0) return;

    ctx.fillStyle = '#666';
    ctx.font = '8px "SF Mono", Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MEMPOOL', x + w / 2, y - 6);

    var totalVSize = 0;
    for (var i = 0; i < mempoolHistogram.length; i++) {
      totalVSize += mempoolHistogram[i][1];
    }
    if (totalVSize === 0) return;

    var barW = Math.max(4, w - 6);
    var maxBarH = h - 6;

    for (var j = 0; j < mempoolHistogram.length; j++) {
      var feeRate = mempoolHistogram[j][0];
      var vsize = mempoolHistogram[j][1];
      var barH = (vsize / totalVSize) * maxBarH;
      if (barH < 1) barH = 1;
      barH = Math.min(barH, maxBarH);

      var barY = y + h - 3 - barH;
      var color = VIZ.feeColor(feeRate, 100);
      ctx.fillStyle = color;
      ctx.fillRect(x + 3, barY, barW, barH);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#555';
    ctx.font = '7px "SF Mono", Monaco, monospace';
    var lastIdx = mempoolHistogram.length - 1;
    ctx.fillText(mempoolHistogram[lastIdx][0] + '', x + barW + 4, y + 8);
    ctx.fillText('0', x + barW + 4, y + h);
  }

  function drawFeeLabels(ctx, x, y, h, maxFee) {
    var labels = [
      { key: 'fastestFee', label: 'Fastest', color: '#F85149' },
      { key: 'hourFee',    label: 'Hour',    color: '#D29922' },
      { key: 'economyFee', label: 'Econ',    color: '#3FB950' }
    ];

    ctx.textAlign = 'left';
    for (var i = 0; i < labels.length; i++) {
      var fee = currentFees[labels[i].key];
      if (fee == null) fee = 0;
      var fy = y + h - (fee / maxFee) * h;
      fy = Math.max(y + 10, Math.min(y + h - 10, fy));

      ctx.fillStyle = labels[i].color;
      ctx.font = 'bold 10px "SF Mono", Monaco, monospace';
      ctx.fillText(labels[i].label + ' ' + fee + ' sat/vB', x + 14, fy + 3);

      ctx.beginPath();
      ctx.arc(x + 10, fy - 1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { init: init };
})();
