// Bitcoin Sahi — UTXO Set Composition Dashboard
// Horizon bar chart: Financial (green), Dust (gray), Inscription (orange)
// Bar width = real estimated counts from block_height and mempool data
// Growth trend line shows UTXO set acceleration

var VIZ_UTXO = (function() {
  var AVG_TX_PER_BLOCK = 2500;
  var AVG_OUTPUTS_PER_TX = 2.2;
  var DUST_FRAC = 0.30;
  var INSCRIPTION_FRAC = 0.02;

  var GREEN = '#3FB950';
  var GRAY = '#888888';
  var ORANGE = '#F7931A';

  var stats = {
    total: 0,
    financial: 0,
    dust: 0,
    inscription: 0,
    growthRate: 0
  };

  var growthHistory = [];
  var MAX_HISTORY = 120;
  var blockHeight = 0;
  var mempoolCount = 0;
  var _initialized = false;

  function init(canvasId) {
    VIZ.create(canvasId, { height: 300 });

    if (typeof DATA_ENGINE !== 'undefined' && DATA_ENGINE.get) {
      var d = DATA_ENGINE.get();
      if (d) {
        blockHeight = d.block_height || blockHeight;
        mempoolCount = d.mempool ? d.mempool.count : mempoolCount;
        recalc(d);
      }

      DATA_ENGINE.onUpdate(function(d) {
        blockHeight = d.block_height || blockHeight;
        mempoolCount = d.mempool ? d.mempool.count : mempoolCount;
        recalc(d);
      });
      _initialized = true;
    }

    VIZ.start(canvasId, draw, 16);
  }

  function recalc(d) {
    var bh = d.block_height || blockHeight || 0;
    var total = Math.max(1, bh * AVG_TX_PER_BLOCK * AVG_OUTPUTS_PER_TX);
    stats.total = total;
    stats.inscription = Math.round(total * INSCRIPTION_FRAC);
    stats.dust = Math.round(total * DUST_FRAC);
    stats.financial = total - stats.dust - stats.inscription;

    growthHistory.push(total);
    if (growthHistory.length > MAX_HISTORY) {
      growthHistory.shift();
    }

    if (growthHistory.length > 5) {
      var recent = growthHistory.slice(-10);
      stats.growthRate = (recent[recent.length - 1] - recent[0]) / recent[0];
    }
  }

  function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(Math.round(n));
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);

    var barAreaTop = 44;
    var barH = 32;
    var gap = 10;
    var labelW = 100;
    var barMaxW = w - labelW - 30;
    var maxVal = Math.max(stats.financial, stats.dust, stats.inscription, 1);

    ctx.fillStyle = '#999';
    ctx.font = '10px "SF Mono", Monaco, monospace';
    ctx.fillText('UTXO SET COMPOSITION', 10, 14);

    ctx.fillStyle = '#555';
    ctx.font = '9px "SF Mono", Monaco, monospace';
    ctx.fillText('Block ' + blockHeight.toLocaleString() + '  ·  Mempool ' + mempoolCount.toLocaleString() + ' tx', 10, 27);

    var breath = 0.85 + Math.sin(t * 1.5) * 0.08;

    var bars = [
      { label: 'Financial', key: 'financial', color: GREEN, count: stats.financial },
      { label: 'Dust', key: 'dust', color: GRAY, count: stats.dust },
      { label: 'Inscriptions', key: 'inscription', color: ORANGE, count: stats.inscription }
    ];

    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var y = barAreaTop + i * (barH + gap);
      var frac = b.count / maxVal;
      var barW = Math.max(4, frac * barMaxW);

      ctx.fillStyle = '#999';
      ctx.font = '10px "SF Mono", Monaco, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(b.label, labelW - 8, y + barH / 2 + 4);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#151520';
      VIZ.roundRect(ctx, labelW, y, barMaxW, barH, 4);
      ctx.fill();

      var alpha = 0.75 + Math.sin(t * 1.5 + i * 1.2) * 0.1;
      ctx.globalAlpha = Math.min(1, alpha * breath);
      ctx.fillStyle = b.color;
      VIZ.roundRect(ctx, labelW, y, barW, barH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#CCC';
      ctx.font = '10px "SF Mono", Monaco, monospace';
      ctx.fillText(formatCount(b.count) + ' (' + Math.round(frac * 100) + '%)', labelW + 8, y + barH / 2 + 4);
    }

    var trendY = barAreaTop + 3 * (barH + gap) + 16;
    var trendH = 55;

    ctx.fillStyle = '#101018';
    VIZ.roundRect(ctx, 10, trendY, w - 20, trendH, 4);
    ctx.fill();

    ctx.fillStyle = '#555';
    ctx.font = '9px "SF Mono", Monaco, monospace';
    ctx.fillText('UTXO GROWTH TREND  ·  ' + (stats.growthRate >= 0 ? '+' : '') + (stats.growthRate * 100).toFixed(2) + '%/period', 16, trendY + 13);

    if (growthHistory.length > 1) {
      var min = growthHistory[0];
      var max = growthHistory[0];
      for (var gi = 0; gi < growthHistory.length; gi++) {
        if (growthHistory[gi] < min) min = growthHistory[gi];
        if (growthHistory[gi] > max) max = growthHistory[gi];
      }
      var range = max - min || 1;
      var chartW = w - 40;
      var chartY0 = trendY + trendH - 8;
      var chartH2 = trendH - 22;

      ctx.strokeStyle = 'rgba(63,185,80,0.12)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (var gi = 0; gi < growthHistory.length; gi++) {
        var x = 20 + (gi / (growthHistory.length - 1)) * chartW;
        var y = chartY0 - ((growthHistory[gi] - min) / range) * chartH2;
        if (gi === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#3FB950';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var gi = 0; gi < growthHistory.length; gi++) {
        var x = 20 + (gi / (growthHistory.length - 1)) * chartW;
        var y = chartY0 - ((growthHistory[gi] - min) / range) * chartH2;
        if (gi === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#666';
    ctx.font = '9px "SF Mono", Monaco, monospace';
    ctx.fillText('Total est. ' + formatCount(stats.total) + ' UTXOs  |  Financial ' + formatCount(stats.financial) + '  Dust ' + formatCount(stats.dust) + '  Inscriptions ' + formatCount(stats.inscription), 16, trendY + trendH + 14);
  }

  return { init: init };
})();
