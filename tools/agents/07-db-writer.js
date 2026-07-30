var fs = require('fs');
var path = require('path');
var db = require('../db/init.js');

var WATCH_DIRS = [
  path.resolve(__dirname, '..', '..', 'captured-data', 'backfill'),
  path.resolve(__dirname, '..', '..', 'captured-data', 'btc-rpc'),
  path.resolve(__dirname, '..', '..', 'captured-data', 'tracker'),
];

var processed = {};

function scanAndWrite() {
  var count = 0;
  for (var d = 0; d < WATCH_DIRS.length; d++) {
    var baseDir = WATCH_DIRS[d];
    if (!fs.existsSync(baseDir)) continue;
    try {
      var dates = fs.readdirSync(baseDir);
      for (var i = 0; i < dates.length; i++) {
        var dateDir = path.join(baseDir, dates[i]);
        if (!fs.statSync(dateDir).isDirectory()) continue;
        var files = fs.readdirSync(dateDir);
        for (var j = 0; j < files.length; j++) {
          var filePath = path.join(dateDir, files[j]);
          if (!filePath.endsWith('.json')) continue;
          if (processed[filePath]) continue;
          processed[filePath] = true;
          try {
            var content = fs.readFileSync(filePath, 'utf8');
            var data = JSON.parse(content);
            var source = path.basename(baseDir);
            var capturedAt = data.captureTime || data.capturedAt || '';
            var relPath = path.relative(path.resolve(__dirname, '..', '..', 'captured-data'), filePath);

            if (source === 'btc-rpc' && data.blocks) {
              for (var k = 0; k < data.blocks.length; k++) {
                var b = data.blocks[k];
                db.insertBlockStats(b.height, b.hash, new Date((b.time || 0) * 1000).toISOString(), b.txCount, b.size, b.weight, b.avgFee, b.avgFeeRate, b.feePercentiles, b.subsidy / 100000000, '');
              }
            }

            if (data.endpoints) {
              for (var key in data.endpoints) {
                var ep = data.endpoints[key];
                db.insertCapture(key, key, ep.status || 200, ep.latency || 0, JSON.stringify(ep.data || ep), '', relPath, data.cycle || 0);
                count++;
              }
            } else if (data.blocks || data.captureTime) {
              db.insertCapture(source, source, 200, 0, JSON.stringify(data), '', relPath, 0);
              count++;
            }
          } catch (e) { /* skip unparseable */ }
        }
      }
    } catch (e) { /* skip unwatchable */ }
  }
  return count;
}

function start() {
  db.getDB();
  var first = scanAndWrite();
  console.log('[DB Writer] Initial scan: ' + first + ' entries written');
  setInterval(function() {
    var c = scanAndWrite();
    if (c > 0) console.log('[DB Writer] +' + c + ' new entries');
  }, 30000);
}

if (require.main === module) { start(); }
module.exports = { start: start, scanAndWrite: scanAndWrite };
