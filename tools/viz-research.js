const VIZ_Research = (() => {
  const COLORS = {
    fastest: '#ff4444',
    hour: '#ffcc00',
    economy: '#33dd77',
  };

  const LABELS = {
    fastest: 'Fastest',
    hour: '1 Hour',
    economy: 'Economy',
  };

  const BUCKET_BOUNDS = [0, 5, 10, 20, 50, Infinity];
  const BUCKET_LABELS = ['0-5', '5-10', '10-20', '20-50', '50+'];

  let canvas, ctx, w = 0, h = 0;
  let data = [];
  let histData = [];
  let hovered = null;
  let rafId = null;
  let btcPrice = 64000;
  let stacked = false;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', () => { hovered = null; });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    if (typeof DATA_ENGINE !== 'undefined') {
      var de = DATA_ENGINE;
      var state = de.get();
      if (state && state.fee_history && state.fee_history.length > 0) {
        data = buildSeries(state.fee_history);
        histData = computeHistogram(state.fee_history);
      }
      if (state && state.btc_price) btcPrice = state.btc_price;

      de.onUpdate(function(state) {
        if (state && state.fee_history) {
          data = buildSeries(state.fee_history);
          histData = computeHistogram(state.fee_history);
        }
        if (state && state.btc_price) btcPrice = state.btc_price;
      });
    }

    if (data.length === 0) {
      var now = Date.now();
      var dummy = [];
      for (var i = 96; i >= 0; i--) {
        var t = now - i * 15 * 60 * 1000;
        var base = 15 + Math.sin(i * 0.4) * 8 + Math.random() * 5;
        dummy.push({ timestamp: t, avgFee: base * 2500000 });
      }
      data = computeTiers(dummy);
      histData = computeHistogram(dummy);
    }

    loop();
  }

  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function resize() {
    var parent = canvas.parentElement;
    var pw = parent ? parent.clientWidth : window.innerWidth;
    if (!pw || pw < 100) pw = window.innerWidth;
    var dpr = window.devicePixelRatio || 1;
    w = pw;
    stacked = w < 768;
    h = stacked ? 1000 : 600;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function buildSeries(raw) {
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      var now = Date.now();
      var dummy = [];
      for (var i = 96; i >= 0; i--) {
        var t = now - i * 15 * 60 * 1000;
        var base = 15 + Math.sin(i * 0.4) * 8 + Math.random() * 5;
        dummy.push({ timestamp: t, avgFee: base * 2500000 });
      }
      return computeTiers(dummy);
    }
    return computeTiers(raw);
  }

  function computeTiers(entries) {
    return entries.map(function(e) {
      var economy = e.avgFee / 2500000;
      return {
        t: e.timestamp,
        economy: economy,
        hour: economy * 1.5,
        fastest: economy * 3,
      };
    });
  }

  function computeHistogram(entries) {
    var counts = [0, 0, 0, 0, 0];
    for (var i = 0; i < entries.length; i++) {
      var rate = (entries[i].avgFee || 0) / 2500000;
      for (var b = 0; b < BUCKET_BOUNDS.length - 1; b++) {
        if (rate >= BUCKET_BOUNDS[b] && rate < BUCKET_BOUNDS[b + 1]) {
          counts[b]++;
          break;
        }
      }
    }
    return counts;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    if (stacked) {
      var panelH = (h - 20) / 3;
      drawHistogram(0, 12, w - 24, panelH - 4);
      drawChartPanel(0, panelH + 8, w - 24, panelH - 4);
      drawStatsPanel(0, 2 * panelH + 12, w - 24, panelH - 4);
    } else {
      var histW = Math.round(w * 0.35) - 12;
      var chartW = Math.round(w * 0.40) - 8;
      var statsW = w - histW - chartW - 28;

      drawHistogram(10, 10, histW, h - 20);
      drawChartPanel(histW + 18, 10, chartW, h - 20);
      drawStatsPanel(histW + chartW + 22, 10, statsW, h - 20);
    }

    if (hovered && !stacked) drawCrosshair();

    var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, h * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawHistogram(px, py, pw, ph) {
    if (pw < 40 || ph < 40) return;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Fee Distribution', px + 10, py + 8);

    var margin = { top: 34, right: 10, bottom: 28, left: 36 };
    var plotX = px + margin.left;
    var plotY = py + margin.top;
    var plotW = pw - margin.left - margin.right;
    var plotH = ph - margin.top - margin.bottom;

    if (plotW < 10 || plotH < 10) return;

    var maxCount = 1;
    for (var i = 0; i < histData.length; i++) {
      if (histData[i] > maxCount) maxCount = histData[i];
    }
    maxCount = Math.ceil(maxCount * 1.15);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 3; g++) {
      var gy = plotY + (g / 3) * plotH;
      ctx.beginPath();
      ctx.moveTo(plotX, gy);
      ctx.lineTo(plotX + plotW, gy);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText(Math.round(maxCount - (g / 3) * maxCount) + '', plotX - 4, gy);
    }

    var barW = plotW / histData.length * 0.75;
    var barGap = plotW / histData.length * 0.25;

    for (var i = 0; i < histData.length; i++) {
      var barH = (histData[i] / maxCount) * plotH;
      var bx = plotX + i * (barW + barGap) + barGap / 2;
      var by = plotY + plotH - barH;

      var midFee = (BUCKET_BOUNDS[i] + Math.min(BUCKET_BOUNDS[i + 1], 100)) / 2;
      var feeColor = VIZ.feeColor(Math.min(midFee, 50));

      var grad = ctx.createLinearGradient(0, by, 0, plotY + plotH);
      grad.addColorStop(0, 'rgba(' + feeColor.r + ',' + feeColor.g + ',' + feeColor.b + ',0.85)');
      grad.addColorStop(1, 'rgba(' + feeColor.r + ',' + feeColor.g + ',' + feeColor.b + ',0.3)');
      ctx.fillStyle = grad;
      VIZ.roundRect(ctx, bx, by, barW, barH, 3);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(histData[i], bx + barW / 2, by - 3);

      ctx.textBaseline = 'top';
      ctx.font = '8px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(BUCKET_LABELS[i], bx + barW / 2, plotY + plotH + 4);
    }
  }

  function drawChartPanel(px, py, pw, ph) {
    if (pw < 60 || ph < 40 || data.length < 2) return;

    var chartPad = { top: 34, right: 10, bottom: 30, left: 46 };
    var chartX = px + chartPad.left;
    var chartY = py + chartPad.top;
    var chartW = pw - chartPad.left - chartPad.right;
    var chartH = ph - chartPad.top - chartPad.bottom;

    if (chartW < 10 || chartH < 10) return;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Fee History — Last 24h', px + 10, py + 8);

    function getMaxY() {
      var m = 1;
      for (var i = 0; i < data.length; i++) {
        if (data[i].fastest > m) m = data[i].fastest;
      }
      return Math.ceil(m * 1.15);
    }

    var maxY = getMaxY();
    var t0 = data[0].t;
    var t1 = data[data.length - 1].t;
    var timeRange = t1 - t0 || 1;

    function mapX(t) {
      return chartX + ((t - t0) / timeRange) * chartW;
    }

    function mapY(v) {
      return chartY + chartH - (v / maxY) * chartH;
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    var ySteps = 4;
    for (var i = 0; i <= ySteps; i++) {
      var v = (maxY / ySteps) * i;
      var gy = mapY(v);
      ctx.beginPath();
      ctx.moveTo(chartX, gy);
      ctx.lineTo(chartX + chartW, gy);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText(Math.round(v) + '', chartX - 5, gy);
    }

    var xSteps = 5;
    for (var i = 0; i <= xSteps; i++) {
      var idx = Math.round((i / xSteps) * (data.length - 1));
      var d = data[idx];
      var gx = mapX(d.t);
      ctx.beginPath();
      ctx.moveTo(gx, chartY);
      ctx.lineTo(gx, chartY + chartH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      var dd = new Date(d.t);
      ctx.fillText(String(dd.getHours()).padStart(2, '0') + ':' + String(dd.getMinutes()).padStart(2, '0'), gx, chartY + chartH + 4);
    }

    var keys = ['economy', 'hour', 'fastest'];
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var pts = data.map(function(d) { return { x: mapX(d.t), y: mapY(d[key]) }; });
      if (pts.length < 2) continue;

      var y0 = mapY(0);
      ctx.beginPath();
      bezierThrough(ctx, pts);
      ctx.lineTo(pts[pts.length - 1].x, y0);
      ctx.lineTo(pts[0].x, y0);
      ctx.closePath();
      var grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      var c = COLORS[key];
      grad.addColorStop(0, c + '66');
      grad.addColorStop(1, c + '10');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var pts = data.map(function(d) { return { x: mapX(d.t), y: mapY(d[key]) }; });
      if (pts.length < 2) continue;
      ctx.strokeStyle = COLORS[key];
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.shadowColor = COLORS[key] + '44';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      bezierThrough(ctx, pts);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    drawLegend(px + pw - 95, py + 10, keys);
  }

  function bezierThrough(ctx, pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length - 1; i++) {
      var prev = pts[i - 1];
      var cur = pts[i];
      var next = pts[i + 1];
      var cp1x = cur.x - (cur.x - prev.x) * 0.25;
      var cp1y = cur.y - (cur.y - prev.y) * 0.25;
      var cp2x = cur.x + (next.x - cur.x) * 0.25;
      var cp2y = cur.y + (next.y - cur.y) * 0.25;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cur.x, cur.y);
    }
    var last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function drawLegend(lx, ly, keys) {
    var boxW = 80;
    var boxH = keys.length * 22 + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    VIZ.roundRect(ctx, lx, ly, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '11px -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < keys.length; i++) {
      var y = ly + 10 + i * 22 + 11;
      ctx.fillStyle = COLORS[keys[i]];
      VIZ.roundRect(ctx, lx + 8, y - 4, 10, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'left';
      ctx.fillText(LABELS[keys[i]], lx + 24, y);
    }
  }

  function drawStatsPanel(px, py, pw, ph) {
    if (pw < 40 || ph < 40) return;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Fee Stats', px + 10, py + 8);

    var cardGap = 6;
    var cardY = py + 32;
    var cardH = (ph - 36 - cardGap * 2) / 3;
    var cardW = pw - 16;

    if (data.length < 2) return;

    var ecoVals = data.map(function(d) { return d.economy; });
    var minFee = Infinity, maxFee = -Infinity, sumFee = 0;
    for (var i = 0; i < ecoVals.length; i++) {
      if (ecoVals[i] < minFee) minFee = ecoVals[i];
      if (ecoVals[i] > maxFee) maxFee = ecoVals[i];
      sumFee += ecoVals[i];
    }
    var avgFee = sumFee / ecoVals.length;
    var volatility = avgFee > 0 ? (maxFee - minFee) / avgFee : 0;
    var volPct = volatility * 100;

    var volColor = volPct < 30 ? '#3FB950' : volPct < 60 ? '#D29922' : '#F85149';

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    VIZ.roundRect(ctx, px + 8, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Volatility', px + 20, cardY + 10);
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillStyle = volColor;
    ctx.fillText(volPct.toFixed(1) + '%', px + 20, cardY + 28);
    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textBaseline = 'bottom';
    ctx.fillText(volPct < 30 ? 'low volatility' : volPct < 60 ? 'moderate' : 'high volatility', px + 20, cardY + cardH - 8);

    var cardY2 = cardY + cardH + cardGap;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    VIZ.roundRect(ctx, px + 8, cardY2, cardW, cardH, 8);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Avg Fee', px + 20, cardY2 + 10);
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillStyle = '#E8E5E0';
    ctx.fillText(avgFee.toFixed(1), px + 20, cardY2 + 28);
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textBaseline = 'bottom';
    ctx.fillText('sat/vB', px + 20, cardY2 + cardH - 8);

    var cardY3 = cardY2 + cardH + cardGap;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    VIZ.roundRect(ctx, px + 8, cardY3, cardW, cardH, 8);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Range', px + 20, cardY3 + 10);
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.fillStyle = '#E8E5E0';
    ctx.fillText(minFee.toFixed(1) + ' — ' + maxFee.toFixed(1), px + 20, cardY3 + 28);
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textBaseline = 'bottom';
    ctx.fillText('sat/vB', px + 20, cardY3 + cardH - 8);
  }

  function drawCrosshair() {
    if (!hovered || stacked) return;
    var p = hovered.point;

    var chartPad = { top: 44, right: 10, bottom: 30, left: 56 };
    var histW = Math.round(w * 0.35) - 12;
    var chartW = Math.round(w * 0.40) - 8;
    var chartX = histW + 18 + chartPad.left;
    var chartY = chartPad.top;
    var chartPW = chartW - chartPad.left - chartPad.right;
    var chartPH = h - 20 - chartPad.top - chartPad.bottom;

    if (chartPW < 10 || chartPH < 10) return;

    var t0 = data[0].t;
    var t1 = data[data.length - 1].t;
    var timeRange = t1 - t0 || 1;

    var cx = chartX + ((p.t - t0) / timeRange) * chartPW;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, chartY);
    ctx.lineTo(cx, chartY + chartPH);
    ctx.stroke();
    ctx.restore();

    var tooltipW = 220;
    var tooltipH = 112;
    var tx = cx + 12;
    var ty = chartY + 4;
    if (tx + tooltipW > histW + 18 + chartW) tx = cx - tooltipW - 12;
    if (ty + tooltipH > chartY + chartPH) ty = chartY + chartPH - tooltipH;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    VIZ.roundRect(ctx, tx, ty, tooltipW, tooltipH, 6);
    ctx.fill();
    ctx.stroke();

    var dd = new Date(p.t);
    var timeStr = String(dd.getHours()).padStart(2, '0') + ':' + String(dd.getMinutes()).padStart(2, '0');

    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(timeStr, tx + 10, ty + 6);

    var rows = [
      { label: 'Fastest', val: p.fastest, color: COLORS.fastest },
      { label: '1 Hour',  val: p.hour,    color: COLORS.hour },
      { label: 'Economy', val: p.economy, color: COLORS.economy },
    ];

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var ry = ty + 26 + i * 20;
      ctx.fillStyle = r.color;
      VIZ.roundRect(ctx, tx + 10, ry + 3, 8, 8, 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'left';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText(r.label + ':', tx + 24, ry);
      ctx.textAlign = 'right';
      ctx.fillText(r.val.toFixed(1) + ' sat/vB', tx + tooltipW - 48, ry);

      var usdPerTx = r.val * 140 * btcPrice / 100000000;
      ctx.textAlign = 'right';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('$' + usdPerTx.toFixed(2) + '/tx', tx + tooltipW - 10, ry + 1);
    }
  }

  function handleHover(mx, my) {
    if (data.length < 2) { hovered = null; return; }

    var histW = Math.round(w * 0.35) - 12;
    var chartW = Math.round(w * 0.40) - 8;
    var chartPad = { top: 44, right: 10, bottom: 30, left: 56 };

    var chartAreaX = histW + 18;
    var chartAreaW = chartW;

    if (mx < chartAreaX + chartPad.left || mx > chartAreaX + chartAreaW - chartPad.right ||
        my < chartPad.top || my > h - chartPad.top) {
      hovered = null;
      return;
    }

    var t0 = data[0].t;
    var t1 = data[data.length - 1].t;
    var timeRange = t1 - t0 || 1;
    var plotX = chartAreaX + chartPad.left;
    var plotW = chartAreaW - chartPad.left - chartPad.right;

    var closest = null;
    var minDist = Infinity;
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var x = plotX + ((d.t - t0) / timeRange) * plotW;
      var dist = Math.abs(x - mx);
      if (dist < minDist) {
        minDist = dist;
        closest = d;
      }
    }

    if (closest && minDist < 50) {
      hovered = { point: closest, mx: mx, my: my };
    } else {
      hovered = null;
    }
  }

  function onMove(e) {
    if (stacked) return;
    var rect = canvas.getBoundingClientRect();
    handleHover(e.clientX - rect.left, e.clientY - rect.top);
  }

  function onTouchStart(e) {
    if (stacked) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var t = e.touches[0];
    handleHover(t.clientX - rect.left, t.clientY - rect.top);
  }

  function onTouchMove(e) {
    if (stacked) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var t = e.touches[0];
    handleHover(t.clientX - rect.left, t.clientY - rect.top);
  }

  function onTouchEnd() {
    if (stacked) return;
    setTimeout(function() { hovered = null; }, 2000);
  }

  function downloadCSV() {
    if (data.length === 0) return;
    var csv = 'Timestamp,Economy (sat/vB),1 Hour (sat/vB),Fastest (sat/vB)\n';
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var ts = new Date(d.t).toISOString();
      csv += ts + ',' + d.economy.toFixed(2) + ',' + d.hour.toFixed(2) + ',' + d.fastest.toFixed(2) + '\n';
    }
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'fee_history_24h.csv';
    a.textContent = 'Download CSV';
    a.style.cssText =
      'display:inline-block;margin-top:8px;padding:6px 14px;background:#1e293b;' +
      'color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:4px;' +
      'font:11px -apple-system,sans-serif;text-decoration:none;';
    a.onclick = function() { setTimeout(function() { URL.revokeObjectURL(url); }, 5000); };
    return a;
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  }

  return { init: init, destroy: destroy, downloadCSV: downloadCSV, resize: resize };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VIZ_Research };
}
