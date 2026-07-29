var VIZ_Miner = (function() {
  var canvas, ctx, w = 0, h = 0;
  var blocks = [];
  var feeHistory = [];
  var btcPrice = 64000;
  var poolSats = 0;
  var poolDisplay = 0;
  var blockIndex = 0;
  var pulse = 0;
  var spawnTimer = 0;
  var sparklineData = [];

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    if (typeof DATA_ENGINE !== 'undefined') {
      var de = DATA_ENGINE;
      var d = de.get();
      if (d.fee_history && d.fee_history.length > 0) {
        feeHistory = d.fee_history;
        sparklineData = d.fee_history.slice(-144).map(function(b) { return b.avgFees || 0; });
      }
      if (d.btc_price) btcPrice = d.btc_price;

      de.onUpdate(function() {
        var d = de.get();
        if (d.fee_history && d.fee_history.length > 0) {
          if (d.fee_history.length !== feeHistory.length) {
            feeHistory = d.fee_history;
            sparklineData = d.fee_history.slice(-144).map(function(b) { return b.avgFees || 0; });
            blockIndex = 0;
          }
        }
        if (d.btc_price) btcPrice = d.btc_price;
      });
    }

    if (feeHistory.length === 0) {
      var now = Date.now();
      for (var i = 143; i >= 0; i--) {
        feeHistory.push({
          timestamp: now - i * 600000,
          avgFees: (5 + Math.sin(i * 0.3) * 3 + Math.random() * 4) * 1000000
        });
      }
      sparklineData = feeHistory.slice(-144).map(function(b) { return b.avgFees || 0; });
    }

    loop();
  }

  function resize() {
    var parent = canvas.parentElement;
    var pw = parent ? parent.clientWidth : window.innerWidth;
    var dpr = window.devicePixelRatio || 1;
    w = pw;
    h = 600;
    if (w < 480) h = 450;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function getSatsColor(sats) {
    var p = Math.min(1, Math.max(0, (sats || 0) / 50000000));
    var r = Math.round(63 + p * 185);
    var g = Math.round(185 - p * 104);
    var b = Math.round(80 - p * 7);
    return { r: r, g: g, b: b };
  }

  function loop() {
    var t = Date.now() / 1000;
    var leftW = w < 768 ? w : Math.round(w * 0.6);
    var rightW = w - leftW;

    if (feeHistory.length > 0) {
      spawnTimer++;
      var spawnRate = Math.max(3, 8 - feeHistory.length * 0.02);
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        var entry = feeHistory[blockIndex % feeHistory.length];
        var fee = entry.avgFees || 5000000;
        blocks.push({
          x: -24,
          y: h * 0.14 + Math.random() * (h * 0.45),
          fee: fee,
          w: 20,
          h: 24 + Math.random() * 14,
          speed: 1.2 + Math.random() * 0.8
        });
        blockIndex = (blockIndex + 1) % feeHistory.length;
      }
    }

    var poolX = leftW - 55;
    for (var i = blocks.length - 1; i >= 0; i--) {
      var b = blocks[i];
      b.x += b.speed;
      if (b.x > poolX) {
        poolSats += b.fee;
        blocks.splice(i, 1);
        pulse = 1;
      }
    }

    if (blocks.length > 30) {
      blocks = blocks.slice(-20);
    }

    poolDisplay += (poolSats - poolDisplay) * 0.015;
    if (Math.abs(poolDisplay - poolSats) < 1) poolDisplay = poolSats;

    pulse *= 0.92;
    if (pulse < 0.01) pulse = 0;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    drawStream(leftW, h, t);
    if (rightW > 100) drawStats(leftW, rightW, h, t);

    var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(loop);
  }

  function drawStream(areaW, areaH, t) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Block Reward Stream', areaW / 2, 8);

    var poolLineX = areaW - 55;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(247,147,26,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(poolLineX, areaH * 0.08);
    ctx.lineTo(poolLineX, areaH * 0.72);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(247,147,26,0.2)';
    ctx.fillText('pool entrance', poolLineX, areaH * 0.08 - 2);

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var c = getSatsColor(b.fee);
      var alpha = Math.min(1, Math.max(0.15, (b.x + 24) / 100));
      var cx = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';

      ctx.shadowColor = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.12)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = cx;
      VIZ.roundRect(ctx, b.x, b.y, b.w, b.h, 3);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      VIZ.roundRect(ctx, b.x, b.y, b.w, 3, 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    var poolCX = areaW - 30;
    var poolCY = areaH * 0.4;
    var feeBTC = poolDisplay / 100000000;
    var poolR = Math.min(52, 26 + feeBTC * 80);
    var pulseR = poolR * (1 + pulse * 0.07);

    var glow = ctx.createRadialGradient(poolCX, poolCY, 0, poolCX, poolCY, pulseR * 1.6);
    glow.addColorStop(0, 'rgba(247,147,26,0.5)');
    glow.addColorStop(0.4, 'rgba(247,147,26,0.12)');
    glow.addColorStop(1, 'rgba(247,147,26,0)');
    ctx.beginPath();
    ctx.arc(poolCX, poolCY, pulseR * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(poolCX, poolCY, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = '#F7931A';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(poolCX, poolCY, pulseR * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillStyle = '#E8E5E0';
    ctx.fillText(feeBTC.toFixed(4), poolCX, poolCY - 6);
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('BTC fees', poolCX, poolCY + 16);

    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText('Fee Pool', poolCX, poolCY + pulseR + 8);
  }

  function drawStats(leftX, areaW, areaH, t) {
    var cardW = areaW - 24;
    var cardX = leftX + 12;
    var cardGap = 6;
    var cardH = (areaH - 28 - cardGap * 2) / 3;
    var totalBTC = 3.125 + poolDisplay / 100000000;
    var totalUSD = totalBTC * btcPrice;

    var y1 = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    VIZ.roundRect(ctx, cardX, y1, cardW, cardH, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Block Reward', cardX + 14, y1 + 10);

    ctx.font = 'bold 26px -apple-system, sans-serif';
    ctx.fillStyle = '#E8E5E0';
    ctx.fillText(fmtUSD(totalUSD), cardX + 14, y1 + 26);

    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(totalBTC.toFixed(4) + ' BTC', cardX + 14, y1 + 58);

    var y2 = y1 + cardH + cardGap;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    VIZ.roundRect(ctx, cardX, y2, cardW, cardH, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Subsidy vs Fees', cardX + 14, y2 + 10);

    var barW = cardW - 28;
    var barH = 18;
    var barY = y2 + cardH * 0.48;
    var subSats = 3.125 * 100000000;
    var totalSats = subSats + poolDisplay;
    var subRatio = totalSats > 0 ? subSats / totalSats : 1;
    var feeRatio = totalSats > 0 ? poolDisplay / totalSats : 0;

    if (totalSats > 0) {
      ctx.fillStyle = '#F7931A';
      VIZ.roundRect(ctx, cardX + 14, barY, barW * subRatio, barH, 3);
      ctx.fill();

      if (feeRatio > 0.01) {
        ctx.fillStyle = '#3FB950';
        VIZ.roundRect(ctx, cardX + 14 + barW * subRatio, barY, barW * feeRatio, barH, 3);
        ctx.fill();
      }

      ctx.textBaseline = 'top';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.textAlign = 'left';
      ctx.fillText('S: ' + (subRatio * 100).toFixed(1) + '%', cardX + 14, barY + barH + 4);
      ctx.textAlign = 'right';
      ctx.fillText('F: ' + (feeRatio * 100).toFixed(1) + '%', cardX + 14 + barW, barY + barH + 4);
    }

    var y3 = y2 + cardH + cardGap;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    VIZ.roundRect(ctx, cardX, y3, cardW, cardH, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('24h Fee Trend', cardX + 14, y3 + 10);

    if (sparklineData.length > 1) {
      var sx = cardX + 14;
      var sy = y3 + cardH * 0.38;
      var sw = cardW - 28;
      var sh = cardH * 0.48;

      var minV = Infinity, maxV = -Infinity;
      for (var i = 0; i < sparklineData.length; i++) {
        var v = sparklineData[i];
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      if (maxV - minV < 1) { maxV = minV * 1.2 + 1; minV = minV * 0.8; }
      var rangeV = maxV - minV;

      ctx.beginPath();
      for (var i = 0; i < sparklineData.length; i++) {
        var x = sx + (i / (sparklineData.length - 1)) * sw;
        var y = sy + sh - ((sparklineData[i] - minV) / rangeV) * sh;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(sx + sw, sy + sh);
      ctx.lineTo(sx, sy + sh);
      ctx.closePath();
      ctx.fillStyle = 'rgba(247,147,26,0.07)';
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#F7931A';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      for (var i = 0; i < sparklineData.length; i++) {
        var x = sx + (i / (sparklineData.length - 1)) * sw;
        var y = sy + sh - ((sparklineData[i] - minV) / rangeV) * sh;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      var lastV = sparklineData[sparklineData.length - 1];
      var lx = sx + sw;
      var ly = sy + sh - ((lastV - minV) / rangeV) * sh;
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#F7931A';
      ctx.fill();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillStyle = '#F7931A';
      ctx.fillText(fmtSats(lastV), lx - 2, ly - 3);
    }
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

  return { init: init, resize: resize };
})();
