var VIZ_Send = (function() {
  var canvas, ctx, w, h;
  var PAD = { top: 60, right: 150, bottom: 50, left: 70 };
  var bars = [];
  var economyFee = 0;
  var btcPrice = 0;
  var hoverIdx = -1;
  var mouseX = 0, mouseY = 0;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    DATA_ENGINE.onUpdate(function() {
      var s = DATA_ENGINE.get();
      bars = (s.fee_history || []).slice(-144);
      economyFee = s.fees.economyFee || 0;
      btcPrice = s.btc_price || 0;
    });
    DATA_ENGINE.start();
    tick();
  }

  function resize() {
    var r = canvas.parentElement
      ? canvas.parentElement.getBoundingClientRect()
      : { width: window.innerWidth };
    w = canvas.width = r.width || window.innerWidth;
    h = canvas.height = 350;
  }

  function onMove(e) {
    var r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    var i = hitTest(mouseX, mouseY);
    if (i !== hoverIdx) { hoverIdx = i; }
  }

  function onLeave() { hoverIdx = -1; }

  function hitTest(mx) {
    var n = bars.length;
    if (n === 0) return -1;
    var cw = (w - PAD.left - PAD.right) / n;
    var i = Math.floor((mx - PAD.left) / cw);
    if (i < 0 || i >= n) return -1;
    return i;
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    var n = bars.length;
    if (n === 0) { requestAnimationFrame(tick); return; }

    var cL = PAD.left, cR = w - PAD.right;
    var cT = PAD.top, cB = h - PAD.bottom;
    var cW = cR - cL, cH = cB - cT;

    var maxF = 1;
    for (var i = 0; i < n; i++) {
      var fr = bars[i].avgFeeRate || bars[i].avg_fee_rate || 0;
      if (fr > maxF) maxF = fr;
    }
    maxF = Math.ceil(maxF * 1.15) || 1;

    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#F0F0F0';
    ctx.font = '18px -apple-system, "SF Pro Display", Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Last 24 Hours of Bitcoin Fees', cL, 16);

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    var ySteps = 5;
    for (var i = 0; i <= ySteps; i++) {
      var v = (maxF / ySteps) * i;
      var y = cB - (v / maxF) * cH;
      ctx.beginPath();
      ctx.moveTo(cL, y);
      ctx.lineTo(cR, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px -apple-system, Helvetica, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(v < 1 ? v.toFixed(1) : v.toFixed(0), cL - 8, y);
    }

    ctx.save();
    ctx.translate(14, cT + cH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px -apple-system, Helvetica, sans-serif';
    ctx.fillText('sat/vB', 0, 0);
    ctx.restore();

    if (economyFee > 0) {
      var ecoY = cB - (economyFee / maxF) * cH;
      if (ecoY >= cT && ecoY <= cB) {
        ctx.strokeStyle = 'rgba(46, 160, 67, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cL, ecoY);
        ctx.lineTo(cR, ecoY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(46, 160, 67, 0.8)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.font = '10px -apple-system, Helvetica, sans-serif';
        ctx.fillText('Economy ' + economyFee + ' sat/vB', cR + 6, ecoY - 2);
      }
    }

    var now = Date.now();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px -apple-system, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var i = 0; i <= 4; i++) {
      var t = now - (4 - i) * 6 * 3600000;
      var d = new Date(t);
      var hh = d.getHours();
      var a = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
      ctx.fillText(hh + a, cL + (i / 4) * cW, cB + 8);
    }

    var bw = cW / n;
    for (var i = 0; i < n; i++) {
      var fr = bars[i].avgFeeRate || bars[i].avg_fee_rate || 0;
      var bh = (fr / maxF) * cH;
      var x = cL + i * bw;
      var y = cB - bh;
      var p = Math.min(1, fr / (maxF * 0.7));
      var r, g, b;
      if (p < 0.33) {
        var t = p / 0.33;
        r = Math.round(63 + t * (209 - 63));
        g = Math.round(185 + t * (190 - 185));
        b = Math.round(80 + t * (70 - 80));
      } else if (p < 0.66) {
        var t = (p - 0.33) / 0.33;
        r = Math.round(209 + t * (248 - 209));
        g = Math.round(190 + t * (144 - 190));
        b = Math.round(70 + t * (49 - 70));
      } else {
        var t = Math.min(1, (p - 0.66) / 0.34);
        r = 248;
        g = Math.round(144 - t * (144 - 81));
        b = Math.round(49 + t * (73 - 49));
      }
      var hi = (i === hoverIdx);
      if (hi) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, cT, bw, cH);
      }
      ctx.globalAlpha = hi ? 1 : 0.8;
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(Math.round(x) + 0.5, Math.round(y), Math.max(1, Math.round(bw) - 1), Math.round(bh));
      ctx.globalAlpha = 1;
    }

    var lx = cR + 10, ly = cT + 10;
    var items = [
      { label: 'Low', color: '#3FB950' },
      { label: 'Medium', color: '#D29922' },
      { label: 'High', color: '#F85149' }
    ];
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < items.length; i++) {
      var yy = ly + i * 22;
      ctx.fillStyle = items[i].color;
      ctx.fillRect(lx, yy, 10, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '11px -apple-system, Helvetica, sans-serif';
      ctx.fillText(items[i].label, lx + 16, yy + 5);
    }

    if (hoverIdx >= 0 && hoverIdx < n) {
      var e = bars[hoverIdx];
      var fr = e.avgFeeRate || e.avg_fee_rate || 0;
      var ts = e.timestamp != null ? e.timestamp : e.date ? new Date(e.date).getTime() / 1000 : 0;
      var d = new Date(ts * 1000);
      var feeUSD = (fr * btcPrice) / 100000000;
      var tw = 210, th = 86;
      var tx = mouseX + 16, ty = mouseY - 12;
      if (tx + tw > w - 8) tx = mouseX - tw - 16;
      if (ty + th > h - 8) ty = h - th - 8;
      if (ty < 8) ty = 8;

      ctx.fillStyle = 'rgba(16,14,10,0.96)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      roundRect(ctx, tx, ty, tw, th, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px -apple-system, Helvetica, sans-serif';
      ctx.fillText(
        d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tx + 12, ty + 10
      );
      ctx.fillStyle = '#F0F0F0';
      ctx.font = 'bold 18px -apple-system, Helvetica, sans-serif';
      ctx.fillText(fr.toFixed(1) + ' sat/vB', tx + 12, ty + 28);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '12px -apple-system, Helvetica, sans-serif';
      ctx.fillText('$' + feeUSD.toFixed(2) + ' USD/vB', tx + 12, ty + 54);
    }

    requestAnimationFrame(tick);
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

  return { init: init };
})();
