// Bitcoin Sahi — UTXO Health Organism
// A living cell visualization of the UTXO set.
// The UTXO set is a growing, breathing bloom/organism.
// Inscriptions are orange tentacles expanding outward.
// Dust is grey particles drifting away.

var VIZ_UTXO = (function() {
  var ORANGE = '#F7931A';
  var GREEN = '#3FB950';
  var YELLOW = '#D29922';
  var RED = '#F85149';

  var orbiting = [];
  var dustParticles = [];
  var ORBIT_COUNT = 80;

  function init(canvasId) {
    VIZ.create(canvasId, { height: 400 });
    for (var i = 0; i < ORBIT_COUNT; i++) {
      var roll = Math.random();
      var type = roll < 0.25 ? 'dust' : roll < 0.40 ? 'inscription' : 'financial';
      orbiting.push({
        angle: Math.random() * Math.PI * 2,
        speed: (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1),
        radius: 30 + Math.random() * 130,
        color: VIZ.utxoColor(type),
        size: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }
    VIZ.start(canvasId, draw, 16);
  }

  function getHealth() {
    var d = typeof APP !== 'undefined' && APP.getData ? APP.getData() : null;
    if (d && d.fees && d.fees.economyFee != null) {
      var f = d.fees.economyFee;
      if (f <= 10) return Math.max(70, 100 - f * 3);
      if (f <= 50) return Math.max(40, 70 - (f - 10) * 0.75);
      return Math.max(10, 40 - (f - 50) * 0.3);
    }
    var el = document.getElementById('sl-vol');
    if (el) {
      var v = parseFloat(el.value);
      if (v <= 100) return 90;
      if (v <= 200) return 75;
      if (v <= 300) return 55;
      return 35;
    }
    return 85;
  }

  function getInscriptionVol() {
    var el = document.getElementById('sl-vol');
    return el ? Math.max(0.1, parseFloat(el.value) / 100) : 1;
  }

  function draw(ctx, w, h, t) {
    var health = getHealth();
    var insVol = getInscriptionVol();
    var cx = w / 2;
    var cy = h / 2;
    var breath = Math.sin(t * 1.5) * 0.1 + 1;
    var healthColor = health >= 70 ? GREEN : health >= 40 ? YELLOW : RED;

    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);

    drawDust(ctx, cx, cy);
    drawTentacles(ctx, cx, cy, t, insVol);
    drawOrbit(ctx, cx, cy, t);
    drawCore(ctx, cx, cy, t, health, healthColor, breath);
  }

  function drawCore(ctx, cx, cy, t, health, healthColor, breath) {
    var baseR = 20 + (health / 100) * 25;
    var r = baseR * breath;
    var breatheAlpha = 0.85 + Math.sin(t * 1.2) * 0.15;

    var outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
    outerGlow.addColorStop(0, healthColor + '44');
    outerGlow.addColorStop(0.5, healthColor + '22');
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 4, 0, Math.PI * 2);
    ctx.fill();

    var coreGrad = ctx.createRadialGradient(
      cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r
    );
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, healthColor);
    coreGrad.addColorStop(1, healthColor + '88');
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = breatheAlpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOrbit(ctx, cx, cy, t) {
    var breath = 0.9 + Math.sin(t * 1.2 + 0.5) * 0.1;

    for (var i = 0; i < orbiting.length; i++) {
      var o = orbiting[i];
      o.angle += o.speed * 0.008;

      var x = cx + Math.cos(o.angle) * o.radius * breath;
      var y = cy + Math.sin(o.angle) * o.radius * breath;
      var sz = o.size * (0.8 + Math.sin(t * 2 + o.phase) * 0.2);
      var alpha = 0.6 + Math.sin(t * 2 + o.phase) * 0.4;

      var glow = ctx.createRadialGradient(x, y, 0, x, y, sz * 3);
      glow.addColorStop(0, o.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, sz * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = o.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawTentacles(ctx, cx, cy, t, insVol) {
    if (insVol < 0.3) return;

    var count = 3 + Math.round(insVol * 4);
    var intensity = Math.min(1, insVol / 4);
    var length = (30 + intensity * 90) * (0.7 + Math.sin(t * 0.7) * 0.3);

    ctx.lineWidth = 1.5 + intensity * 3;
    ctx.lineCap = 'round';

    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + Math.sin(t * 0.3 + i * 2) * 0.6;
      var alpha = (0.1 + intensity * 0.35) * (0.8 + Math.sin(t * 1.5 + i * 1.3) * 0.2);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ORANGE;

      var ex = cx + Math.cos(angle) * length;
      var ey = cy + Math.sin(angle) * length;

      var wobble = Math.sin(t * 1.2 + angle * 3) * 10 * intensity;

      var cp1x = cx + Math.cos(angle + 0.4) * length * 0.4
               + Math.cos(angle + 0.5) * wobble;
      var cp1y = cy + Math.sin(angle + 0.4) * length * 0.4
               + Math.sin(angle + 0.5) * wobble;
      var cp2x = cx + Math.cos(angle - 0.3) * length * 0.7
               + Math.cos(angle - 0.5) * wobble;
      var cp2y = cy + Math.sin(angle - 0.3) * length * 0.7
               + Math.sin(angle - 0.5) * wobble;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
      ctx.stroke();

      var tipGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 8);
      tipGlow.addColorStop(0, ORANGE + '88');
      tipGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = tipGlow;
      ctx.beginPath();
      ctx.arc(ex, ey, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawDust(ctx, cx, cy) {
    if (Math.random() < 0.18) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 5 + Math.random() * 15;
      dustParticles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (0.3 + Math.random() * 0.6),
        vy: Math.sin(angle) * (0.3 + Math.random() * 0.6),
        life: 1,
        size: 1 + Math.random() * 2
      });
    }

    for (var i = dustParticles.length - 1; i >= 0; i--) {
      var p = dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      if (p.life <= 0) {
        dustParticles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { init: init };
})();
