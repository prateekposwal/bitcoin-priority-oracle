// Bitcoin Sahi — Living Fee Visualization
// Obviously alive — particles float, numbers animate, bars flow

var VIZ_Fees = (function() {
  var canvas, ctx, w = 0, h = 0;
  var bars = [];
  var particles = [];
  var displayFee = 3;
  var targetFee = 3;
  var scrollOffset = 0;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    
    DATA_ENGINE.onUpdate(function() {
      var data = DATA_ENGINE.get().fee_history || [];
      var fees = DATA_ENGINE.get().fees || {};
      targetFee = fees.fastestFee || 3;
      
      for (var i = 0; i < Math.min(data.length, 144); i++) {
        var entry = data[data.length - 1 - i];
        var feeRate = Math.min(500, Math.max(0.1, entry.avgFees / 2500000));
        if (!bars[i]) bars[i] = { fee: 1, h: 0, age: 0 };
        bars[i].targetFee = feeRate;
        bars[i].age = bars[i].age || 0;
      }
    });
    
    DATA_ENGINE.start();
    
    // Spawn particles continuously
    setInterval(function() {
      var count = w < 480 ? 1 : w < 768 ? 2 : 3;
      for (var i = 0; i < count; i++) {
        var fee = Math.random() * 30 + 1;
        var p = Math.min(1, fee / 50);
        particles.push({
          x: Math.random() * (w || 800),
          y: (h || 600) + 20,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.5 + 0.2),
          r: Math.round(p * 248 + (1-p) * 63),
          g: Math.round((1-p) * 185 + p * 81),
          b: Math.round((1-p) * 80 + p * 73),
          life: 1,
          size: Math.random() * 3 + 1
        });
      }
    }, 30);

    loop();
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function loop() {
    var t = Date.now() / 1000;
    
    // Smooth fee display
    displayFee += (targetFee - displayFee) * 0.05;
    scrollOffset = (scrollOffset + 0.4) % 1;
    
    // Clamp
    if (Math.abs(displayFee - targetFee) < 0.01) displayFee = targetFee;
    
    // Update bars
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      b.fee += (b.targetFee - b.fee) * 0.03;
      b.h = (b.fee / 50) * h * 0.7;
      b.age++;
    }

    // Draw background
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);
    
    // Ambient glow
    var pct = Math.min(1, displayFee / 50);
    var ar = Math.round(pct * 248 + (1-pct) * 63);
    var ag = Math.round((1-pct) * 185 + pct * 81);
    var ab = Math.round((1-pct) * 80 + pct * 73);
    var aglow = Math.sin(t * 0.5) * 0.02 + 0.04;
    ctx.fillStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',' + aglow + ')';
    ctx.fillRect(0, 0, w, h);

    // Draw bars
    var bw = w / 144;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      if (b.h < 2) continue;
      var x = w - ((i + scrollOffset) * bw);
      var barH = b.h;
      var y = h - barH;
      var p = Math.min(1, b.fee / 50);
      var r = Math.round(p * 248 + (1-p) * 63);
      var g = Math.round((1-p) * 185 + p * 81);
      var bl = Math.round((1-p) * 80 + p * 73);
      var glow = Math.min(0.25, 0.05 + 0.2 * Math.exp(-b.age / 20));
      
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + bl + ',' + glow + ')';
      ctx.fillRect(x - 2, y - 4, bw + 4, barH + 8);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + bl + ')';
      ctx.fillRect(x, y, bw - 1, barH);
    }

    // Draw floating particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.005;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Fee counter — big, centered, smooth
    var feeText = displayFee.toFixed(0);
    var feeColor = displayFee > 20 ? '#F85149' : displayFee > 10 ? '#D29922' : '#3FB950';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Glow behind number
    ctx.font = '120px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillText(feeText, w/2 + 3, h/2 - 60 + 3);
    
    // Main fee number
    ctx.fillStyle = feeColor;
    ctx.fillText(feeText, w/2, h/2 - 60);
    
    // Label
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('sat/vB — fastest fee', w/2, h/2 - 60 + 80);

    // Vignette
    var grad = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.9);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(loop);
  }

  function getFeeAt(idx) {
    if (idx < 0 || idx >= bars.length) return null;
    return bars[idx].fee || null;
  }

  return { init: init, getFeeAt: getFeeAt };
})();
