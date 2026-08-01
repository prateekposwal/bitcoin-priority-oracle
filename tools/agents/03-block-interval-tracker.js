var https = require('https');
var fs = require('fs');
var path = require('path');

var STATE_FILE = path.join(__dirname, '..', '..', 'captured-data', 'tracker-state.json');

function httpGet(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse: ' + url + ' - ' + e.message)); }
      });
    }).on('error', reject);
  });
}

function ensureDir(filePath) {
  var dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function defaultState() {
  return {
    previousMempoolCount: 0,
    previousVsize: 0,
    previousFees: { fastestFee: 0, halfHourFee: 0, hourFee: 0, economyFee: 0 },
    previousTimestamp: null
  };
}

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      var raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Warning: Could not read state file, using defaults:', e.message);
  }
  return defaultState();
}

function writeState(state) {
  ensureDir(STATE_FILE);
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function writeMetrics(metrics) {
  var dt = new Date(metrics.captureTime);
  var y = dt.getUTCFullYear();
  var m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  var d = String(dt.getUTCDate()).padStart(2, '0');
  var hh = String(dt.getUTCHours()).padStart(2, '0');
  var mm = String(dt.getUTCMinutes()).padStart(2, '0');
  var ss = String(dt.getUTCSeconds()).padStart(2, '0');
  var dir = path.join(__dirname, '..', '..', 'captured-data', 'tracker', y + '-' + m + '-' + d);
  var filePath = path.join(dir, y + '-' + m + '-' + d + '_' + hh + '-' + mm + '-' + ss + '.json');
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2), 'utf8');
  return filePath;
}

function computeInflowRate(changeSinceLast, secondsSinceLast) {
  if (secondsSinceLast <= 0) return 0;
  var estimatedBlockTx = 6;
  var blocksInInterval = secondsSinceLast / 600;
  var outflowEstimate = blocksInInterval * estimatedBlockTx;
  return (changeSinceLast + outflowEstimate) / secondsSinceLast;
}

function computeFeeVolatility(fees) {
  var levels = [fees.fastestFee, fees.halfHourFee, fees.hourFee, fees.economyFee];
  var max = Math.max.apply(null, levels);
  var min = Math.min.apply(null, levels);
  var avg = levels.reduce(function (a, b) { return a + b; }, 0) / levels.length;
  if (avg === 0) return 0;
  return (max - min) / avg;
}

function track() {
  var state = readState();
  var previousCount = state.previousMempoolCount || 0;
  var previousVsize = state.previousVsize || 0;
  var previousFees = state.previousFees || { fastestFee: 0, halfHourFee: 0, hourFee: 0, economyFee: 0 };
  var previousTimestamp = state.previousTimestamp ? new Date(state.previousTimestamp) : null;

  var blockUrl = 'https://mempool.space/api/blocks?limit=5';
  var mempoolUrl = 'https://mempool.space/api/mempool';
  var feesUrl = 'https://mempool.space/api/v1/fees/recommended';

  return Promise.all([
    httpGet(blockUrl),
    httpGet(mempoolUrl),
    httpGet(feesUrl)
  ]).then(function (results) {
    var blocks = results[0];
    var mempoolData = results[1];
    var currentFees = results[2];

    var now = new Date();
    var currentCount = mempoolData.count || mempoolData.length || 0;
    var currentVsize = mempoolData.vsize || 0;

    var blocksData = {
      count: blocks ? blocks.length : 0
    };

    var intervals = [];
    if (blocks && blocks.length >= 2) {
      for (var i = 0; i < blocks.length - 1; i++) {
        var interval = blocks[i].timestamp - blocks[i + 1].timestamp;
        intervals.push(interval > 0 ? interval : 0);
      }
    }

    var avgInterval = intervals.length > 0
      ? intervals.reduce(function (a, b) { return a + b; }, 0) / intervals.length
      : 0;
    var minInterval = intervals.length > 0
      ? Math.min.apply(null, intervals)
      : 0;
    var maxInterval = intervals.length > 0
      ? Math.max.apply(null, intervals)
      : 0;

    blocksData.intervals = intervals;
    blocksData.avgInterval = Math.round(avgInterval * 100) / 100;
    blocksData.minInterval = minInterval;
    blocksData.maxInterval = maxInterval;

    var secondsSinceLast = previousTimestamp
      ? (now.getTime() - previousTimestamp.getTime()) / 1000
      : 600;

    if (secondsSinceLast <= 0) secondsSinceLast = 1;

    var changeSinceLast = currentCount - previousCount;
    var changePerSecond = changeSinceLast / secondsSinceLast;
    var inflowRate = computeInflowRate(changeSinceLast, secondsSinceLast);

    var mempoolDataObj = {
      count: currentCount,
      vsize: currentVsize,
      changeSinceLast: changeSinceLast,
      changePerSecond: Math.round(changePerSecond * 10000) / 10000,
      inflowRate: Math.round(inflowRate * 10000) / 10000
    };

    var fastestChange = previousFees && previousFees.fastestFee !== undefined
      ? currentFees.fastestFee - previousFees.fastestFee
      : 0;
    var volatility = computeFeeVolatility(currentFees);

    var feesData = {
      fastest: currentFees.fastestFee,
      halfHour: currentFees.halfHourFee,
      hour: currentFees.hourFee,
      economy: currentFees.economyFee,
      fastestChange: fastestChange,
      volatility: Math.round(volatility * 10000) / 10000
    };

    var blocksPerHour = avgInterval > 0 ? 3600 / avgInterval : 0;
    var estimatedTxPerBlock = 6;
    var mempoolClearTimeHours = blocksPerHour > 0
      ? currentCount / (blocksPerHour * estimatedTxPerBlock)
      : 0;

    var networkData = {
      blocksPerHour: Math.round(blocksPerHour * 100) / 100,
      mempoolClearTimeHours: Math.round(mempoolClearTimeHours * 100) / 100
    };

    var metrics = {
      captureTime: now.toISOString(),
      blocks: blocksData,
      mempool: mempoolDataObj,
      fees: feesData,
      network: networkData
    };

    var savedPath = writeMetrics(metrics);

    try {
      var spoolMod = require('../data-engineering/spool.js');
      spoolMod.init().then(function(spool) {
        var localTs = metrics.captureTime.replace(/[:T]/g, '-').slice(0, 19).replace('T', '_');
        var day = localTs.slice(0, 10);
        var cycleTs = localTs.slice(0, 10) + '_' + localTs.slice(11);
        return spool.enqueue('block_interval', { status: 200, data: metrics, fetchedAt: metrics.captureTime }, { captureTime: cycleTs, day: day, producer: 'agent-03', expectedIntervalMinutes: 60 });
      }).catch(function(e) { console.error('[tracker] spool enqueue error:', e.message); });
    } catch (e) { console.error('[tracker] spool unavailable:', e.message); }

    var newState = {
      previousMempoolCount: currentCount,
      previousVsize: currentVsize,
      previousFees: {
        fastestFee: currentFees.fastestFee,
        halfHourFee: currentFees.halfHourFee,
        hourFee: currentFees.hourFee,
        economyFee: currentFees.economyFee
      },
      previousTimestamp: now.toISOString()
    };
    writeState(newState);

    console.log('[tracker] Saved: ' + savedPath);
    return metrics;
  }).catch(function (err) {
    console.error('[tracker] Error:', err.message);
    throw err;
  });
}

module.exports = { track: track };

if (require.main === module) {
  track().then(function (m) {
    console.log(JSON.stringify(m, null, 2));
  }).catch(function (e) {
    process.exit(1);
  });
}
