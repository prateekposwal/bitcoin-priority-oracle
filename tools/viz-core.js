// Bitcoin Sahi — Living Visualization Core
// Shared canvas engine, particle system, animation loop
// All visualizations extend this

var VIZ = (function() {
  var canvases = {};
  var anims = {};
  var particles = [];
  var time = 0;

  // ── Canvas setup ──
  function create(id, opts) {
    opts = opts || {};
    var el = document.getElementById(id);
    if (!el) return null;
    var ctx = el.getContext('2d');
    var w = el.width = el.clientWidth || 600;
    var h = el.height = opts.height || 400;
    canvases[id] = { el: el, ctx: ctx, w: w, h: h, opts: opts };
    return canvases[id];
  }

  function resize(id) {
    var c = canvases[id];
    if (!c) return;
    c.w = c.el.width = c.el.clientWidth || 600;
    c.h = c.el.height = c.opts.height || 400;
  }

  // ── Simple particle ──
  function makeParticle(x, y, vx, vy, life, color, size) {
    return { x: x||0, y: y||0, vx: vx||0, vy: vy||0, life: life||1, maxLife: life||1, color: color||'#888', size: size||2 };
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.5;
      if (p.life <= 0) { particles.splice(i, 1); }
    }
  }

  function drawParticles(ctx, w, h) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Color utilities ──
  function feeColor(fee, maxFee) {
    maxFee = maxFee || 50;
    var p = Math.min(1, Math.max(0, fee / maxFee));
    // green (low fee) → yellow → red (high fee)
    var r = Math.round(p * 255);
    var g = Math.round((1 - p) * 200 + 55);
    var b = Math.round((1 - p) * 100 + 30);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function blockColor(signaling) {
    return signaling ? '#3FB950' : '#F85149';
  }

  function utxoColor(type) {
    if (type === 'inscription') return '#F7931A';
    if (type === 'dust') return '#888';
    return '#3FB950';
  }

  // ── Animation loop ──
  function start(id, drawFn, interval) {
    interval = interval || 50; // ms between frames
    if (anims[id]) clearInterval(anims[id]);
    anims[id] = setInterval(function() {
      time += 0.016;
      var c = canvases[id];
      if (!c) return;
      c.w = c.el.width = c.el.clientWidth || c.w;
      c.h = c.el.height = c.opts.height || c.h;
      try { drawFn(c.ctx, c.w, c.h, time); } catch(e) {}
    }, interval);
  }

  function stop(id) {
    if (anims[id]) { clearInterval(anims[id]); delete anims[id]; }
  }

  // ── Utility: draw rounded rect ──
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

  return {
    create: create,
    resize: resize,
    start: start,
    stop: stop,
    makeParticle: makeParticle,
    updateParticles: updateParticles,
    drawParticles: drawParticles,
    feeColor: feeColor,
    blockColor: blockColor,
    utxoColor: utxoColor,
    roundRect: roundRect,
    getTime: function() { return time; },
    getCanvas: function(id) { return canvases[id]; }
  };
})();
