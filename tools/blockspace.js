// Blockspace Explorer — standalone script, no api.js dependency

var liveFees = null, liveMempoolTx = null, liveBtcPrice = null;
var LIVE_BASE_TX = 3000;

function updateBlockSpace() {
  try {
  var sl = document.getElementById('sl-vol');
  if (!sl) { return; }
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

  try{document.getElementById('kpi-tx').textContent='~'+Math.round(finPerBlock*0.85+insPerBlock*0.7).toLocaleString();}catch(e2){}
  try{document.getElementById('kpi-size').textContent='~'+((finWeight+insWeight+0.1*BLOCK_LIMIT)/1000000).toFixed(1)+' MB';}catch(e2){}
  try{document.getElementById('kpi-ins-pct').textContent=Math.round(insPct)+'%';}catch(e2){}
  try{document.getElementById('so-fin').textContent=Math.round(finPct)+'%';}catch(e2){}
  try{document.getElementById('so-ins').textContent=Math.round(insPct)+'%';}catch(e2){}
  try{document.getElementById('so-ratio').textContent=(insPct/(finPct||1)).toFixed(2);}catch(e2){}
  } catch(e) {
    var dbg = document.getElementById('debug-log');
    if (dbg) dbg.textContent = 'Error: ' + (e && e.message ? e.message : String(e));
  }
}

// Update block header from live data
function updateBlockUI(b) {
  document.getElementById('block-height').textContent = '#' + b.height.toLocaleString();
  var hashEl = document.getElementById('block-hash');
  if (hashEl) hashEl.textContent = b.hash ? b.hash.substring(0, 16) + '...' : '---';
  var timeEl = document.getElementById('block-time');
  if (timeEl && b.timestamp) {
    var d2 = new Date((typeof b.timestamp === 'number' ? b.timestamp : Date.parse(b.timestamp)) * 1000);
    timeEl.textContent = isNaN(d2.getTime()) ? '---' : d2.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }
  var sizeMB = (b.size / 1000000).toFixed(2);
  document.getElementById('block-stats').textContent = b.tx_count.toLocaleString() + ' txs . ' + sizeMB + ' MB . ' + b.weight.toLocaleString() + ' kWU';
  document.getElementById('tx-footer').textContent = 'Live block #' + b.height.toLocaleString() + ' --- ' + b.tx_count.toLocaleString() + ' transactions . storage cost modeled at $924/yr per node . 10-year horizon';
}

// Fetch live data
function fetchBlockspaceData() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/tools/live_data.json?_=' + Date.now(), true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        var d = JSON.parse(xhr.responseText);
        if (d && d.fees) liveFees = d.fees;
        if (d && d.mempool) liveMempoolTx = d.mempool.unconfirmed_tx;
        if (d) liveBtcPrice = d.btc_price;

        // Update live indicator
        if (d && d.timestamp) {
          var then = new Date(d.timestamp).getTime();
          var secsAgo = Math.round((Date.now() - then) / 1000);
          var ago = secsAgo < 60 ? secsAgo + 's' : Math.round(secsAgo / 60) + 'm';
          var el = document.getElementById('live-indicator');
          if (el) el.innerHTML = '<span class="live-dot"></span> Live . ' + ago + ' ago';
          var feeEl = document.getElementById('live-fees');
          if (feeEl && liveFees) {
            feeEl.innerHTML = 'Fees: <strong>' + liveFees.fastestFee + '</strong> fast / <strong>' + liveFees.economyFee + '</strong> econ sat/vB . Mempool: <strong>' + (liveMempoolTx || 0).toLocaleString() + '</strong> txs';
          }
        }

        // Update block detail from pipeline data
        if (d.latest_block) {
          updateBlockUI(d.latest_block);
        }

        updateBlockSpace();
      } catch(e) {}
    }
  };
  xhr.send();
}

// Initial render with defaults
updateBlockSpace();
// Fetch live data
fetchBlockspaceData();
// Refresh every 60 seconds
setInterval(fetchBlockspaceData, 60000);
