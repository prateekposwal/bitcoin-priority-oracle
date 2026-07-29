// Bitcoin Sahi — Living Lightning Network
// Force-directed graph of LN nodes + channels with payment particles

var VIZ_Lightning = (function() {
  var nodes = [];
  var channels = [];
  var payments = [];
  var _nodeCount = 0;

  var REPULSION = 14000;
  var ATTRACTION = 0.004;
  var DAMPING = 0.87;
  var REST_LENGTH = 130;

  function hasChannel(a, b) {
    for (var i = 0; i < channels.length; i++) {
      if ((channels[i].a === a && channels[i].b === b) ||
          (channels[i].a === b && channels[i].b === a)) return true;
    }
    return false;
  }

  function addChannel(a, b) {
    var base = Math.random() * 40 + 5;
    channels.push({ a: a, b: b, baseFee: base, fee: base });
    nodes[a].channels.push(channels.length - 1);
    nodes[b].channels.push(channels.length - 1);
  }

  function simulateStep(w, h) {
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var force = REPULSION / (dist * dist + 1);
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        nodes[i].vx += fx; nodes[i].vy += fy;
        nodes[j].vx -= fx; nodes[j].vy -= fy;
      }
    }

    for (var ci = 0; ci < channels.length; ci++) {
      var ch = channels[ci];
      var na = nodes[ch.a], nb = nodes[ch.b];
      var dx = na.x - nb.x;
      var dy = na.y - nb.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = (dist - REST_LENGTH) * ATTRACTION;
      var fx = (dx / dist) * force;
      var fy = (dy / dist) * force;
      na.vx -= fx; na.vy -= fy;
      nb.vx += fx; nb.vy += fy;
    }

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 10) { n.x = 10; n.vx *= -0.5; }
      if (n.x > w - 10) { n.x = w - 10; n.vx *= -0.5; }
      if (n.y < 10) { n.y = 10; n.vy *= -0.5; }
      if (n.y > h - 10) { n.y = h - 10; n.vy *= -0.5; }
    }
  }

  function currentFee() {
    var el = document.getElementById('p-fee');
    if (el) return +el.value;
    if (typeof liveFees !== 'undefined' && liveFees && liveFees.fees) {
      return liveFees.fees.fastestFee || 10;
    }
    return 10;
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);

    var feePressure = currentFee();
    // Map slider 1-200 so at 20 the multiplier is 1x
    var feeMul = feePressure / 20;

    simulateStep(w, h);

    for (var ci = 0; ci < channels.length; ci++) {
      var ch = channels[ci];
      ch.fee = Math.min(100, ch.baseFee * feeMul);
    }

    // ── Channels ──
    ctx.lineCap = 'round';
    for (var ci = 0; ci < channels.length; ci++) {
      var ch = channels[ci];
      var na = nodes[ch.a], nb = nodes[ch.b];
      var color = VIZ.feeColor(ch.fee, 100);
      var alpha = 0.25 + (ch.fee / 100) * 0.45;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.15;
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';

    // ── Payment particles ──
    if (Math.random() < 0.18 && channels.length > 0) {
      var ci = Math.floor(Math.random() * channels.length);
      payments.push({
        channel: ci,
        t: 0,
        speed: 0.003 + Math.random() * 0.007
      });
    }

    for (var pi = payments.length - 1; pi >= 0; pi--) {
      var p = payments[pi];
      var ch = channels[p.channel];
      if (!ch) { payments.splice(pi, 1); continue; }

      p.t += p.speed;
      if (p.t > 1) { payments.splice(pi, 1); continue; }

      var na = nodes[ch.a], nb = nodes[ch.b];
      var px = na.x + (nb.x - na.x) * p.t;
      var py = na.y + (nb.y - na.y) * p.t;
      var fade = Math.sin(p.t * Math.PI);
      var pColor = VIZ.feeColor(ch.fee, 100);

      var grad = ctx.createRadialGradient(px, py, 0, px, py, 7);
      grad.addColorStop(0, pColor + 'dd');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.7 * fade;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.95 * fade;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Nodes ──
    var maxCh = 1;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].channels.length > maxCh) maxCh = nodes[i].channels.length;
    }

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var chCount = n.channels.length;
      var intensity = 0.35 + (chCount / maxCh) * 0.65;
      var radius = 2.5 + (chCount / maxCh) * 5.5;
      var pulse = Math.sin(t * 1.8 + i * 2.3) * 0.1 + 0.9;
      radius *= pulse;

      var gColor = intensity > 0.6 ? '#F7931A' : '#58A6FF';

      var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 5);
      grad.addColorStop(0, gColor + '44');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = intensity;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = gColor;
      ctx.globalAlpha = intensity;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.globalAlpha = intensity * 0.35;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function init(canvasId) {
    var c = VIZ.create(canvasId, { height: 400 });
    if (!c) return;

    nodes = [];
    channels = [];
    payments = [];

    _nodeCount = 20 + Math.floor(Math.random() * 11);

    for (var i = 0; i < _nodeCount; i++) {
      nodes.push({
        x: Math.random() * c.w * 0.8 + c.w * 0.1,
        y: Math.random() * c.h * 0.8 + c.h * 0.1,
        vx: 0, vy: 0,
        channels: []
      });
    }

    for (var i = 1; i < _nodeCount; i++) {
      addChannel(i, Math.floor(Math.random() * i));
    }

    var extra = Math.floor(_nodeCount * 0.8);
    for (var i = 0; i < extra; i++) {
      var a = Math.floor(Math.random() * _nodeCount);
      var b = Math.floor(Math.random() * _nodeCount);
      if (a !== b && !hasChannel(a, b)) addChannel(a, b);
    }

    for (var s = 0; s < 80; s++) simulateStep(c.w, c.h);

    VIZ.start(canvasId, draw, 33);
  }

  return { init: init };
})();
