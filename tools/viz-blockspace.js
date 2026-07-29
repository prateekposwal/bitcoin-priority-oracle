// Bitcoin Sahi — Living Block Grid
// Each dot = a Bitcoin block. New blocks enter from top, push grid down.
// Color = fee pressure: green (liquid), yellow (moderate), red (congested)

var VIZ_Blockspace = (function() {
  var blocks = [];
  var cols = 20, rows = 10;

  function init(canvasId) {
    VIZ.create(canvasId, { height: 320 });
    for (var i = 0; i < cols * rows; i++) {
      blocks.push({ fee: Math.random() * 30, height: 960000 + i, age: i });
    }
    VIZ.start(canvasId, draw);
  }

  function draw(ctx, w, h, t) {
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, w, h);

    var cellW = w / cols;
    var cellH = h / rows;
    var dotR = Math.min(cellW, cellH) * 0.35;

    if (Math.random() < 0.02) {
      blocks.pop();
      blocks.unshift({ fee: Math.random() * 40 + 2, height: (blocks[0] ? blocks[0].height + 1 : 960000), age: 0 });
    }

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = col * cellW + cellW / 2;
      var y = row * cellH + cellH / 2;
      var color = VIZ.feeColor(b.fee, 50);
      var pulse = Math.sin(t * 2 + i * 0.5) * 0.15 + 0.85;
      var r = dotR * pulse;

      var grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      grad.addColorStop(0, color + '66');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (b.age < 5) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 * (1 - b.age / 5)) + ')';
        ctx.beginPath();
        ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      b.age++;
    }
  }

  return { init: init };
})();
