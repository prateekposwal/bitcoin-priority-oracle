const VIZ_Research = (() => {
  const PADDING = { top: 50, right: 30, bottom: 50, left: 70 };
  const COLORS = {
    fastest: '#ef4444',
    hour: '#eab308',
    economy: '#22c55e',
  };
  const LABELS = {
    fastest: 'Fastest',
    hour: '1 Hour',
    economy: 'Economy',
  };

  let canvas, ctx, w, h, chartW, chartH;
  let data = [];
  let hovered = null;
  let rafId = null;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', () => { hovered = null; draw(); });

    const engine = window.DATA_ENGINE;
    if (engine && engine.get) {
      const state = engine.get();
      if (state && state.fee_history) {
        data = buildSeries(state.fee_history);
      }
    }

    loop();
  }

  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function resize() {
    const rect = canvas.parentElement
      ? canvas.parentElement.getBoundingClientRect()
      : { width: window.innerWidth, height: 400 };
    const dpr = window.devicePixelRatio || 1;
    w = rect.width;
    h = 400;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    chartW = w - PADDING.left - PADDING.right;
    chartH = h - PADDING.top - PADDING.bottom;
  }

  function buildSeries(raw) {
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      const now = Date.now();
      const dummy = [];
      for (let i = 96; i >= 0; i--) {
        const t = now - i * 15 * 60 * 1000;
        const base = 15 + Math.sin(i * 0.4) * 8 + Math.random() * 5;
        dummy.push({ timestamp: t, avgFee: base * 2500000 });
      }
      return computeTiers(dummy);
    }
    return computeTiers(raw);
  }

  function computeTiers(entries) {
    return entries.map(e => {
      const economy = e.avgFee / 2500000;
      return {
        t: e.timestamp,
        economy,
        hour: economy * 1.5,
        fastest: economy * 3,
      };
    });
  }

  function mapX(t) {
    if (data.length < 2) return PADDING.left + chartW / 2;
    const t0 = data[0].t;
    const t1 = data[data.length - 1].t;
    const range = t1 - t0 || 1;
    return PADDING.left + ((t - t0) / range) * chartW;
  }

  function mapY(v) {
    const maxY = maxVal();
    const minY = 0;
    const range = maxY - minY || 1;
    return PADDING.top + chartH - ((v - minY) / range) * chartH;
  }

  function maxVal() {
    let m = 1;
    for (const d of data) {
      if (d.fastest > m) m = d.fastest;
    }
    return Math.ceil(m * 1.15);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) {
      ctx.fillStyle = '#666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for fee data…', w / 2, h / 2);
      return;
    }

    drawTitle();
    drawGrid();
    drawLabels();
    drawLinesAndFills();
    if (hovered) drawCrosshair();
    drawLegend();
  }

  function drawTitle() {
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Fee History — Last 24 Hours (sat/vB)', PADDING.left, 14);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;

    const maxY = maxVal();
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const v = (maxY / ySteps) * i;
      const y = mapY(v);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(v) + '', PADDING.left - 8, y);
    }

    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      if (data.length < 2) continue;
      const idx = Math.floor((i / xSteps) * (data.length - 1));
      const d = data[idx];
      const x = mapX(d.t);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, h - PADDING.bottom);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = formatTime(d.t);
      ctx.fillText(label, x, h - PADDING.bottom + 6);
    }
  }

  function drawLabels() {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('← 24h ago', PADDING.left, h - PADDING.bottom + 22);
    ctx.textAlign = 'right';
    ctx.fillText('now →', w - PADDING.right, h - PADDING.bottom + 22);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function drawLinesAndFills() {
    const keys = ['economy', 'hour', 'fastest'];
    for (const key of keys) {
      drawFill(key);
    }
    for (const key of keys) {
      drawLine(key);
    }
  }

  function pointsForKey(key) {
    return data.map(d => ({ x: mapX(d.t), y: mapY(d[key]) }));
  }

  function drawLine(key) {
    const pts = pointsForKey(key);
    if (pts.length < 2) return;
    ctx.strokeStyle = COLORS[key];
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    bezierThrough(ctx, pts);
    ctx.stroke();
  }

  function drawFill(key) {
    const pts = pointsForKey(key);
    if (pts.length < 2) return;
    const y0 = mapY(0);
    ctx.beginPath();
    bezierThrough(ctx, pts);
    ctx.lineTo(pts[pts.length - 1].x, y0);
    ctx.lineTo(pts[0].x, y0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, PADDING.top, 0, h - PADDING.bottom);
    const c = COLORS[key];
    grad.addColorStop(0, c + '55');
    grad.addColorStop(1, c + '08');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function bezierThrough(ctx, pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const next = pts[i + 1];
      const cp1x = cur.x - (cur.x - prev.x) * 0.25;
      const cp1y = cur.y - (cur.y - prev.y) * 0.25;
      const cp2x = cur.x + (next.x - cur.x) * 0.25;
      const cp2y = cur.y + (next.y - cur.y) * 0.25;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cur.x, cur.y);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function drawLegend() {
    const keys = ['fastest', 'hour', 'economy'];
    const boxW = 80;
    const boxH = keys.length * 22 + 10;
    const lx = w - PADDING.right - boxW - 8;
    const ly = PADDING.top + 8;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < keys.length; i++) {
      const y = ly + 10 + i * 22 + 11;
      ctx.fillStyle = COLORS[keys[i]];
      ctx.fillRect(lx + 8, y - 4, 10, 10);
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'left';
      ctx.fillText(LABELS[keys[i]], lx + 24, y);
    }
  }

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

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (mx < PADDING.left || mx > w - PADDING.right || my < PADDING.top || my > h - PADDING.bottom) {
      hovered = null;
      return;
    }

    let closest = null;
    let minDist = Infinity;
    for (const d of data) {
      const x = mapX(d.t);
      const dist = Math.abs(x - mx);
      if (dist < minDist) {
        minDist = dist;
        closest = d;
      }
    }

    if (closest && minDist < 40) {
      hovered = { point: closest, mx, my };
    } else {
      hovered = null;
    }
  }

  function drawCrosshair() {
    if (!hovered) return;
    const p = hovered.point;
    const cx = mapX(p.t);
    const cyEco = mapY(p.economy);
    const cyHour = mapY(p.hour);
    const cyFast = mapY(p.fastest);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, PADDING.top);
    ctx.lineTo(cx, h - PADDING.bottom);
    ctx.stroke();
    ctx.restore();

    const tooltipW = 200;
    const tooltipH = 80;
    let tx = cx + 12;
    let ty = PADDING.top + 8;
    if (tx + tooltipW > w - PADDING.right) tx = cx - tooltipW - 12;
    if (ty + tooltipH > h - PADDING.bottom) ty = h - PADDING.bottom - tooltipH;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, tx, ty, tooltipW, tooltipH, 6);
    ctx.fill();
    ctx.stroke();

    const d = new Date(p.t);
    const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(timeStr, tx + 8, ty + 6);

    const rows = [
      { label: 'Fastest', val: p.fastest, color: COLORS.fastest },
      { label: '1 Hour', val: p.hour, color: COLORS.hour },
      { label: 'Economy', val: p.economy, color: COLORS.economy },
    ];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ry = ty + 22 + i * 18;
      ctx.fillStyle = r.color;
      ctx.fillRect(tx + 8, ry + 3, 8, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'left';
      ctx.fillText(r.label + ':', tx + 22, ry);
      ctx.textAlign = 'right';
      ctx.fillText(r.val.toFixed(1) + ' sat/vB', tx + tooltipW - 8, ry);
    }
  }

  function downloadCSV() {
    if (data.length === 0) return;
    let csv = 'Timestamp,Economy (sat/vB),1 Hour (sat/vB),Fastest (sat/vB)\n';
    for (const d of data) {
      const ts = new Date(d.t).toISOString();
      csv += `${ts},${d.economy.toFixed(2)},${d.hour.toFixed(2)},${d.fastest.toFixed(2)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee_history_24h.csv';
    a.textContent = 'Download CSV';
    a.style.cssText =
      'display:inline-block;margin-top:8px;padding:6px 14px;background:#1e293b;' +
      'color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:4px;' +
      'font:11px monospace;text-decoration:none;';
    a.onclick = () => setTimeout(() => URL.revokeObjectURL(url), 5000);
    return a;
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  }

  return { init, destroy, downloadCSV };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VIZ_Research };
}
