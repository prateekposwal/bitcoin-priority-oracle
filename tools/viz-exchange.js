var VIZ_Exchange = (function() {
  var canvas, ctx, w = 0, h = 0;
  var droplets = [];
  var splashes = [];
  var individualPool = 0;
  var batchedPool = 0;
  var totalSaved = 0;
  var batchDiscount = 0.60;
  var isDragging = false;
  var economyFee = 3;
  var btcPrice = 60000;
  var spawnTimer = 0;
  var indivCost = 0;
  var batchCost = 0;
  var lastIndivCost = 0;
  var lastBatchCost = 0;
  var gravity = 0.08;
  var poolY = 0;
  var titleOpacity = 1;

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

    if (typeof DATA_ENGINE !== 'undefined') {
      var de = DATA_ENGINE;
      var fees = de.get().fees || {};
      var price = de.get().btc_price || 0;
      if (fees.economyFee) economyFee = fees.economyFee;
      if (price) btcPrice = price;
      de.onUpdate(function() {
        var fees = de.get().fees || {};
        var price = de.get().btc_price || 0;
        if (fees.economyFee) economyFee = fees.economyFee;
        if (price) btcPrice = price;
      });
    }

    indivCost = 150 * economyFee * btcPrice / 100000000;
    batchCost = indivCost * batchDiscount;

    loop();
  }

  function resize() {
    var r = VIZ.responsiveSize(canvas, 500);
    w = r.w;
    h = r.h;
    ctx = r.ctx;
    poolY = h - 80;
  }

  function costIndividual() {
    return 150 * economyFee * btcPrice / 100000000;
  }

  function costBatched() {
    return costIndividual() * batchDiscount;
  }

  function spawnDroplet() {
    var isIndividual = Math.random() < 0.4;
    var x = w * 0.15 + Math.random() * w * 0.7;
    return {
      x: x,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.3,
      vy: Math.random() * 0.5 + 0.3,
      radius: 2 + Math.random() * 2,
      isIndividual: isIndividual,
      life: 1,
      splashed: false,
      targetX: isIndividual ? w * 0.25 : w * 0.75,
      color: isIndividual ? '#F85149' : '#3FB950'
    };
  }

  function createSplash(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 2 + 0.5;
      splashes.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: 1 + Math.random() * 1.5,
        color: color,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    var t = Date.now() / 1000;

    ctx.save();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Batch vs Individual — Savings Waterfall', w / 2, 14);

    indivCost = costIndividual();
    batchCost = costBatched();

    var dropCount = w < 480 ? 1 : w < 768 ? 2 : 3;
    spawnTimer += dropCount;
    if (spawnTimer >= 8) {
      for (var i = 0; i < Math.floor(spawnTimer / 8); i++) {
        droplets.push(spawnDroplet());
      }
      spawnTimer = spawnTimer % 8;
    }

    for (var i = droplets.length - 1; i >= 0; i--) {
      var d = droplets[i];
      d.vy += gravity;
      d.x += d.vx;
      d.y += d.vy;

      if (d.y >= poolY) {
        if (!d.splashed) {
          d.splashed = true;
          createSplash(d.x, poolY, d.color, 6 + Math.floor(Math.random() * 4));
          if (d.isIndividual) {
            individualPool += indivCost * 0.01;
          } else {
            batchedPool += batchCost * 0.01;
            totalSaved += (indivCost - batchCost) * 0.01;
          }
        }
        d.life -= 0.04;
        if (d.life <= 0 || d.y > poolY + 40) {
          droplets.splice(i, 1);
          continue;
        }
      }

      var alpha = d.y < 0 ? Math.max(0, 1 + d.y / 20) : 1;
      ctx.globalAlpha = alpha * d.life;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (var i = splashes.length - 1; i >= 0; i--) {
      var s = splashes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.05;
      s.life -= s.decay;
      if (s.life <= 0) {
        splashes.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    var poolBaseY = poolY + 4;
    var poolMaxW = w * 0.28;

    var indivPct = Math.min(1, individualPool / Math.max(0.01, individualPool + batchedPool) * 2);
    var batchedPct = Math.min(1, batchedPool / Math.max(0.01, individualPool + batchedPool) * 2);

    ctx.fillStyle = 'rgba(248, 81, 73, 0.3)';
    ctx.beginPath();
    ctx.ellipse(w * 0.25, poolBaseY, 4 + indivPct * poolMaxW * 0.5, 8 + indivPct * 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(63, 185, 80, 0.3)';
    ctx.beginPath();
    ctx.ellipse(w * 0.75, poolBaseY, 4 + batchedPct * poolMaxW * 0.5, 8 + batchedPct * 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#F85149';
    ctx.fillText('Individual ($' + individualPool.toFixed(2) + ')', w * 0.25, poolBaseY + 14);

    ctx.fillStyle = '#3FB950';
    ctx.fillText('Batched ($' + batchedPool.toFixed(2) + ')', w * 0.75, poolBaseY + 14);

    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.fillStyle = '#24C778';
    ctx.fillText('Total saved: $' + totalSaved.toFixed(2), w / 2, poolBaseY + 32);

    var savingsBarW = Math.min(300, w * 0.5);
    var savingsBarX = (w - savingsBarW) / 2;
    var savingsBarY = poolBaseY + 52;
    var savingsPct = Math.min(1, totalSaved / Math.max(0.01, totalSaved + individualPool + batchedPool) * 3);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    VIZ.roundRect(ctx, savingsBarX, savingsBarY, savingsBarW, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#3FB950';
    VIZ.roundRect(ctx, savingsBarX, savingsBarY, savingsBarW * savingsPct, 10, 5);
    ctx.fill();

    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Savings efficiency', w / 2, savingsBarY + 14);

    var discountLabel = 'Batch efficiency: ' + Math.round(batchDiscount * 100) + '%';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(discountLabel, w - 16, 14);

    if (isDragging) {
      var dragX = 0;
      var dragIndicatorY = 36;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Drag to adjust batch discount: ' + Math.round(batchDiscount * 100) + '%', 16, dragIndicatorY);
    }

    ctx.restore();
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
    isDragging = true;
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    var pos = getPos(e);
    var pct = pos.x / w;
    batchDiscount = Math.max(0.1, Math.min(1.0, 0.3 + pct * 0.7));
  }

  function onMouseUp() { isDragging = false; }
  function onMouseLeave() { isDragging = false; }

  function onTouchStart(e) {
    e.preventDefault();
    isDragging = true;
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!isDragging) return;
    var t = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    var pct = (t.clientX - rect.left) / w;
    batchDiscount = Math.max(0.1, Math.min(1.0, 0.3 + pct * 0.7));
  }

  function onTouchEnd() { isDragging = false; }

  return { init: init, resize: resize };
})();
