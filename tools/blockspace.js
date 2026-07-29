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
    if(lb) lb.textContent = segs[i][1]+' '+(segs[i][2]>=1?Math.round(segs[i][2]):segs[i][2].toFixed(1))+'%';
  }

  // Update KPI cards
  var totalTx = Math.round(finPerBlock + insPerBlock);
  var blockSizeMB = ((fw + iw) / 1000000).toFixed(1);
  setText('kpi-tx', '~' + totalTx.toLocaleString());
  setText('kpi-size', '~' + blockSizeMB + ' MB');
  setText('kpi-ins-pct', Math.round(ip) + '%');

  // Update slider output values
  setText('so-fin', Math.round(fp) + '%');
  setText('so-ins', (ip >= 1 ? Math.round(ip) : ip.toFixed(1)) + '%');
  var ratio = finPerBlock > 0 ? (ip / fp) : 0;
  setText('so-ratio', ratio.toFixed(2));

  // Update narrative
  setText('narrative-text', 'At current inscription volumes (~' + vol + 'K/mo), inscriptions occupy ~' + (ip >= 1 ? Math.round(ip) : ip.toFixed(1)) + '% of block space.');
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateBlockUI(b) {
  setText('block-height', '#' + (b.height || '').toLocaleString());
  setText('block-hash', b.hash ? b.hash.substring(0, 16) + '...' : '---');
  if (b.timestamp) {
    var d2 = new Date((typeof b.timestamp === 'number' ? b.timestamp : Date.parse(b.timestamp)) * 1000);
    setText('block-time', isNaN(d2.getTime()) ? '---' : d2.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
  }
  var sizeMB = ((b.size || 0) / 1000000).toFixed(2);
  setText('block-stats', (b.tx_count || 0).toLocaleString() + ' txs . ' + sizeMB + ' MB . ' + (b.weight || 0).toLocaleString() + ' kWU');
  setText('tx-footer', 'Live block #' + (b.height || 0).toLocaleString() + ' --- ' + (b.tx_count || 0).toLocaleString() + ' transactions');
}

function updateLiveIndicator(d) {
  if (!d || !d.timestamp) return;
  var then = new Date(d.timestamp).getTime();
  var secsAgo = Math.round((Date.now() - then) / 1000);
  var ago = secsAgo < 60 ? secsAgo + 's' : Math.round(secsAgo / 60) + 'm';
  var el = document.getElementById('live-indicator');
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

// API data arrives
API.onData(function(d) {
  if (!d) return;
  fees = d.fees || {};
  btcPrice = d.btc_price || 0;
  mempoolTx = (d.mempool || {}).unconfirmed_tx || 0;
  blockHeight = d.block_height || 0;

  updateBlockSpace();
  updateLiveIndicator(d);

  // Update block header from pipeline data if available, else direct API
  if (d.latest_block) {
    updateBlockUI(d.latest_block);
  }
});

// Initial render
updateBlockSpace();
fetchLiveBlock(); // fetch block data directly from mempool.space
API.start({ interval: 60000 });
