var https = require('https');
var fs = require('fs');
var path = require('path');

var ENDPOINTS = [
  { key: 'fees',            url: 'https://mempool.space/api/v1/fees/recommended' },
  { key: 'btc_price',       url: 'https://mempool.space/api/v1/prices' },
  { key: 'mempool',         url: 'https://mempool.space/api/mempool' },
  { key: 'mempool_blocks',  url: 'https://mempool.space/api/v1/fees/mempool-blocks' },
  { key: 'fee_history',     url: 'https://mempool.space/api/v1/mining/blocks/fees/24h' },
  { key: 'lightning',       url: 'https://mempool.space/api/v1/lightning/statistics/latest' },
  { key: 'blocks',          url: 'https://mempool.space/api/blocks?limit=10' },
  { key: 'block_height',    url: 'https://blockstream.info/api/blocks/tip/height' }
];

function fetchJSON(url) {
  return new Promise(function(resolve) {
    try {
      var u = new URL(url);
      var opts = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        timeout: 15000,
        headers: { 'User-Agent': 'BitcoinSahi/1.0' }
      };
      var req = https.request(opts, function(res) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() {
          try {
            resolve({ ok: true, data: JSON.parse(body), status: res.statusCode });
          } catch (e) {
            resolve({ ok: true, data: body, status: res.statusCode });
          }
        });
      });
      req.on('error', function(e) { resolve({ ok: false, error: e.message }); });
      req.on('timeout', function() { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

var MAX_CYCLES = 1008;
var CYCLE_INTERVAL = 10 * 60 * 1000;
var cycleCount = 0;
var startTime = Date.now();
var errorCounts = {};
var completedWithError = false;

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function formatDirDate(now) {
  return now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
}

function formatFileTimestamp(now) {
  return now.getFullYear() + '-' +
    pad2(now.getMonth() + 1) + '-' +
    pad2(now.getDate()) + '_' +
    pad2(now.getHours()) + '-' +
    pad2(now.getMinutes()) + '-' +
    pad2(now.getSeconds());
}

function formatLogTime(now) {
  return pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
}

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    console.error('[FATAL] Cannot create directory ' + dir + ': ' + e.message);
    process.exit(1);
  }
}

function runCycle() {
  try {
    cycleCount++;
    var now = new Date();
    var dateDir = formatDirDate(now);
    var ts = formatFileTimestamp(now);
    var dir = path.join(__dirname, '..', '..', 'captured-data', 'backfill', dateDir);
    ensureDir(dir);

    var promises = ENDPOINTS.map(function(ep) {
      return fetchJSON(ep.url).then(function(result) {
        if (!result.ok) {
          errorCounts[ep.key] = (errorCounts[ep.key] || 0) + 1;
        }
        return { key: ep.key, result: result, fetchedAt: now.toISOString() };
      }).catch(function(err) {
        errorCounts[ep.key] = (errorCounts[ep.key] || 0) + 1;
        return { key: ep.key, result: { ok: false, error: err.message }, fetchedAt: now.toISOString() };
      });
    });

    Promise.all(promises).then(function(results) {
      try {
        var payload = {
          captureTime: now.toISOString(),
          cycle: cycleCount,
          endpoints: {}
        };
        results.forEach(function(r) { payload.endpoints[r.key] = r.result; });

        var filePath = path.join(dir, ts + '.json');
        fs.writeFileSync(filePath, JSON.stringify(payload));

        var elapsed = Math.floor((Date.now() - startTime) / 1000);
        var okay = 0;
        results.forEach(function(r) { if (r.result.ok) okay++; });
        var pct = ((cycleCount / MAX_CYCLES) * 100).toFixed(1);
        var logTime = formatLogTime(now);
        console.log('[' + logTime + '] Captured ' + okay + '/' + ENDPOINTS.length + ' endpoints — running ' + cycleCount + ' of ' + MAX_CYCLES + ' cycles (' + pct + '%, ' + elapsed + 's elapsed)');

        if (cycleCount % 10 === 0) {
          var errKeys = Object.keys(errorCounts);
          var stats = '--- Stats after ' + cycleCount + ' cycles ---';
          console.log(stats);
          console.log('  Total elapsed: ' + Math.floor(elapsed / 3600) + 'h ' + Math.floor((elapsed % 3600) / 60) + 'm ' + (elapsed % 60) + 's');
          console.log('  Avg cycle time: ' + Math.round(elapsed / cycleCount) + 's');
          if (errKeys.length > 0) {
            console.log('  Errors:');
            errKeys.forEach(function(k) { console.log('    ' + k + ': ' + errorCounts[k]); });
          } else {
            console.log('  Errors: none');
          }
        }

        if (cycleCount >= MAX_CYCLES) {
          finish();
        }
      } catch (e) {
        console.error('[ERROR] write phase failed: ' + e.message);
      }
    }).catch(function(err) {
      console.error('[ERROR] Promise.all failed: ' + err.message);
    });
  } catch (e) {
    console.error('[ERROR] runCycle failed: ' + e.message);
  }
}

function finish() {
  try {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var summary = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      totalCycles: cycleCount,
      elapsedSeconds: elapsed,
      elapsedFormatted: Math.floor(elapsed / 3600) + 'h ' + Math.floor((elapsed % 3600) / 60) + 'm ' + (elapsed % 60) + 's',
      totalCaptures: cycleCount * ENDPOINTS.length,
      errorsPerEndpoint: {}
    };
    Object.keys(errorCounts).sort().forEach(function(k) { summary.errorsPerEndpoint[k] = errorCounts[k]; });

    var summaryDir = path.join(__dirname, '..', '..', 'captured-data', 'backfill');
    ensureDir(summaryDir);
    var summaryPath = path.join(summaryDir, 'backfill-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('\n========================================');
    console.log('BACKFILL COMPLETE');
    console.log('  Cycles: ' + cycleCount + '/' + MAX_CYCLES);
    console.log('  Duration: ' + summary.elapsedFormatted);
    console.log('  Total captures: ' + summary.totalCaptures);
    console.log('  Summary saved: ' + summaryPath);
    console.log('========================================\n');
    process.exit(0);
  } catch (e) {
    console.error('[FATAL] finish() failed: ' + e.message);
    process.exit(1);
  }
}

process.on('uncaughtException', function(err) {
  console.error('[UNCAUGHT] ' + err.message);
});

process.on('unhandledRejection', function(err) {
  console.error('[UNHANDLED] ' + (err.message || err));
});

console.log('Starting backfill — capturing ' + ENDPOINTS.length + ' endpoints every 10min for ' + MAX_CYCLES + ' cycles (7 days)');
console.log('Start time: ' + new Date(startTime).toISOString());
console.log('Data dir: ' + path.join(__dirname, '..', '..', 'captured-data', 'backfill'));
console.log('');

runCycle();
setInterval(runCycle, CYCLE_INTERVAL);
