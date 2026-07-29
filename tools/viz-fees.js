// Bitcoin Sahi — Living Fee Visualization
// Never static. Always breathing, flowing, pulsing.

var VIZ_Fees = (function() {
  var canvas, ctx;
  var w = 0, h = 0;
  var bars = [];
  var maxBars = 144;
  var scrollSpeed = 0.3;
  var scrollOffset = 0;
  var ambientHue = 120; // starts green

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    
    // Initialize bars with data
    DATA_ENGINE.onUpdate(function() {
      var data = DATA_ENGINE.get().fee_history || [];
      for (var i = 0; i < Math.min(data.length, maxBars); i++) {
        var entry = data[data.length - 1 - i];
        var feeRate = Math.min(500, Math.max(0.1, entry.avgFees / 2500000));
        if (!bars[i]) bars[i] = { fee: feeRate, targetFee: feeRate, height: 0, targetHeight: 0, age: 0 };
        bars[i].targetFee = feeRate;
        bars[i].targetHeight = (feeRate / 50) * h * 0.7;
        bars[i].age = 0;
      }
      // Update ambient hue based on current fees
      var fees = DATA_ENGINE.get().fees || {};
      var fastest = fees.fastestFee || 3;
      ambientHue = fastest > 20 ? 0 : fastest > 10 ? 30 : 120;
    });

    // Start animation
    DATA_ENGINE.start();
    loop();
  }

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function loop() {
    var t = Date.now() / 1000;
    
    // Scroll bars continuously
    scrollOffset = (scrollOffset + scrollSpeed) % 1;
    
    // Smooth bar transitions
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      b.fee += (b.targetFee - b.fee) * 0.05;
      b.height += (b.targetHeight - b.height) * 0.05;
      b.age++;
    }

    // Draw
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);
    
    // Ambient glow based on fee level
    var ambientR = ambientHue === 0 ? 248 : ambientHue === 30 ? 248 : 63;
    var ambientG = ambientHue === 0 ? 81 : ambientHue === 30 ? 191 : 185;
    var ambientB = ambientHue === 0 ? 73 : ambientHue === 30 ? 36 : 80;
    var ambientGlow = Math.sin(t * 0.5) * 0.02 + 0.03;
    ctx.fillStyle = 'rgba(' + ambientR + ',' + ambientG + ',' + ambientB + ',' + ambientGlow + ')';
    ctx.fillRect(0, 0, w, h);

    // Draw flowing bars
    var barWidth = w / maxBars;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      if (b.height < 1) continue;
      
      var x = w - ((i + scrollOffset) * barWidth);
      var barH = b.height;
      var y = h - barH;
      
      // Color based on fee rate
      var p = Math.min(1, Math.max(0, b.fee / 50));
      var r = Math.round(p * 248 + (1 - p) * 63);
      var g = Math.round((1 - p) * 185 + p * 81);
      var blue = Math.round((1 - p) * 80 + p * 73);
      
      // New bars get a brighter glow
      var ageFactor = Math.min(1, b.age / 30);
      var glowAlpha = 0.15 * (1 - ageFactor) + 0.05;
      
      // Glow behind bar
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + blue + ',' + glowAlpha + ')';
      ctx.fillRect(x - 2, y - 4, barWidth + 4, barH + 8);
      
      // The bar itself
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + blue + ')';
      ctx.fillRect(x, y, barWidth - 1, barH);
      
      // Subtle highlight on top of bar
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y, barWidth - 1, 2);
    }

    // Breathing pulse on the entire canvas
    var breath = Math.sin(t * 1.5) * 0.015 + 1;
    ctx.globalAlpha = breath;
    
    // Subtle vignette
    var grad = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.globalAlpha = 1;
    
    requestAnimationFrame(loop);
  }

  return { init: init };
})();
