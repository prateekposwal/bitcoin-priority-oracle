var VIZ_Blockspace = (function() {
  var MAX_BLOCKS = 144;
  var COLS = 24;
  var ROWS = 6;
  var blocks = [];
  var maxFee = 1;
  var tooltipEl = null;
  var trendValues = [];
  var layout = { cellW: 0, cellH: 0, dotR: 0, gridH: 0, trendH: 30 };

  function init(canvasId) {
    VIZ.create(canvasId, { height: 400 });

    tooltipEl = document.createElement('div');
    tooltipEl.id = canvasId + '-tooltip';
    tooltipEl.style.cssText = 'position:fixed;pointer-events:none;background:rgba(10,10,15,0.92);border:1px solid #333;border-radius:6px;padding:6px 10px;font:11px "SF Mono",Monaco,monospace;color:#ccc;z-index:9999;display:none;';
    document.body.appendChild(tooltipEl);

    var c = VIZ.getCanvas(canvasId);
    if (c && c.el) {
      c.el.addEventListener('mousemove', function(e) { onMouseMove(e, canvasId); });
      c.el.addEventListener('mouseleave', hideTooltip);
    }

    VIZ.start(canvasId, draw);
  }

  function rebuild() {
    var history = (typeof DATA_ENGINE !== 'undefined' && typeof DATA_ENGINE.getFeeHistory === 'function') ? DATA_ENGINE.getFeeHistory() : [];
    if (!history || !history.length) return;

    var sorted = history.slice().sort(function(a, b) { return a.timestamp - b.timestamp; });
    var recent = sorted.slice(-MAX_BLOCKS);

    maxFee = 1;
    for (var i = 0; i < recent.length; i++) {
      if (recent[i].avgFees > maxFee) maxFee = recent[i].avgFees;
    }
    if (maxFee < 1) maxFee = 1;

    var sum = 0;
    trendValues = [];
    for (var i = 0; i < recent.length; i++) {
      sum += recent[i].avgFees;
      trendValues.push(sum / (i + 1));
    }

    blocks = [];
    var pad = MAX_BLOCKS - recent.length;
    for (var i = 0; i < MAX_BLOCKS; i++) {
      var idx = i - pad;
      blocks.push((idx >= 0 && idx < recent.length) ? recent[idx] : null);
    }
  }

  function draw(ctx, w, h, t) {
    rebuild();

    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);

    var trendH = layout.trendH;
    var gridH = h - trendH;
    var cellW = w / COLS;
    var cellH = gridH / ROWS;
    var dotR = Math.min(cellW, cellH) * 0.32;

    layout.cellW = cellW;
    layout.cellH = cellH;
    layout.dotR = dotR;
    layout.gridH = gridH;

    for (var i = 0; i < blocks.length; i++) {
      var col = Math.floor(i / ROWS);
      var row = i % ROWS;
      var x = col * cellW + cellW / 2;
      var y = row * cellH + cellH / 2;
      var entry = blocks[i];

      if (entry && entry.avgFees != null) {
        var color = VIZ.feeColor(entry.avgFees, maxFee);
        var isHot = entry.avgFees > maxFee * 0.7;
        var pulse = isHot ? (Math.sin(t * 2.5 + i * 0.5) * 0.12 + 0.88) : 1;
        var r = dotR * pulse;

        var grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        grad.addColorStop(0, color + '55');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.arc(x, y, dotR * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawTrendLine(ctx, w, h, trendH);
    drawLabels(ctx, w, h, t);
  }

  function drawTrendLine(ctx, w, h, trendH) {
    if (trendValues.length < 2) return;

    var trendY = h - trendH + 6;
    var trendW = w - 30;
    var startX = 15;
    var plotH = trendH - 12;

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(startX, trendY, trendW, plotH);

    var minT = Infinity, maxT = -Infinity;
    for (var i = 0; i < trendValues.length; i++) {
      if (trendValues[i] < minT) minT = trendValues[i];
      if (trendValues[i] > maxT) maxT = trendValues[i];
    }
    var rangeT = maxT - minT || 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var i = 0; i < trendValues.length; i++) {
      var x = startX + (i / (trendValues.length - 1)) * trendW;
      var y = trendY + plotH - ((trendValues[i] - minT) / rangeT) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#555';
    ctx.font = '7px "SF Mono", Monaco, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatSats(minT), startX, trendY + plotH + 9);
    ctx.textAlign = 'right';
    ctx.fillText(formatSats(maxT), startX + trendW, trendY + plotH + 9);
  }

  function drawLabels(ctx, w, h, t) {
    var count = 0;
    for (var i = 0; i < blocks.length; i++) { if (blocks[i] !== null) count++; }

    ctx.fillStyle = '#444';
    ctx.font = '8px "SF Mono", Monaco, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Block Fees  ' + count + '/144 blocks', 8, 11);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#333';
    ctx.fillText(maxFee > 1 ? 'max ' + formatSats(maxFee) : '', w - 8, 11);
  }

  function formatSats(v) {
    return Math.round(v).toLocaleString() + ' sats';
  }

  function onMouseMove(e, canvasId) {
    var c = VIZ.getCanvas(canvasId);
    if (!c || !c.el) return;
    var rect = c.el.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var cellW = layout.cellW;
    var cellH = layout.cellH;
    if (cellW <= 0 || cellH <= 0) return;

    var col = Math.floor(mx / cellW);
    var row = Math.floor(my / cellH);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) { hideTooltip(); return; }

    var idx = col * ROWS + row;
    if (idx < 0 || idx >= blocks.length) { hideTooltip(); return; }

    var entry = blocks[idx];
    if (!entry || entry.avgFees == null) { hideTooltip(); return; }

    var usdPerBlock = (entry.avgFees * (entry.USD || 0)) / 100000000;

    tooltipEl.style.display = 'block';
    tooltipEl.style.left = Math.min(e.clientX + 12, window.innerWidth - 200) + 'px';
    tooltipEl.style.top = Math.max(0, e.clientY - 10) + 'px';
    tooltipEl.innerHTML =
      '<div style="color:#999">Block <span style="color:#fff">' + entry.avgHeight + '</span></div>' +
      '<div style="color:#999">Fees <span style="color:#ffa726">' + Math.round(entry.avgFees).toLocaleString() + ' sats</span></div>' +
      '<div style="color:#999">Value <span style="color:#66bb6a">$' + usdPerBlock.toFixed(2) + '</span></div>';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  return { init: init };
})();
