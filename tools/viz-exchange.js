var VIZ_Exchange = (function() {
  var canvas, ctx, w = 0, h = 0;
  var padding = { top: 40, right: 20, bottom: 50, left: 70 };
  var maxBatchSize = 100;
  var dragX = 20;
  var isDragging = false;
  var economyFee = 3;
  var btcPrice = 60000;
  var showTooltip = false;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    DATA_ENGINE.onUpdate(function() {
      var fees = DATA_ENGINE.get().fees || {};
      var price = DATA_ENGINE.get().btc_price || 0;
      if (fees.economyFee) economyFee = fees.economyFee;
      if (price) btcPrice = price;
    });

    DATA_ENGINE.start();
    loop();
  }

  function resize() {
    var parent = canvas.parentElement;
    var pw = parent ? parent.clientWidth : window.innerWidth;
    if (pw < 100) pw = window.innerWidth;
    canvas.width = pw;
    canvas.height = 350;
    w = canvas.width;
    h = canvas.height;
  }

  function costIndividual(n) {
    return n * 150 * economyFee * btcPrice / 100000000;
  }

  function costBatched(n) {
    return (80 + n * 18) * economyFee * btcPrice / 100000000;
  }

  function maxCost() {
    return costIndividual(maxBatchSize) * 1.12;
  }

  function mapX(n) {
    var plotW = w - padding.left - padding.right;
    return padding.left + (n / maxBatchSize) * plotW;
  }

  function mapY(cost) {
    var plotH = h - padding.top - padding.bottom;
    return h - padding.bottom - (cost / maxCost()) * plotH;
  }

  function unmapX(px) {
    var plotW = w - padding.left - padding.right;
    var val = (px - padding.left) / plotW * maxBatchSize;
    return Math.max(0, Math.min(maxBatchSize, Math.round(val)));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    var plotL = padding.left;
    var plotR = w - padding.right;
    var plotT = padding.top;
    var plotB = h - padding.bottom;
    var plotW = plotR - plotL;
    var plotH = plotB - plotT;
    var mCost = maxCost();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var y = plotT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(plotL, y);
      ctx.lineTo(plotR, y);
      ctx.stroke();
    }
    for (var i = 0; i <= 5; i++) {
      var x = plotL + (i / 5) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, plotT);
      ctx.lineTo(x, plotB);
      ctx.stroke();
    }

    var grad = ctx.createLinearGradient(0, plotT, 0, plotB);
    grad.addColorStop(0, 'rgba(36, 199, 120, 0.30)');
    grad.addColorStop(1, 'rgba(36, 199, 120, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (var n = 0; n <= maxBatchSize; n++) {
      var x = mapX(n);
      var y = mapY(costBatched(n));
      if (n === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (var n = maxBatchSize; n >= 0; n--) {
      var x = mapX(n);
      var y = mapY(costIndividual(n));
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#F85149';
    ctx.lineWidth = 2;
    for (var n = 0; n <= maxBatchSize; n++) {
      var x = mapX(n);
      var y = mapY(costIndividual(n));
      if (n === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#3FB950';
    ctx.lineWidth = 2.5;
    for (var n = 0; n <= maxBatchSize; n++) {
      var x = mapX(n);
      var y = mapY(costBatched(n));
      if (n === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    var dX = Math.round(dragX);
    var vx = mapX(dX);
    var indY = mapY(costIndividual(dX));
    var batY = mapY(costBatched(dX));

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vx, plotT);
    ctx.lineTo(vx, plotB);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#F85149';
    ctx.beginPath();
    ctx.arc(vx, indY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3FB950';
    ctx.beginPath();
    ctx.arc(vx, batY, 4, 0, Math.PI * 2);
    ctx.fill();

    if (showTooltip || isDragging) {
      var savings = costIndividual(dX) - costBatched(dX);
      var ttX = vx + 14;
      var ttY = batY - 20;
      if (ttX + 170 > w) ttX = vx - 184;
      if (ttY < 2) ttY = 2;
      if (ttY + 80 > h) ttY = h - 82;

      ctx.fillStyle = 'rgba(18, 15, 12, 0.94)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      roundRect(ctx, ttX, ttY, 170, 74, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Batch size: ' + dX, ttX + 12, ttY + 8);

      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillStyle = '#F85149';
      ctx.fillText('Individual:  $' + costIndividual(dX).toFixed(2), ttX + 12, ttY + 26);
      ctx.fillStyle = '#3FB950';
      ctx.fillText('Batched:     $' + costBatched(dX).toFixed(2), ttX + 12, ttY + 40);
      ctx.fillStyle = '#24C778';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.fillText('Savings:     $' + savings.toFixed(2), ttX + 12, ttY + 56);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Batch vs Individual Withdrawal Cost', padding.left, 10);

    var legX = plotR - 175;
    var legY = 10;
    ctx.fillStyle = '#3FB950';
    ctx.fillRect(legX, legY + 5, 16, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Batched', legX + 22, legY + 2);

    ctx.fillStyle = '#F85149';
    ctx.fillRect(legX, legY + 22, 16, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Individual', legX + 22, legY + 19);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Withdrawals in batch', w / 2, h - 16);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.translate(14, (plotT + plotB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Total cost (USD)', 0, 0);
    ctx.restore();

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px -apple-system, sans-serif';
    for (var i = 0; i <= 4; i++) {
      var y = plotT + (i / 4) * plotH;
      var val = mCost - (i / 4) * mCost;
      ctx.fillText('$' + val.toFixed(2), plotL - 6, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px -apple-system, sans-serif';
    for (var i = 0; i <= 5; i++) {
      var x = plotL + (i / 5) * plotW;
      ctx.fillText(Math.round((i / 5) * maxBatchSize).toString(), x, plotB + 5);
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

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e) {
    var pos = getPos(e);
    if (Math.abs(pos.x - mapX(dragX)) < 24) {
      isDragging = true;
      showTooltip = true;
    }
  }

  function onMouseMove(e) {
    var pos = getPos(e);
    if (isDragging) dragX = unmapX(pos.x);
    var near = Math.abs(pos.x - mapX(dragX)) < 24;
    canvas.style.cursor = near ? 'ew-resize' : 'default';
  }

  function onMouseUp() { isDragging = false; }
  function onMouseLeave() { isDragging = false; showTooltip = false; canvas.style.cursor = 'default'; }

  function onTouchStart(e) {
    e.preventDefault();
    var t = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    if (Math.abs(pos.x - mapX(dragX)) < 40) {
      isDragging = true;
      showTooltip = true;
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!isDragging) return;
    var t = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    dragX = unmapX(t.clientX - rect.left);
  }

  function onTouchEnd() { isDragging = false; showTooltip = false; }

  return { init: init };
})();
