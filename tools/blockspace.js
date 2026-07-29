// Blockspace Explorer — live block composition, KPI, and block data
var fees = {}, btcPrice = 0, mempoolTx = 0, blockHeight = 0;

function updateBlockSpace() {
  var vol = parseFloat((document.getElementById('sl-vol') || {}).value) || 100;
  var el = document.getElementById('sl-vol-label');
  if (el) el.textContent = vol + 'K';

  var BASE_TX = mempoolTx ? Math.max(500, Math.round(mempoolTx / 144)) : 3000;
  var insPerBlock = (vol * 1000) / (6 * 24 * 30.5);
  var finPerBlock = Math.max(200, BASE_TX - insPerBlock * 0.3);
  var iw = insPerBlock * 300, fw = finPerBlock * 250;
  var ew = Math.max(0, 4000000 - iw - fw);
  var ip = iw / 4000000 * 100, fp = fw / 4000000 * 100, ep = ew / 4000000 * 100;
  var sd = 100 / (ip + fp + ep + 10);
  ip *= sd; fp *= sd; ep *= sd;

  // Update composition bar
  var segs = [['seg-fin','Financial',fp],['seg-ins','Inscriptions',ip],['seg-ln','Lightning',4*sd],['seg-other','Other',6*sd],['seg-empty','Empty',ep]];
  for(var i=0;i<segs.length;i++){
    var se = document.getElementById(segs[i][0]);
    if(!se)continue;
    se.style.width = Math.max(0.3,segs[i][2])+'%';
    var lb = se.querySelector('.seg-label');
    if(lb) lb.textContent = segs[i][1]+' '+(segs[i][2]>=10?Math.round(segs[i][2]):segs[i][2].toFixed(1))+'%';
  }

  // Update KPI cards
  var totalTx = Math.round(finPerBlock + insPerBlock);
  var blockSizeMB = ((fw + iw) / 1000000).toFixed(1);
  setText('kpi-tx', '~' + totalTx.toLocaleString());
  setText('kpi-size', '~' + blockSizeMB + ' MB');
  setText('kpi-ins-pct', (ip >= 1 ? Math.round(ip) : ip.toFixed(1)) + '%');

  // Update slider output values
  setText('so-fin', (fp >= 10 ? Math.round(fp) : fp.toFixed(1)) + '%');
  setText('so-ins', (ip >= 10 ? Math.round(ip) : ip.toFixed(1)) + '%');
  var ratio = finPerBlock > 0 ? (ip / fp) : 0;
  setText('so-ratio', ratio.toFixed(2));

  // Update narrative
  setText('narrative-text', 'At current inscription volumes (~' + vol + 'K/mo), inscriptions occupy ~' + (ip >= 1 ? Math.round(ip) : ip.toFixed(1)) + '% of block space.');
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function fmtNum(n) { return Number(n).toLocaleString('en-US'); }

function updateBlockUI(b) {
  setText('block-height', '#' + fmtNum(b.height || 0));
  var hashEl = document.getElementById('block-hash');
  if (hashEl) hashEl.textContent = b.hash ? b.hash.substring(0, 12) + '...' : '---';
  if (b.timestamp) {
    var d2 = new Date((typeof b.timestamp === 'number' ? b.timestamp : Date.parse(b.timestamp)) * 1000);
    setText('block-time', isNaN(d2.getTime()) ? '---' : d2.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
  }
  var sizeMB = ((b.size || 0) / 1000000).toFixed(2);
  setText('block-stats', fmtNum(b.tx_count || 0) + ' txs . ' + sizeMB + ' MB . ' + fmtNum(b.weight || 0) + ' kWU');
  setText('tx-footer', 'Live block #' + fmtNum(b.height || 0) + ' --- ' + fmtNum(b.tx_count || 0) + ' transactions');
}

function updateLiveIndicator(d) {
  if (!d) return;
  var el = document.getElementById('live-indicator');
  if (el && !el.dataset.start) el.dataset.start = Date.now();
  var secsAgo = el ? Math.floor((Date.now() - parseInt(el.dataset.start || Date.now())) / 1000) : 0;
  var ago = secsAgo < 60 ? secsAgo + 's' : Math.round(secsAgo / 60) + 'm';
  if (el) el.innerHTML = '<span class="live-dot"></span> Live . ' + ago + ' ago';
  var feeEl = document.getElementById('live-fees');
  if (feeEl && fees) {
    feeEl.innerHTML = 'Fees: <strong>' + (fees.fastestFee || '--') + '</strong> fast / <strong>' + (fees.economyFee || '--') + '</strong> econ sat/vB';
  }
}

// Fetch live block data directly from mempool.space (no fallback needed)
function fetchLiveBlock() {
  var tx = new XMLHttpRequest();
  tx.open('GET', 'https://mempool.space/api/blocks/tip/height', true);
  tx.timeout = 10000;
  tx.onload = function() {
    if (tx.status !== 200) return;
    var h = tx.responseText.trim();
    var tx2 = new XMLHttpRequest();
    tx2.open('GET', 'https://mempool.space/api/block-height/' + h, true);
    tx2.timeout = 10000;
    tx2.onload = function() {
      if (tx2.status !== 200) return;
      var hash = tx2.responseText.trim();
      var tx3 = new XMLHttpRequest();
      tx3.open('GET', 'https://mempool.space/api/block/' + hash, true);
      tx3.timeout = 10000;
      tx3.onload = function() {
        if (tx3.status !== 200) return;
        try {
          var b = JSON.parse(tx3.responseText);
          updateBlockUI({ height: b.height, hash: b.id, timestamp: b.timestamp, tx_count: b.tx_count, size: b.size, weight: b.weight });
        } catch(e) {}
      };
      tx3.send();
    };
    tx2.send();
  };
  tx.send();
}

// Update tx rows every API refresh with randomized live data
function updateTxRows() {
  var txList = document.getElementById('tx-list');
  if (!txList || !fees || !fees.economyFee) return;
  var e = fees.economyFee || 1, f = fees.fastestFee || 3, btc = btcPrice || 64000;
  var now = new Date();
  
  txList.innerHTML = [
    { type: 'Financial', cls: 'green', sizeBase: 250, sizeRange: 50, feeMult: f },
    { type: 'Inscription', cls: 'orange', sizeBase: 1200, sizeRange: 300, feeMult: f * 2 },
    { type: 'Financial', cls: 'green', sizeBase: 180, sizeRange: 40, feeMult: e },
    { type: 'Inscription', cls: 'orange', sizeBase: 3800, sizeRange: 500, feeMult: f * 3 },
    { type: 'Lightning', cls: 'blue', sizeBase: 1000, sizeRange: 200, feeMult: e },
    { type: 'Financial', cls: 'green', sizeBase: 140, sizeRange: 30, feeMult: e },
    { type: 'Inscription', cls: 'orange', sizeBase: 2100, sizeRange: 400, feeMult: f * 2 },
    { type: 'Other', cls: 'gray', sizeBase: 400, sizeRange: 100, feeMult: e },
  ].map(function(tx) {
    var size = tx.sizeBase + Math.round(Math.random() * tx.sizeRange - tx.sizeRange / 2);
    if (size < 100) size = 100;
    var feeRate = tx.feeMult + (Math.random() - 0.5) * 0.5;
    if (feeRate < 0.5) feeRate = 0.5;
    var sats = Math.round(feeRate * size);
    var storage = (0.0077 * size / 400).toFixed(4);
    return '<div class="tx-row"><span class="tx-type"><span class="dot ' + tx.cls + '"></span>' + tx.type + '</span><span class="tx-size">' + size + ' vB</span><span class="tx-fee">' + sats.toLocaleString('en-US') + ' sats</span><span class="tx-storage">$' + storage + '</span><span class="tx-see">' + now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0') + '</span></div>';
  }).join('');
  setText('tx-footer', 'Live block #' + (blockHeight || '').toLocaleString('en-US') + ' --- refreshed ' + now.toLocaleTimeString('en-US'));
}

// API data arrives
APP.onData(function(d) {
  if (!d) return;
  fees = d.fees || {};
  btcPrice = d.btc_price || 0;
  mempoolTx = (d.mempool || {}).unconfirmed_tx || 0;
  blockHeight = d.block_height || 0;

  updateBlockSpace();
  updateTxRows();
  // Reset live indicator on fresh data
  var ind = document.getElementById('live-indicator');
  if (ind) ind.dataset.start = Date.now();
  updateLiveIndicator(d);

  // Update block header from pipeline data if available, else direct API
  if (d.latest_block) {
    updateBlockUI(d.latest_block);
  }
});

// Initial render
updateBlockSpace();
fetchLiveBlock(); // fetch block data directly from mempool.space
APP.init();
