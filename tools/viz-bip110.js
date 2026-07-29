// Bitcoin Sahi — BIP-110 Fork Visualization
// Two columns: BIP-110 node (left) vs regular node (right)
// Blocks on left that DON'T signal bit 4 turn red — chain divergence visible
// Uses VIZ.create() / VIZ.start() from viz-core.js

var VIZ_BIP110 = (function() {
  var blocks = [];
  var MAX_VISIBLE = 18;
  var splitDetected = false;
  var particles = [];

  function init(canvasId) {
    VIZ.create(canvasId, { height: 500 });
    seedBlocks();
    VIZ.start(canvasId, draw);
  }

  function seedBlocks() {
    blocks = [];
    var pct = getSignalPct();
    for (var i = MAX_VISIBLE - 1; i >= 0; i--) {
      blocks.push({
        height: 960000 + i,
        signaling: Math.random() < pct,
        age: i * 4
      });
    }
    updateSplit();
  }

  function getSignalPct() {
    if (window.SIGNAL_PCT !== undefined) {
      return window.SIGNAL_PCT > 1 ? window.SIGNAL_PCT / 100 : window.SIGNAL_PCT;
    }
    return 0.6;
  }

  function updateSplit() {
    splitDetected = false;
    for (var i = 0; i < blocks.length; i++) {
      if (!blocks[i].signaling) { splitDetected = true; break; }
    }
  }

  function emitSpark(x, y) {
    for (var i = 0; i < 5; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60 - 20,
        life: 1,
        maxLife: 1,
        color: '#F85149',
        size: 2 + Math.random() * 3
      });
    }
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#F5F2ED';
    ctx.fillRect(0, 0, w, h);

    // ── Layout ──
    var topY = 32;
    var bottomY = 44;
    var areaH = h - topY - bottomY;
    var blockH = Math.min(22, areaH / MAX_VISIBLE);
    var spacing = blockH;
    var totalH = MAX_VISIBLE * spacing;
    var startY = topY + (areaH - totalH) / 2;
    var blockW = blockH * 1.2;
    var lhsCX = Math.round(w * 0.22);
    var rhsCX = Math.round(w * 0.78);
    var halfCol = Math.round(w * 0.18);
    var chainSplitX = Math.round(w * 0.50);

    // ── Column headers ──
    ctx.fillStyle = '#666';
    ctx.font = '9px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BIP-110 NODE', lhsCX, 14);
    ctx.fillText('REGULAR NODE', rhsCX, 14);

    // ── Subtle column backgrounds ──
    ctx.fillStyle = 'rgba(48,54,61,0.08)';
    VIZ.roundRect(ctx, lhsCX - halfCol, startY - 4, halfCol * 2, totalH + 8, 6);
    ctx.fill();
    VIZ.roundRect(ctx, rhsCX - halfCol, startY - 4, halfCol * 2, totalH + 8, 6);
    ctx.fill();

    // ── Draw blocks (newest at top) ──
    for (var i = 0; i < blocks.length && i < MAX_VISIBLE; i++) {
      var b = blocks[i];
      var y = Math.round(startY + i * spacing);
      var lx = Math.round(lhsCX - blockW / 2);
      var rx = Math.round(rhsCX - blockW / 2);
      var cy = y + Math.round(blockH / 2);
      var x1 = lx + Math.round(blockW) + 2;
      var x2 = rx - 2;

      // Connecting link between corresponding blocks
      if (b.signaling) {
        ctx.strokeStyle = 'rgba(63,185,80,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, cy);
        ctx.lineTo(x2, cy);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(248,81,73,' + (0.3 + Math.sin(t * 5 + i * 2) * 0.15 + 0.15) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        var mid = (x1 + x2) / 2;
        ctx.moveTo(x1, cy);
        ctx.lineTo(mid - 5, cy - 4);
        ctx.lineTo(mid + 5, cy + 4);
        ctx.lineTo(x2, cy);
        ctx.stroke();
      }

      // Left column — BIP-110 node
      var leftColor = VIZ.blockColor(b.signaling);
      drawBlock(ctx, lx, y, blockW, blockH, leftColor, b.age, t);

      // Non-signaling cross
      if (!b.signaling) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✗', lhsCX, cy + 3);
      }

      // Right column — Regular node (always valid)
      drawBlock(ctx, rx, y, blockW, blockH, '#1E88E5', b.age, t);

      // Height label
      ctx.fillStyle = '#444';
      ctx.font = '7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(b.height, lhsCX - halfCol - 3, cy + 3);

      b.age++;
    }

    // ── Chain split indicator ──
    if (splitDetected) {
      var flash = Math.sin(t * 3.5) * 0.3 + 0.7;

      ctx.strokeStyle = 'rgba(248,81,73,' + (flash * 0.25) + ')';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(chainSplitX, startY);
      ctx.lineTo(chainSplitX, startY + totalH);
      ctx.stroke();
      ctx.setLineDash([]);

      var grad = ctx.createRadialGradient(chainSplitX, startY + totalH / 2, 0, chainSplitX, startY + totalH / 2, halfCol * 0.6);
      grad.addColorStop(0, 'rgba(248,81,73,' + (flash * 0.08) + ')');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(chainSplitX - halfCol, startY, halfCol * 2, totalH);

      ctx.fillStyle = 'rgba(248,81,73,' + flash + ')';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ CHAIN DIVERGENCE', chainSplitX, h - 12);
    }

    // ── Particles ──
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var p = particles[pi];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.life -= 0.016 * 0.8;
      if (p.life <= 0) { particles.splice(pi, 1); continue; }
      var a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Legend ──
    var lx = Math.round(w * 0.5 - 110);
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillStyle = '#3FB950';
    ctx.textAlign = 'left';
    ctx.fillText('●', lx, h - 5);
    ctx.fillStyle = '#555';
    ctx.fillText(' signaling', lx + 10, h - 5);

    ctx.fillStyle = '#F85149';
    ctx.textAlign = 'left';
    ctx.fillText('●', lx + 60, h - 5);
    ctx.fillStyle = '#555';
    ctx.fillText(' non-signaling', lx + 70, h - 5);

    ctx.fillStyle = '#1E88E5';
    ctx.textAlign = 'left';
    ctx.fillText('●', lx + 140, h - 5);
    ctx.fillStyle = '#555';
    ctx.fillText(' all valid', lx + 150, h - 5);

    // ── New block arrival (~every 2.5s) ──
    if (Math.random() < 0.018) {
      var pct = getSignalPct();
      var sig = Math.random() < pct;
      blocks.unshift({
        height: (blocks.length > 0 ? blocks[0].height + 1 : 960000),
        signaling: sig,
        age: 0
      });
      if (blocks.length > MAX_VISIBLE) blocks.pop();
      updateSplit();

      if (!sig) {
        emitSpark(lhsCX, startY + 10);
      }
    }
  }

  function drawBlock(ctx, x, y, w, h, color, age, t) {
    if (age < 6) {
      var a = (1 - age / 6) * 0.25;
      ctx.fillStyle = color;
      ctx.globalAlpha = a;
      VIZ.roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = color;
    VIZ.roundRect(ctx, x, y, w, h, 3);
    ctx.fill();

    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = grad;
    VIZ.roundRect(ctx, x, y, w, h, 3);
    ctx.fill();

    if (age < 4) {
      var p = (1 - age / 4) * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,' + p + ')';
      ctx.lineWidth = 1.5;
      VIZ.roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 4);
      ctx.stroke();
    }
  }

  return { init: init };
})();
