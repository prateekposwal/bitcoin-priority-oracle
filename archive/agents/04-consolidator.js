// DEPRECATED (M3/Top-5): merged root captured-data/ day files pre-spool.
// Source of truth is captured-data/spool + bsafe.db (via spool-consumer).
// Do not run; kept for reference.
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..', '..', 'captured-data');

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function getYesterday() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function parseDate(dateStr) {
  var parts = dateStr.split('-');
  return { year: parts[0], month: parts[1], day: parts[2] };
}

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    console.error('[WARN] Cannot create directory ' + dir + ': ' + e.message);
  }
}

function summarize(values) {
  if (!values || values.length === 0) return null;
  var sorted = values.slice().sort(function(a, b) { return a - b; });
  var n = sorted.length;
  var sum = 0;
  for (var i = 0; i < n; i++) sum += sorted[i];
  return {
    min: sorted[0],
    max: sorted[n - 1],
    avg: Math.round(sum / n * 10) / 10,
    median: n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)],
    p25: sorted[Math.floor(n * 0.25)],
    p75: sorted[Math.floor(n * 0.75)]
  };
}

function readCaptureFiles(dir) {
  var files = [];
  try {
    if (!fs.existsSync(dir)) {
      return { files: [], count: 0 };
    }
    var entries = fs.readdirSync(dir);
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var fullPath = path.join(dir, entry);
      var stat = fs.statSync(fullPath);
      if (stat.isFile() && entry.endsWith('.json')) {
        try {
          var content = fs.readFileSync(fullPath, 'utf8');
          var data = JSON.parse(content);
          files.push(data);
        } catch (e) {
          console.warn('[WARN] Skipping unparseable file ' + fullPath + ': ' + e.message);
        }
      }
    }
  } catch (e) {
    console.warn('[WARN] Error reading directory ' + dir + ': ' + e.message);
  }
  return { files: files, count: files.length };
}

function getNested(obj, pathParts) {
  var val = obj;
  for (var i = 0; i < pathParts.length; i++) {
    if (val == null || typeof val !== 'object') return null;
    val = val[pathParts[i]];
  }
  return val;
}

function collectMetrics(files, endpointKey, dataPath, successCheck) {
  var values = [];
  for (var i = 0; i < files.length; i++) {
    var ep = getNested(files[i], ['endpoints', endpointKey]);
    if (!ep || !ep.ok) continue;
    var val = getNested(ep, dataPath);
    if (val != null && typeof val === 'number' && isFinite(val)) {
      if (successCheck) {
        if (!successCheck(ep)) continue;
      }
      values.push(val);
    }
  }
  return values;
}

function collectMetricsFromArray(files, endpointKey, arrayPath, mapFn) {
  var values = [];
  for (var i = 0; i < files.length; i++) {
    var ep = getNested(files[i], ['endpoints', endpointKey]);
    if (!ep || !ep.ok) continue;
    var arr = getNested(ep, arrayPath);
    if (Array.isArray(arr)) {
      for (var j = 0; j < arr.length; j++) {
        var v = mapFn(arr[j]);
        if (v != null && typeof v === 'number' && isFinite(v)) {
          values.push(v);
        }
      }
    }
  }
  return values;
}

function computeMempoolTimes(files) {
  var byTime = [];
  for (var i = 0; i < files.length; i++) {
    var ep = getNested(files[i], ['endpoints', 'mempool']);
    if (!ep || !ep.ok) continue;
    var count = getNested(ep, ['data', 'count']);
    if (count == null) continue;
    var time = files[i].captureTime;
    if (!time) continue;
    byTime.push({ time: time, count: count });
  }
  byTime.sort(function(a, b) { return a.count - b.count; });
  var peak = byTime.length > 0 ? byTime[byTime.length - 1] : null;
  var low = byTime.length > 0 ? byTime[0] : null;
  return {
    peakTime: peak ? peak.time : null,
    lowTime: low ? low.time : null
  };
}

function computeBlockIntervals(files) {
  var intervals = [];
  var lastTs = null;
  for (var i = 0; i < files.length; i++) {
    var ep = getNested(files[i], ['endpoints', 'block_height']);
    if (!ep || !ep.ok) continue;
    var height = getNested(ep, ['data']);
    if (height == null) continue;
    var ts = new Date(files[i].captureTime).getTime();
    if (lastTs != null && height > 0) {
      var interval = (ts - lastTs) / 1000;
      if (interval > 0 && interval < 3600) {
        intervals.push(interval);
      }
    }
    lastTs = ts;
  }
  return intervals;
}

function computeBtcPrice(files) {
  var opens = [];
  var closes = [];
  var highs = [];
  var lows = [];
  var avgs = [];
  for (var i = 0; i < files.length; i++) {
    var ep = getNested(files[i], ['endpoints', 'btc_price']);
    if (!ep || !ep.ok) continue;
    var data = getNested(ep, ['data']);
    if (!data) continue;
    var price = data.USD || data.usd || null;
    if (price != null && typeof price === 'number') {
      avgs.push(price);
    }
    var high = data.high || data.HIGH || null;
    var low = data.low || data.LOW || null;
    var open = data.open || data.OPEN || null;
    var close = data.close || data.CLOSE || null;
    if (high != null) highs.push(high);
    if (low != null) lows.push(low);
    if (open != null) opens.push(open);
    if (close != null) closes.push(close);
  }
  if (avgs.length === 0) return null;
  return {
    open: opens.length > 0 ? opens[0] : Math.round(summarize(avgs).avg),
    close: closes.length > 0 ? closes[closes.length - 1] : Math.round(summarize(avgs).avg),
    high: highs.length > 0 ? Math.max.apply(null, highs) : Math.round(summarize(avgs).max),
    low: lows.length > 0 ? Math.min.apply(null, lows) : Math.round(summarize(avgs).min),
    avg: Math.round(summarize(avgs).avg)
  };
}

function computeFeeVolatility(feeValues) {
  if (!feeValues || feeValues.length < 2) return null;
  var mean = 0;
  for (var i = 0; i < feeValues.length; i++) mean += feeValues[i];
  mean /= feeValues.length;
  var variance = 0;
  for (var i = 0; i < feeValues.length; i++) variance += (feeValues[i] - mean) * (feeValues[i] - mean);
  variance /= feeValues.length;
  var stddev = Math.sqrt(variance);
  return Math.round(stddev / (mean || 1) * 100) / 100;
}

function computeMempoolPressureTrend(mempoolCounts) {
  if (!mempoolCounts || mempoolCounts.length < 4) return 'stable';
  var half = Math.floor(mempoolCounts.length / 2);
  var firstHalf = 0;
  for (var i = 0; i < half; i++) firstHalf += mempoolCounts[i];
  firstHalf /= half;
  var secondHalf = 0;
  for (var i = half; i < mempoolCounts.length; i++) secondHalf += mempoolCounts[i];
  secondHalf /= (mempoolCounts.length - half);
  var diff = secondHalf - firstHalf;
  if (diff < -5000) return 'declining';
  if (diff > 5000) return 'rising';
  return 'stable';
}

function computeEstimatedClearTime(feeValues) {
  if (!feeValues || feeValues.length === 0) return null;
  var avg = 0;
  for (var i = 0; i < feeValues.length; i++) avg += feeValues[i];
  avg /= feeValues.length;
  if (avg <= 1) return 0.5;
  if (avg <= 5) return 2;
  if (avg <= 15) return 4.5;
  if (avg <= 30) return 8;
  return 12;
}

function combineAllFiles(sourceDirs) {
  var allFiles = [];
  var sourceFiles = { total: 0, basic: 0, enhanced: 0, tracker: 0, backfill: 0 };
  var dirKeys = ['basic', 'backfill', 'tracker', 'enhanced'];

  for (var d = 0; d < sourceDirs.length; d++) {
    var dirInfo = sourceDirs[d];
    var result = readCaptureFiles(dirInfo.path);
    var key = dirKeys[d];
    sourceFiles[key] = result.count;
    sourceFiles.total += result.count;
    for (var f = 0; f < result.files.length; f++) {
      allFiles.push(result.files[f]);
    }
  }
  return { files: allFiles, sourceFiles: sourceFiles };
}

function consolidateDate(dateStr) {
  var parts = parseDate(dateStr);
  var baseDir = path.join(ROOT);

  var sourceDirs = [
    { path: path.join(baseDir, parts.year + '-' + parts.month + '-' + parts.day) },
    { path: path.join(baseDir, 'backfill', dateStr) },
    { path: path.join(baseDir, 'tracker', dateStr) },
    { path: path.join(baseDir, 'enhanced', dateStr) }
  ];

  var combined = combineAllFiles(sourceDirs);
  var files = combined.files;
  var sourceFiles = combined.sourceFiles;

  if (files.length === 0) {
    console.warn('[WARN] No capture files found for ' + dateStr + ' in any source directory');
    return null;
  }

  console.log('[INFO] Found ' + files.length + ' total captures for ' + dateStr);

  var fastestFees = collectMetrics(files, 'fees', ['data', 'fastestFee']);
  var economyFees = collectMetrics(files, 'fees', ['data', 'economyFee']);
  var hourFees = collectMetrics(files, 'fees', ['data', 'hourFee']);
  var mempoolCounts = collectMetrics(files, 'mempool', ['data', 'count']);
  var blockIntervals = computeBlockIntervals(files);
  var lightningNodes = collectMetrics(files, 'lightning', ['data', 'nodes']);
  var lightningChannels = collectMetrics(files, 'lightning', ['data', 'channels']);
  var lightningCapacity = collectMetrics(files, 'lightning', ['data', 'totalCapacity']);

  var mempoolTimes = computeMempoolTimes(files);
  var btcPrice = computeBtcPrice(files);

  var feeSummary = {};
  if (fastestFees.length > 0) feeSummary.fastest = summarize(fastestFees);
  if (economyFees.length > 0) feeSummary.economy = summarize(economyFees);
  if (hourFees.length > 0) feeSummary.hour = summarize(hourFees);

  var mempoolSummary = null;
  if (mempoolCounts.length > 0) {
    mempoolSummary = summarize(mempoolCounts);
    mempoolSummary.peakTime = mempoolTimes.peakTime;
    mempoolSummary.lowTime = mempoolTimes.lowTime;
  }

  var blockSummary = null;
  if (blockIntervals.length > 0) {
    var bi = summarize(blockIntervals);
    blockSummary = {
      totalBlocks: files.length,
      avgInterval: Math.round(bi.avg),
      minInterval: bi.min,
      maxInterval: bi.max
    };
  }

  var lightningSummary = null;
  if (lightningNodes.length > 0 || lightningChannels.length > 0 || lightningCapacity.length > 0) {
    lightningSummary = {};
    if (lightningNodes.length > 0) lightningSummary.nodes = { avg: Math.round(summarize(lightningNodes).avg * 10) / 10 };
    if (lightningChannels.length > 0) lightningSummary.channels = { avg: Math.round(summarize(lightningChannels).avg * 10) / 10 };
    if (lightningCapacity.length > 0) lightningSummary.capacity = { avg: Math.round(summarize(lightningCapacity).avg * 10) / 10 };
  }

  var feeVolatility = computeFeeVolatility(fastestFees);
  var mempoolTrend = computeMempoolPressureTrend(mempoolCounts);
  var blocksPerHour = files.length > 0 ? Math.round((files.length / 24) * 100) / 100 : null;
  var estClearTime = computeEstimatedClearTime(fastestFees);

  var consolidated = {
    date: dateStr,
    sourceFiles: sourceFiles,
    feeSummary: feeSummary,
    mempoolSummary: mempoolSummary,
    blockSummary: blockSummary,
    btcPrice: btcPrice,
    lightningSummary: lightningSummary,
    derived: {
      feeVolatility: feeVolatility,
      mempoolPressureTrend: mempoolTrend,
      blocksPerHour: blocksPerHour,
      estimatedClearTime: estClearTime
    }
  };

  var outputDir = path.join(ROOT, 'consolidated');
  ensureDir(outputDir);
  var outputPath = path.join(outputDir, dateStr + '.json');
  fs.writeFileSync(outputPath, JSON.stringify(consolidated, null, 2));

  console.log('[INFO] Consolidated data written to ' + outputPath);
  return consolidated;
}

function main() {
  var dateStr = process.argv[2];

  if (!dateStr) {
    dateStr = getYesterday();
    console.log('[INFO] No date argument provided. Using yesterday: ' + dateStr);
  }

  var datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateStr)) {
    console.error('[ERROR] Invalid date format. Expected YYYY-MM-DD, got: ' + dateStr);
    process.exit(1);
  }

  console.log('[INFO] Starting consolidation for date: ' + dateStr);
  try {
    var result = consolidateDate(dateStr);
    if (result) {
      console.log('[INFO] Consolidation complete for ' + dateStr);
      console.log('[INFO] Source files: ' + result.sourceFiles.total + ' total');
      console.log('[INFO] Output: captured-data/consolidated/' + dateStr + '.json');
    } else {
      console.warn('[WARN] Consolidation produced no output for ' + dateStr);
      process.exit(1);
    }
  } catch (e) {
    console.error('[ERROR] Consolidation failed: ' + e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { consolidateDate: consolidateDate, summarize: summarize };
