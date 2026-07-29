// Blockspace Explorer — live block composition calculator
// Loaded from blockspace.html


var liveFees = null, liveMempoolTx = null, liveBtcPrice = null;
var LIVE_BASE_TX = 3000;
var debugEl = document.getElementById('debug-log');
if (debugEl) { debugEl.textContent = 'Script loaded at ' + new Date().toLocaleTimeString() + ' | API=' + (typeof API); }

// If API module is not available, render composition with defaults immediately
if (typeof API === 'undefined') {
  if (debugEl) debugEl.textContent += ' | API not found, using direct render';
  updateBlockSpace();
}

function updateBlockSpace() {
  try {
  var sl = document.getElementById('sl-vol');
  if (!sl) { var dbg = document.getElementById('debug-log'); if (dbg) dbg.textContent = 'Error: sl-vol not found'; return; }
  var vol = parseFloat(sl.value);
  document.getElementById('sl-vol-label').textContent = vol + 'K';

  var BASE_TX = liveMempoolTx ? Math.max(500, Math.round(liveMempoolTx / 144)) : LIVE_BASE_TX;
  var INS_SIZE = 400, TX_SIZE = 250, BLOCK_LIMIT = 4000000, INS_VB = INS_SIZE * 0.75;
  var totalIns = vol * 1000;
  var insPerBlock = totalIns / (6 * 24 * 30.5);
  var finPerBlock = Math.max(200, BASE_TX - insPerBlock * 0.3);
  var insWeight = insPerBlock * INS_VB;
  var finWeight = finPerBlock * TX_SIZE;
  if (insWeight + finWeight > BLOCK_LIMIT) {
    var s = BLOCK_LIMIT / (insWeight + finWeight);
    insWeight *= s; finWeight *= s;
  }
  var emptyW = Math.max(0, BLOCK_LIMIT - insWeight - finWeight);

  var insPct = insWeight / BLOCK_LIMIT * 100;
  var finPct = finWeight / BLOCK_LIMIT * 100;
  var emptyPct = emptyW / BLOCK_LIMIT * 100;
  var sd = 100 / (insPct + finPct + emptyPct + 10);
  insPct *= sd; finPct *= sd; emptyPct *= sd;

  var segs = [
    ['seg-fin','Financial',finPct],['seg-ins','Inscriptions',insPct],
    ['seg-ln','Lightning',4*sd],['seg-other','Other',6*sd],
    ['seg-empty','Empty',emptyPct]
  ];
  for(var i=0;i<segs.length;i++){
    var el=document.getElementById(segs[i][0]);
    if(!el)continue;
    el.style.width = Math.max(0.3,segs[i][2])+'%';
    var lb=el.querySelector('.seg-label');
    if(lb)lb.textContent = segs[i][1]+' '+(segs[i][2]>=1?Math.round(segs[i][2]):segs[i][2].toFixed(1))+'%';
  }
  var tp=document.getElementById('total-pct');
  if(tp)tp.textContent=(finPct+insPct+emptyPct+10*sd).toFixed(1)+'%';

  try{document.getElementById('kpi-tx').textContent='~'+Math.round(finPerBlock*0.85+insPerBlock*0.7).toLocaleString();}catch(e){}
  try{document.getElementById('kpi-size').textContent='~'+((finWeight+insWeight+0.1*BLOCK_LIMIT)/1000000).toFixed(1)+' MB';}catch(e){}
  try{document.getElementById('kpi-ins-pct').textContent=Math.round(insPct)+'%';}catch(e){}
  try{document.getElementById('so-fin').textContent=Math.round(finPct)+'%';}catch(e){}
  try{document.getElementById('so-ins').textContent=Math.round(insPct)+'%';}catch(e){}
  try{document.getElementById('so-ratio').textContent=(insPct/(finPct||1)).toFixed(2);}catch(e2){}
  } catch(e) {
    var dbg = document.getElementById('debug-log');
    if (dbg) dbg.textContent = 'Error: ' + (e && e.message ? e.message : String(e));
    console.error('[blockspace]', e);
  }
}

API.onData(function(d) {
  if (d && d.fees) liveFees = d.fees;
  if (d && d.mempool) liveMempoolTx = d.mempool.unconfirmed_tx;
  if (d) liveBtcPrice = d.btc_price;
  var now = Date.now();
  var then = new Date(d.timestamp).getTime();
  var secsAgo = Math.round((now - then) / 1000);
  var ago = secsAgo < 60 ? secsAgo + 's' : Math.round(secsAgo / 60) + 'm';
  var el = document.getElementById('live-indicator');
  if (el) el.innerHTML = '<span class="live-dot"></span> Live &middot; ' + ago + ' ago';
  var feeEl = document.getElementById('live-fees');
  if (feeEl && liveFees) {
    feeEl.innerHTML = 'Fees: <strong>' + liveFees.fastestFee + '</strong> fast / <strong>' + liveFees.economyFee + '</strong> econ sat/vB &middot; Mempool: <strong>' + liveMempoolTx.toLocaleString() + '</strong> txs';
  }
  // Update block detail — try pipeline data first, fallback to direct API
  function updateBlockUI(b) {
    document.getElementById('block-height').textContent = '#' + b.height.toLocaleString();
    document.getElementById('block-hash').textContent = b.hash ? b.hash.substring(0, 16) + '…' : '—';
    if (b.timestamp) {
      var d2 = new Date((typeof b.timestamp === 'number' ? b.timestamp : Date.parse(b.timestamp)) * 1000);
      document.getElementById('block-time').textContent = isNaN(d2.getTime()) ? '—' : d2.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
    var sizeMB = (b.size / 1000000).toFixed(2);
    document.getElementById('block-stats').textContent = b.tx_count.toLocaleString() + ' txs · ' + sizeMB + ' MB · ' + b.weight.toLocaleString() + ' kWU';
    document.getElementById('tx-footer').textContent = 'Live block #' + b.height.toLocaleString() + ' — ' + b.tx_count.toLocaleString() + ' transactions · storage cost modeled at $924/yr per node · 10-year horizon';
  }
  if (d.latest_block) {
    updateBlockUI(d.latest_block);
  } else {
    // Fallback: fetch block data directly from mempool.space
    fetch('https://mempool.space/api/blocks/tip/height').then(function(r) { return r.text(); }).then(function(h) {
      return fetch('https://mempool.space/api/block-height/' + h.trim());
    }).then(function(r) { return r.text(); }).then(function(hash) {
      return fetch('https://mempool.space/api/block/' + hash.trim());
    }).then(function(r) { return r.json(); }).then(function(b) {
      updateBlockUI({ height: b.height, hash: b.id, timestamp: b.timestamp, tx_count: b.tx_count, size: b.size, weight: b.weight });
    }).catch(function() {});
  }
  updateBlockSpace();
});
try {
  updateBlockSpace();
  API.start({ interval: 60000 });
} catch(e) {
  var d2 = document.getElementById('debug-log');
  if (d2) d2.textContent = 'Init error: ' + (e && e.message ? e.message : String(e));
}
