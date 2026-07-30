// Lightning Network interactive node graph
var VIZ_Lightning = (function() {
  var canvas, ctx, w = 800, h = 400;
  var nodes = [];
  var links = [];
  var stats = { capacity: 0, nodes: 0, channels: 0 };
  var mouseX = -1, mouseY = -1, hoverNode = null;
  var tooltipEl = null;
  var animId = null;
  var frameCount = 0;

  function isMobile() { return w < 480; }

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();

    tooltipEl = document.createElement('div');
    tooltipEl.style.cssText = 'position:fixed;pointer-events:none;background:rgba(0,0,0,0.88);color:#e8e3dc;padding:8px 12px;border-radius:6px;font:12px/1.4 -apple-system,sans-serif;border:1px solid rgba(255,255,255,0.08);z-index:9999;display:none;max-width:260px;';
    document.body.appendChild(tooltipEl);

    canvas.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    canvas.addEventListener('mouseleave', function() {
      mouseX = -1;
      mouseY = -1;
      hoverNode = null;
      tooltipEl.style.display = 'none';
    });

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var t = e.touches[0];
      mouseX = t.clientX;
      mouseY = t.clientY;
    }, { passive: false });
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var t = e.touches[0];
      mouseX = t.clientX;
      mouseY = t.clientY;
    }, { passive: false });
    canvas.addEventListener('touchend', function() {
      setTimeout(function() {
        mouseX = -1;
        mouseY = -1;
        hoverNode = null;
        tooltipEl.style.display = 'none';
      }, 2000);
    });

    window.addEventListener('resize', resize);

    buildNodes();

    if (typeof DATA_ENGINE !== 'undefined') {
      DATA_ENGINE.onUpdate(function() {
        var d = DATA_ENGINE.get().lightning || {};
        stats.capacity = d.total_capacity || 0;
        stats.nodes = d.node_count || 0;
        stats.channels = d.channel_count || 0;
        if (stats.nodes > 0) reconcileNodeCount(stats.nodes);
      });
    }

    loop();
  }

  function resize() {
    var rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: 800, height: 400 };
    if (rect.width < 100) rect = { width: window.innerWidth, height: 600 };
    w = canvas.width = rect.width || window.innerWidth;
    h = canvas.height = Math.max(200, rect.height || 600);
    canvas.style.width = '100%';
    canvas.style.height = h + 'px';
  }

  function buildNodes() {
    var d = {};
    if (typeof DATA_ENGINE !== 'undefined') { d = DATA_ENGINE.get().lightning || {}; }
    stats.capacity = d.total_capacity || 0;
    stats.nodes = d.node_count || 42;
    stats.channels = d.channel_count || 0;

    var count = Math.min(50, Math.max(30, stats.nodes || 40));
    if (stats.nodes > 50) count = 50;

    nodes = [];
    links = [];

    for (var i = 0; i < count; i++) {
      nodes.push({
        id: i,
        label: 'Node-' + (1000 + i),
        pubkey: (function(n) { var h = ''; for (var j = 0; j < 66; j++) h += '0123456789abcdef'[Math.floor(Math.random() * 16)]; return h; })(),
        alias: ['Satoshi', 'Lightning', 'TorGuard', 'ACINQ', 'Blockstream', 'Bitrefill', 'Fold', 'WalletOfSatoshi', 'Breez', 'River', 'Kraken', 'OKCoin', 'Bitfinex', 'OpenNode', 'ZEBEDEE', 'Strike', 'CoinCorner', 'PeachBitcoin', 'Wavemakr', 'LightningNetwork.com', 'NodeConductor', 'Mempool', 'BTC-Pay', 'Blixt', 'Phoenix', 'Eclair', 'LNDhub', 'RideTheLightning', 'Voltage', 'LightningLabs'][i % 30],
        channels: Math.floor(Math.random() * 200) + 1,
        capacity: Math.floor(Math.random() * 50 + 1) * 1000000,
        avgFeeRate: Math.random() * 50 + 1,
        x: Math.random() * (w || 800),
        y: Math.random() * (h || 400),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }

    for (var i = 0; i < nodes.length; i++) {
      var neighborCount = Math.floor(Math.random() * 6) + 1;
      for (var j = 0; j < neighborCount; j++) {
        var target = Math.floor(Math.random() * nodes.length);
        if (target === i) continue;
        var dup = false;
        for (var k = 0; k < links.length; k++) {
          if ((links[k].source === i && links[k].target === target) || (links[k].source === target && links[k].target === i)) {
            dup = true;
            break;
          }
        }
        if (!dup) {
          links.push({
            source: i,
            target: target,
            capacity: Math.floor(Math.random() * 10 + 1) * 100000,
            feeRate: Math.random() * 50 + 1,
            baseFee: Math.floor(Math.random() * 1000) + 1
          });
        }
      }
    }
  }

  function reconcileNodeCount(targetCount) {
    var count = Math.min(50, Math.max(30, targetCount));
    if (count > nodes.length) {
      for (var i = nodes.length; i < count; i++) {
        nodes.push({
          id: i,
          label: 'Node-' + (1000 + i),
          pubkey: (function(n) { var h = ''; for (var j = 0; j < 66; j++) h += '0123456789abcdef'[Math.floor(Math.random() * 16)]; return h; })(),
          alias: ['Satoshi', 'Lightning', 'TorGuard', 'ACINQ', 'Blockstream', 'Bitrefill', 'Fold', 'WalletOfSatoshi', 'Breez', 'River', 'Kraken', 'OKCoin', 'Bitfinex', 'OpenNode', 'ZEBEDEE', 'Strike', 'CoinCorner', 'PeachBitcoin', 'Wavemakr', 'LightningNetwork.com', 'NodeConductor', 'Mempool', 'BTC-Pay', 'Blixt', 'Phoenix', 'Eclair', 'LNDhub', 'RideTheLightning', 'Voltage', 'LightningLabs'][i % 30],
          channels: Math.floor(Math.random() * 200) + 1,
          capacity: Math.floor(Math.random() * 50 + 1) * 1000000,
          avgFeeRate: Math.random() * 50 + 1,
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3
        });
      }
    } else if (count < nodes.length) {
      nodes.length = count;
      for (var i = links.length - 1; i >= 0; i--) {
        if (links[i].source >= count || links[i].target >= count) {
          links.splice(i, 1);
        }
      }
    }
  }

  function feeColor(fee) {
    var p = Math.min(1, fee / 50);
    if (p < 0.5) {
      var t = p / 0.5;
      return { r: Math.round(63 + (210 - 63) * t), g: Math.round(185 + (170 - 185) * t), b: Math.round(80 + (80 - 80) * t) };
    } else {
      var t = (p - 0.5) / 0.5;
      return { r: Math.round(210 + (248 - 210) * t), g: Math.round(170 + (81 - 170) * t), b: Math.round(80 + (73 - 80) * t) };
    }
  }

  function loop() { try {
    var t = Date.now() / 1000;
    var repulsion = isMobile() ? 20000 : 40000;
    var attraction = 0.001;
    var damping = 0.98;
    var maxSpeed = 1.5;
    var skipPhysics = isMobile() && (frameCount % 2 === 0);

    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var fx = 0, fy = 0;

      // Repulsion between all pairs
      if (!skipPhysics) {
        for (var j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy) + 1;
          fx += (dx / dist) * repulsion / (dist * dist);
          fy += (dy / dist) * repulsion / (dist * dist);
        }
      }

      // Attraction along links
      for (var k = 0; k < links.length; k++) {
        if (links[k].source === i) {
          var target = nodes[links[k].target];
          if (!target) continue;
          dx = target.x - a.x;
          dy = target.y - a.y;
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
          fx += dx * attraction;
          fy += dy * attraction;
        } else if (links[k].target === i) {
          target = nodes[links[k].source];
          if (!target) continue;
          dx = target.x - a.x;
          dy = target.y - a.y;
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
          fx += dx * attraction;
          fy += dy * attraction;
        }
      }

      // Orbital drift — slow rotation around center
      var cx = w / 2, cy = h / 2;
      var dxc = a.x - cx, dyc = a.y - cy;
      var distc = Math.sqrt(dxc * dxc + dyc * dyc) || 1;
      var orbitStrength = 0.02;
      fx += -dyc / distc * orbitStrength * distc * 0.01;
      fy += dxc / distc * orbitStrength * distc * 0.01;

      // Weak centering force
      fx += (cx - a.x) * 0.0005;
      fy += (cy - a.y) * 0.0005;

      a.vx = (a.vx + fx) * damping;
      a.vy = (a.vy + fy) * damping;

      var speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (speed > maxSpeed) {
        a.vx = (a.vx / speed) * maxSpeed;
        a.vy = (a.vy / speed) * maxSpeed;
      }

      a.x += a.vx;
      a.y += a.vy;

      // Contain within bounds
      var margin = 60;
      if (a.x < margin) a.x = margin;
      if (a.x > w - margin) a.x = w - margin;
      if (a.y < margin) a.y = margin;
      if (a.y > h - margin) a.y = h - margin;
    }

    // Draw
    ctx.fillStyle = '#1A1612';
    ctx.fillRect(0, 0, w, h);

    // Subtle radial gradient
    var grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.6);
    grad.addColorStop(0, 'rgba(255,200,150,0.04)');
    grad.addColorStop(0.5, 'rgba(255,180,100,0.02)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw links
    var maxChan = 1;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].channels > maxChan) maxChan = nodes[i].channels;
    }

    for (var i = 0; i < links.length; i++) {
      var src = nodes[links[i].source];
      var tgt = nodes[links[i].target];
      if (!src || !tgt) continue;

      var cf = feeColor(links[i].feeRate);
      var density = Math.min(1, links[i].capacity / 5000000);
      var opacity = 0.08 + density * 0.35;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = 'rgba(' + cf.r + ',' + cf.g + ',' + cf.b + ',' + opacity + ')';
      ctx.lineWidth = 1 + density * 2;
      ctx.stroke();

      // Animated pulse along channel
      var pulsePhase = (t + i * 0.7) % 2;
      if (pulsePhase < 1) {
        var ppx = src.x + (tgt.x - src.x) * pulsePhase;
        var ppy = src.y + (tgt.y - src.y) * pulsePhase;
        ctx.beginPath();
        ctx.arc(ppx, ppy, 2 + density * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + cf.r + ',' + cf.g + ',' + cf.b + ',' + (0.3 + density * 0.4) + ')';
        ctx.fill();
      }
    }

    // Draw nodes
    hoverNode = null;
    var maxSize = isMobile() ? 14 : 20, minSize = isMobile() ? 3 : 4;

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var size = minSize + (n.channels / maxChan) * (maxSize - minSize);
      var cf = feeColor(n.avgFeeRate);
      var baseOpacity = 0.7;

      // Check hover
      if (mouseX >= 0 && mouseY >= 0) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = w / rect.width;
        var scaleY = h / rect.height;
        var cx = (mouseX - rect.left) * scaleX;
        var cy = (mouseY - rect.top) * scaleY;
        var d = Math.sqrt((n.x - cx) * (n.x - cx) + (n.y - cy) * (n.y - cy));
        if (d < size + 6) {
          hoverNode = n;
          baseOpacity = 1;
        }
      }

      // Glow
      var glowSize = size * (1 + Math.sin(t * 1.5 + i) * 0.15);
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowSize * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + cf.r + ',' + cf.g + ',' + cf.b + ',' + (0.06 + Math.sin(t * 2 + i * 0.5) * 0.03 + 0.03) + ')';
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + cf.r + ',' + cf.g + ',' + cf.b + ',' + baseOpacity + ')';
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.1' + (hoverNode === n ? '5' : '') + ')';
      ctx.lineWidth = hoverNode === n ? 1.5 : 0.5;
      ctx.stroke();
    }

    // Hovered node highlight ring
    if (hoverNode) {
      var n = hoverNode;
      var size = minSize + (n.channels / maxChan) * (maxSize - minSize);
      ctx.beginPath();
      ctx.arc(n.x, n.y, size + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw connections to hovered node
      for (var i = 0; i < links.length; i++) {
        if (links[i].source === n.id || links[i].target === n.id) {
          var other = links[i].source === n.id ? nodes[links[i].target] : nodes[links[i].source];
          if (!other) continue;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(other.x, other.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fill();
        }
      }

      // Update tooltip
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = Math.min(mouseX + 16, window.innerWidth - (isMobile() ? 200 : 270)) + 'px';
      tooltipEl.style.top = Math.min(mouseY + 16, window.innerHeight - (isMobile() ? 130 : 160)) + 'px';
      var capBtc = (n.capacity / 100000000).toFixed(4);
      tooltipEl.innerHTML =
        '<b>' + n.alias + '</b><br>' +
        '<span style="color:#8b8680;font-size:11px">' + n.pubkey.substring(0, 16) + '...</span><br>' +
        '<span style="color:#ffd8a8">Channels: ' + n.channels + '</span><br>' +
        '<span style="color:#ffd8a8">Capacity: ' + capBtc + ' BTC</span><br>' +
        '<span style="color:#ffd8a8">Fee rate: ' + n.avgFeeRate.toFixed(1) + ' ppm</span>';
    } else {
      tooltipEl.style.display = 'none';
    }

    // Stats label — total capacity, node count, channel count
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (isMobile() ? '10px' : '12px') + ' -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(14, 14, isMobile() ? 260 : 350, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    var capBtc = (stats.capacity / 100000000).toFixed(1);
    ctx.fillText('Capacity: ' + capBtc + ' BTC | Nodes: ' + stats.nodes + ' | Channels: ' + stats.channels, 16, 16);

    // Legend
    var lx = w - 200, ly = 16, lw = 140;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(lx - 8, ly - 6, lw + 16, 80);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx - 8, ly - 6, lw + 16, 80);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Node color = fee rate', lx, ly);

    // Green
    ctx.fillStyle = 'rgb(63,185,80)';
    ctx.fillRect(lx, ly + 14, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Cheap (<5 ppm)', lx + 14, ly + 14);

    // Yellow
    ctx.fillStyle = 'rgb(210,170,80)';
    ctx.fillRect(lx, ly + 28, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Moderate (5-25)', lx + 14, ly + 28);

    // Red
    ctx.fillStyle = 'rgb(248,81,73)';
    ctx.fillRect(lx, ly + 42, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Expensive (>25)', lx + 14, ly + 42);

    // Node size hint
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('○ size = channel count', lx, ly + 60);

    // Vignette
    var vig = ctx.createRadialGradient(w/2, h/2, h*0.15, w/2, h/2, h*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    frameCount++;
    } catch (e) {}
    animId = requestAnimationFrame(loop);
  }

  return { init: init, resize: resize };
})();
