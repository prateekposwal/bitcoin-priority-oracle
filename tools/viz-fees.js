// Bitcoin Sahi — Hero Fee Visualization
// Full-viewport canvas: flowing stream of 144 blocks as colored vertical bars
// No text labels, no axes, no gridlines — the data speaks through color and motion
// Export: VIZ_Fees
// Depends on: DATA_ENGINE (data-engine.js)

var VIZ_Fees = (function() {
  var canvas, ctx, w, h;
  var animId = null;
  var dataCache = { fee_history: [], fees: {} };
  var time = 0;
  var lastFetchTime = 0;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    DATA_ENGINE.onUpdate(function(d) {
      dataCache.fee_history = d.fee_history || [];
      dataCache.fees = d.fees || {};
    });

    pollData();
    loop();
  }

  function pollData() {
    var now = Date.now();
    if (now - lastFetchTime > 120000) {
      lastFetchTime = now;
      var d = DATA_ENGINE.get();
      dataCache.fee_history = d.fee_history || [];
      dataCache.fees = d.fees || {};
    }
    setTimeout(pollData, 120000);
  }

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function loop() {
    time += 0.016;
    draw(ctx, w, h, time);
    animId = requestAnimationFrame(loop);
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    var data = dataCache.fee_history || [];
    var fees = dataCache.fees || {};
    var fastestFee = fees.fastestFee != null ? fees.fastestFee : 3;
    var maxFee = 50;

    var ambientColor = fastestFee > 20 ? 'rgba(248,81,73,0.05)' :
                       fastestFee > 10 ? 'rgba(248,81,73,0.02)' :
                       'rgba(63,185,80,0.03)';
    ctx.fillStyle = ambientColor;
    ctx.fillRect(0, 0, w, h);

    var count = Math.min(data.length, 144);
    if (count === 0) {
      var pulse = Math.sin(t * 2) * 0.02 + 0.98;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#2A2420';
      ctx.font = '16px "SF Mono", Monaco, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('waiting for data...', w / 2, h / 2);
      ctx.globalAlpha = 1;
      return;
    }

    var barWidth = w / 144;
    var breathing = Math.sin(t * 1.5) * 0.03 + 0.97;

    for (var i = 0; i < count; i++) {
      var idx = data.length - 1 - i;
      var entry = data[idx];
      if (!entry) continue;
      var feeRate = (entry.avgFees || 0) / 2500000;
      feeRate = Math.max(0.1, Math.min(500, feeRate));
      var barHeight = Math.min(h * 0.8, (feeRate / maxFee) * h * 0.8);
      if (barHeight < 2) barHeight = 2;
      var x = w - (i * barWidth);
      var y = h - barHeight;

      var p = Math.min(1, Math.max(0, feeRate / maxFee));
      var r = Math.round(p * 248 + (1 - p) * 63);
      var g = Math.round((1 - p) * 185 + p * 81);
      var b = Math.round((1 - p) * 80 + p * 73);

      var glow = (i === 0) ? 0.3 : 0.1;
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + glow + ')';
      ctx.fillRect(x - 1, y - 4, barWidth + 2, barHeight + 8);

      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      var bw = Math.max(1, barWidth - 1);
      ctx.fillRect(x, y, bw, barHeight);
    }

    var pulse = Math.sin(t * 2) * 0.02 + 0.98;
    ctx.globalAlpha = pulse;
    ctx.globalAlpha = 1;
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  return {
    init: init,
    stop: stop
  };
})();
