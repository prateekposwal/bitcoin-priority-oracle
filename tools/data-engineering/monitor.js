var https = require('https');
var fs = require('fs');
var path = require('path');

function fetchEndpoint(url, timeout) {
  return new Promise(function(resolve) {
    timeout = timeout || 10000;
    try {
      var u = new URL(url);
      var opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', timeout: timeout, headers: { 'User-Agent': 'DataEngineMonitor/1.0' } };
      var start = Date.now();
      var req = https.request(opts, function(res) {
        var body = '';
        res.on('data', function(c) { body += c; });
        res.on('end', function() {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, latency: Date.now() - start, body: body, size: Buffer.byteLength(body, 'utf-8'), contentType: res.headers['content-type'] || '' });
        });
      });
      req.on('error', function(e) { resolve({ ok: false, status: 0, latency: Date.now() - start, size: 0, error: e.message }); });
      req.on('timeout', function() { req.destroy(); resolve({ ok: false, status: 0, latency: Date.now() - start, size: 0, error: 'timeout' }); });
      req.end();
    } catch (e) { resolve({ ok: false, status: 0, latency: 0, size: 0, error: e.message }); }
  });
}

function checkEndpoint(endpoint) {
  return fetchEndpoint(endpoint.url, (endpoint.maxLatency || 3000) + 2000)
    .then(function(res) {
      var ok = res.ok && (!endpoint.maxLatency || res.latency <= endpoint.maxLatency);
      return {
        key: endpoint.key,
        ok: ok,
        latency: res.latency,
        status: res.status,
        size: res.size,
        error: res.error || null,
        checkedAt: new Date().toISOString(),
        dataAge: res.ok ? 'current' : 'stale',
      };
    });
}

function checkAllEndpoints(endpoints) {
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    return Promise.resolve({ results: {}, healthy: 0, unhealthy: 0, total: 0, timestamp: new Date().toISOString() });
  }
  var tasks = endpoints.map(function(ep) {
    return checkEndpoint(ep).then(function(r) { return { key: ep.key, result: r }; });
  });
  return Promise.all(tasks).then(function(results) {
    var healthy = 0, unhealthy = 0;
    var resultsMap = {};
    results.forEach(function(item) {
      resultsMap[item.key] = item.result;
      if (item.result.ok) { healthy++; } else { unhealthy++; }
    });
    return { results: resultsMap, healthy: healthy, unhealthy: unhealthy, total: endpoints.length, timestamp: new Date().toISOString() };
  });
}

function getFreshnessReport(dataDir) {
  var report = { sources: {}, oldest: null, newest: null };
  if (!fs.existsSync(dataDir)) return report;

  // Primary: spool cursor freshness (single source of truth after M3/Top-5).
  try {
    var spool = require('./spool.js');
    return spool.init().then(function(s) { return s.stats(); }).then(function(st) {
      var now = Date.now();
      var oldestMs = Infinity, newestMs = 0;
      var spoolRoot = path.join(__dirname, '..', '..', 'captured-data', 'spool');
      var curDir = path.join(spoolRoot, 'cursors');
      var cursorFiles = [];
      if (fs.existsSync(curDir)) cursorFiles = fs.readdirSync(curDir).filter(function(f) { return f.endsWith('.json'); });
      cursorFiles.forEach(function(f) {
        var src = f.replace('.json', '');
        try {
          var cur = JSON.parse(fs.readFileSync(path.join(curDir, f), 'utf8'));
          var lastSeenMs = new Date(cur.lastSeen).getTime();
          var ageMinutes = Math.round((now - lastSeenMs) / 60000);
          var healthy = ageMinutes <= 30;
          report.sources[src] = { lastCapture: cur.lastCycleTs || null, ageMinutes: ageMinutes, healthy: healthy };
          if (lastSeenMs < oldestMs) oldestMs = lastSeenMs;
          if (lastSeenMs > newestMs) newestMs = lastSeenMs;
        } catch (e) {}
      });
      report.oldest = oldestMs === Infinity ? null : new Date(oldestMs).toISOString();
      report.newest = newestMs === 0 ? null : new Date(newestMs).toISOString();
      if (Object.keys(report.sources).length > 0) return report;
      return rootFileFreshness(dataDir, report);
    }).catch(function() { return rootFileFreshness(dataDir, report); });
  } catch (e) {
    return rootFileFreshness(dataDir, report);
  }
}

function rootFileFreshness(dataDir, report) {
  var entries;
  try { entries = fs.readdirSync(dataDir); } catch (e) { return report; }
  var sourceMap = {};
  entries.forEach(function(entry) {
    var fullPath = path.join(dataDir, entry);
    var stat;
    try { stat = fs.statSync(fullPath); } catch (e) { return; }
    if (!stat.isFile()) return;
    if (!/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/.test(entry)) return;
    var parts = entry.split('-');
    var sourceKey = parts[0] || 'unknown';
    var captureTime = stat.mtimeMs;
    if (!sourceMap[sourceKey] || captureTime > sourceMap[sourceKey].mtime) {
      sourceMap[sourceKey] = { file: entry, mtime: captureTime, mtimeDate: stat.mtime };
    }
  });
  var now = Date.now();
  var oldestMs = Infinity, newestMs = 0;
  Object.keys(sourceMap).forEach(function(key) {
    var info = sourceMap[key];
    var ageMinutes = Math.round((now - info.mtime) / 60000);
    report.sources[key] = { lastCapture: info.mtimeDate.toISOString(), ageMinutes: ageMinutes, healthy: ageMinutes <= 30 };
    if (info.mtime < oldestMs) { oldestMs = info.mtime; }
    if (info.mtime > newestMs) { newestMs = info.mtime; }
  });
  report.oldest = oldestMs === Infinity ? null : new Date(oldestMs).toISOString();
  report.newest = newestMs === 0 ? null : new Date(newestMs).toISOString();
  return report;
}

function getErrorReport(endpoints) {
  var attempts = 3;
  var errorCounts = {};
  var totalErrors = 0;
  var totalChecks = 0;
  var tasks = [];
  for (var i = 0; i < attempts; i++) {
    tasks.push(checkAllEndpoints(endpoints));
  }
  return Promise.all(tasks).then(function(rounds) {
    rounds.forEach(function(round) {
      Object.keys(round.results).forEach(function(key) {
        totalChecks++;
        if (!round.results[key].ok) {
          errorCounts[key] = (errorCounts[key] || 0) + 1;
          totalErrors++;
        }
      });
    });
    var errorRate = totalChecks > 0 ? (totalErrors / totalChecks) * 100 : 0;
    var recommendation = 'healthy';
    if (errorRate >= 20) { recommendation = 'critical'; }
    else if (errorRate >= 5) { recommendation = 'investigate'; }
    return { errors: errorCounts, totalErrors: totalErrors, errorRate: Math.round(errorRate * 100) / 100, recommendation: recommendation };
  });
}

function getDataQualityScore() {
  var endpoints = [];
  try {
    var configPath = path.join(__dirname, 'config.js');
    if (fs.existsSync(configPath)) {
      var cfg = require('./config');
      if (cfg && cfg.CONFIG && Array.isArray(cfg.CONFIG.endpoints)) {
        endpoints = cfg.CONFIG.endpoints;
      }
    }
  } catch (e) {}
  return checkAllEndpoints(endpoints).then(function(healthResult) {
    var healthyCount = healthResult.healthy;
    var totalCount = healthResult.total;
    var dataDir = path.join(__dirname, '..', '..', 'captured-data');
    if (!fs.existsSync(dataDir)) {
      dataDir = path.join(process.cwd(), 'captured-data');
    }
    return Promise.resolve(getFreshnessReport(dataDir)).then(function(freshness) {
    var coverageScore = totalCount > 0 ? Math.round((healthyCount / totalCount) * 20) : 0;
    var freshnessScore = 0;
    var sourceKeys = Object.keys(freshness.sources);
    if (sourceKeys.length > 0) {
      var healthySources = 0;
      sourceKeys.forEach(function(k) { if (freshness.sources[k].healthy) healthySources++; });
      freshnessScore = Math.round((healthySources / sourceKeys.length) * 30);
    }
    return getErrorReport(endpoints).then(function(errorReport) {
      var reliabilityScore = 0;
      if (errorReport.errorRate < 5) { reliabilityScore = 30; }
      else if (errorReport.errorRate < 10) { reliabilityScore = 20; }
      else if (errorReport.errorRate < 20) { reliabilityScore = 10; }
      var latencyScores = [];
      Object.keys(healthResult.results).forEach(function(k) {
        var r = healthResult.results[k];
        if (r.latency <= 2000) { latencyScores.push(20); }
        else if (r.latency <= 4000) { latencyScores.push(10); }
        else { latencyScores.push(0); }
      });
      var latencyScore = latencyScores.length > 0 ? Math.round(latencyScores.reduce(function(a, b) { return a + b; }, 0) / latencyScores.length) : 0;
      var totalScore = freshnessScore + reliabilityScore + latencyScore + coverageScore;
      if (totalScore > 100) totalScore = 100;
      return {
        score: totalScore,
        components: { freshness: freshnessScore, reliability: reliabilityScore, latency: latencyScore, coverage: coverageScore },
      };
    });
    });
  });
}

module.exports = { checkAllEndpoints: checkAllEndpoints, checkEndpoint: checkEndpoint, getFreshnessReport: getFreshnessReport, getErrorReport: getErrorReport, getDataQualityScore: getDataQualityScore };
