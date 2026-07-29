// Block Reward Composition — Miner Persona
// Interactive donut chart showing subsidy vs fees, with 24h fee revenue trend

var VIZ_Miner = (function() {
  var canvas, ctx, w = 0, h = 0;
  var rotation = 0;
  var targetFee = 0;
  var smoothFee = 0;
  var feeHistory = [];
  var btcPrice = 64000;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    DATA_ENGINE.onUpdate(function() {
      var d = DATA_ENGINE.get();
      var history = d.fee_history || [];
      btcPrice = d.btc_price || 64000;

      var slice = history.slice(-10);
      var sum = 0;
      for (var i = 0; i < slice.length; i++) {
        sum += slice[i].avgFees || 0;
      }
      targetFee = slice.length > 0 ? sum / slice.length : 0;
      feeHistory = history;
    });

    DATA_ENGINE.start();
    loop();
  }

  function resize() {
    w = canvas.width = canvas.clientWidth || window.innerWidth;
    h = canvas.height = 400;
  }

  function loop() {
    var t = Date.now() / 1000;
    rotation = (rotation + 0.0015) % (Math.PI * 2);
    smoothFee += (targetFee - smoothFee) * 0.05;
    if (Math.abs(smoothFee - targetFee) < 1) smoothFee = targetFee;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    drawDonut(w * 0.6, h, t);
    drawTrend(w * 0.6, w * 0.4, h, t);
    drawTitle(w);

    // Subtle vignette
    var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(loop);
  }

  function drawDonut(areaW, areaH, t) {
    var cx = areaW / 2;
    var cy = areaH / 2 + 6;
    var pulse = 1 + Math.sin(t * 1.2) * 0.015;
    var outerR = Math.min(areaW, areaH) * 0.32 * pulse;
    var innerR = outerR * 0.58;

    var subsidySats = 312500000;
    var feeSats = Math.max(0, smoothFee);
    var totalSats = subsidySats + feeSats;

    var subAngle = totalSats > 0 ? (subsidySats / totalSats) * Math.PI * 2 : Math.PI * 2;
    var feeAngle = totalSats > 0 ? (feeSats / totalSats) * Math.PI * 2 : 0;

    if (feeAngle < 0.02) feeAngle = 0;
    if (subAngle < 0.02) subAngle = 0;

    var r = rotation;

    // Subsidy arc (orange)
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, r, r + subAngle);
    ctx.arc(cx, cy, innerR, r + subAngle, r, true);
    ctx.closePath();
    ctx.fillStyle = '#F7931A';
    ctx.fill();

    // Subsidy glow
    ctx.shadowColor = 'rgba(247,147,26,0.15)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, r, r + subAngle);
    ctx.arc(cx, cy, innerR, r + subAngle, r, true);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fee arc (green)
    if (feeAngle > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, r + subAngle, r + subAngle + feeAngle);
      ctx.arc(cx, cy, innerR, r + subAngle + feeAngle, r + subAngle, true);
      ctx.closePath();
      ctx.fillStyle = '#3FB950';
      ctx.fill();
    }

    // Center text — total reward in USD
    var totalBtc = 3.125 + feeSats / 100000000;
    var totalUsd = totalBtc * btcPrice;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillStyle = '#E8E5E0';
    ctx.fillText('$' + fmtUSD(totalUsd), cx, cy - 14);
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(totalBtc.toFixed(4) + ' BTC', cx, cy + 14);

    // Percentage labels on arcs
    if (totalSats > 0) {
      var lr = (outerR + innerR) / 2;
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (subAngle > 0.3) {
        var ma = r + subAngle / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText((subsidySats / totalSats * 100).toFixed(1) + '%', cx + Math.cos(ma) * lr, cy + Math.sin(ma) * lr);
      }

      if (feeAngle > 0.3) {
        var ma = r + subAngle + feeAngle / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText((feeSats / totalSats * 100).toFixed(1) + '%', cx + Math.cos(ma) * lr, cy + Math.sin(ma) * lr);
      }
    }

    // Legend
    var legX = cx - 75;
    var legY = cy + outerR + 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '11px -apple-system, sans-serif';

    ctx.fillStyle = '#F7931A';
    ctx.fillRect(legX, legY - 5, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Subsidy: 3.125 BTC', legX + 16, legY + 1);

    ctx.fillStyle = '#3FB950';
    ctx.fillRect(legX, legY + 18, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Fees: ' + (feeSats / 100000000).toFixed(4) + ' BTC', legX + 16, legY + 24);
  }

  function drawTrend(leftW, trendW, areaH, t) {
    var margin = { top: 36, right: 16, bottom: 24, left: 50 };
    var plotW = trendW - margin.left - margin.right;
    var plotH = areaH - margin.top - margin.bottom;

    if (plotW < 10 || plotH < 10) return;

    var ox = leftW + margin.left;
    var oy = margin.top;

    // Trend title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Fee Revenue (sats) — Last 144 Blocks', leftW + 8, 10);

    var data = feeHistory.slice(-144);
    if (data.length < 2) return;

    var minVal = Infinity, maxVal = -Infinity;
    for (var i = 0; i < data.length; i++) {
      var v = data[i].avgFees || 0;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    if (maxVal - minVal < 1) {
      maxVal = minVal * 1.2 + 1;
      minVal = minVal * 0.8;
    }
    var range = maxVal - minVal;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = oy + (plotH / 4) * g;
      ctx.beginPath();
      ctx.moveTo(ox, gy);
      ctx.lineTo(ox + plotW, gy);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (var g = 0; g <= 4; g++) {
      var val = maxVal - (g / 4) * range;
      ctx.fillText(fmtSats(val), ox - 4, oy + (plotH / 4) * g);
    }

    // Area fill under line
    ctx.beginPath();
    for (var i = 0; i < data.length; i++) {
      var x = ox + (i / (data.length - 1)) * plotW;
      var v = data[i].avgFees || 0;
      var y = oy + plotH - ((v - minVal) / range) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(ox + plotW, oy + plotH);
    ctx.lineTo(ox, oy + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(247,147,26,0.08)';
    ctx.fill();

    // Trend line
    ctx.beginPath();
    ctx.strokeStyle = '#F7931A';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (var i = 0; i < data.length; i++) {
      var x = ox + (i / (data.length - 1)) * plotW;
      var v = data[i].avgFees || 0;
      var y = oy + plotH - ((v - minVal) / range) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Latest value dot and label
    var last = data[data.length - 1].avgFees || 0;
    var lx = ox + plotW;
    var ly = oy + plotH - ((last - minVal) / range) * plotH;
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#F7931A';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(247,147,26,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillStyle = '#F7931A';
    ctx.fillText(fmtSats(last), lx + 8, ly);
  }

  function drawTitle(totalW) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Block Reward Composition', totalW / 2, 10);
  }

  function fmtUSD(val) {
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toFixed(0);
  }

  function fmtSats(sats) {
    if (sats >= 1000000) return (sats / 1000000).toFixed(1) + 'M';
    if (sats >= 1000) return (sats / 1000).toFixed(0) + 'K';
    return sats.toFixed(0);
  }

  return { init: init };
})();
