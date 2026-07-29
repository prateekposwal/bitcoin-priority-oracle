// Blockspace Explorer — external script (loaded after page is ready)
var fees = {}, btcPrice = 0, mempoolTx = 0;

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
  var segs = [['seg-fin','Financial',fp],['seg-ins','Inscriptions',ip],['seg-ln','Lightning',4*sd],['seg-other','Other',6*sd],['seg-empty','Empty',ep]];
  for(var i=0;i<segs.length;i++){
    var se = document.getElementById(segs[i][0]);
    if(!se)continue;
    se.style.width = Math.max(0.3,segs[i][2])+'%';
    var lb = se.querySelector('.seg-label');
    if(lb) lb.textContent = segs[i][1]+' '+(segs[i][2]>=1?Math.round(segs[i][2]):segs[i][2].toFixed(1))+'%';
  }
  var sf = document.getElementById('so-fin');
  if (sf) sf.textContent = Math.round(fp) + '%';
  var si = document.getElementById('so-ins');
  if (si) si.textContent = Math.round(ip) + '%';
  var sr = document.getElementById('so-ratio');
  if (sr) sr.textContent = (finPerBlock > 0 ? (ip / fp) : 0).toFixed(2);
  var narr = document.getElementById('narrative-text');
  if (narr) narr.textContent = 'At current inscription volumes (~' + vol + 'K/mo), inscriptions occupy ~' + Math.round(ip) + '% of block space.';
}

API.onData(function(d) {
  if (!d) return;
  fees = d.fees || {};
  mempoolTx = (d.mempool || {}).unconfirmed_tx || 0;
  updateBlockSpace();
});

updateBlockSpace();
API.start({ interval: 60000 });
