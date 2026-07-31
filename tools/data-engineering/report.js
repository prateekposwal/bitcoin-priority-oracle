var fs = require('fs');
var path = require('path');
var monitor = require('./monitor');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function weekNumber() {
  var d = new Date();
  var start = new Date(d.getFullYear(), 0, 1);
  var diff = (d - start) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

function generateDailyReport() {
  var config = {};
  var endpoints = [];
  try {
    var cfg = require('./config');
    config = cfg.CONFIG || {};
    endpoints = config.endpoints || [];
  } catch (e) {}

  return monitor.checkAllEndpoints(endpoints).then(function(health) {
    return monitor.getDataQualityScore().then(function(quality) {
      return monitor.getErrorReport(endpoints).then(function(errors) {
        return require('./spool.js').init().then(function(spool) { return spool.stats(); }).catch(function() { return null; }).then(function(spoolStats) {
        var reportDir = config.agent && config.agent.reportDir ? config.agent.reportDir : 'reports/data-engineering';
        var absReportDir = path.resolve(reportDir);
        ensureDir(absReportDir);

        var dateStr = today();
        var lines = [];
        lines.push('# Data Engineering Report — ' + dateStr);
        lines.push('');

        var captureCount = 0;
        var dataSizeMB = 0;
        var lifetime = 0;
        var todayCount = 0;
        if (spoolStats) {
          lifetime = spoolStats.history ? spoolStats.history.totalEnqueued : spoolStats.totals.enqueued;
          captureCount = lifetime;
          dataSizeMB = Math.round((spoolStats.queueBytes || 0) / (1024 * 1024) * 10) / 10;
          try {
            var db = require('../db/init.js');
            var todayRows = db.query("SELECT COUNT(*) AS c FROM captures WHERE date(captured_at) = date('now')");
            if (todayRows && todayRows[0]) todayCount = todayRows[0].c || 0;
          } catch (e) {}
          try { dataSizeMB = Math.round((fs.statSync(path.join(__dirname, '..', '..', 'captured-data', 'bsahi.db')).size) / (1024 * 1024) * 10) / 10; } catch (e) {}
        } else {
          var capturedDir = path.join(__dirname, '..', '..', 'captured-data');
          if (fs.existsSync(capturedDir)) {
            try {
              var files = fs.readdirSync(capturedDir);
              files.forEach(function(f) {
                var fp = path.join(capturedDir, f);
                try {
                  var stat = fs.statSync(fp);
                  if (stat.isFile()) {
                    captureCount++;
                    dataSizeMB += stat.size;
                  }
                } catch (e) {}
              });
              dataSizeMB = Math.round((dataSizeMB / (1024 * 1024)) * 10) / 10;
            } catch (e) {}
          }
        }

        lines.push('## Overview');
        lines.push('- Quality Score: ' + quality.score + '/100');
        lines.push('- Endpoints: ' + health.healthy + '/' + health.total + ' healthy');
        lines.push('- Spool lifetime: ' + lifetime + ' entries (' + todayCount + ' today, ' + (spoolStats ? spoolStats.totals.acked + ' acked, ' + spoolStats.totals.pending + ' pending' : '') + ')');
        lines.push('- Data stored: ' + dataSizeMB + ' MB');
        lines.push('');

        lines.push('## Endpoint Health');
        lines.push('| Endpoint | Status | Latency | Freshness | Errors |');
        lines.push('|----------|--------|---------|-----------|--------|');
        Object.keys(health.results).forEach(function(key) {
          var r = health.results[key];
          var status = r.ok ? '✅' : '❌';
          var latency = r.latency + 'ms';
          var freshness = r.dataAge === 'current' ? 'current' : 'stale';
          var errCount = errors.errors[key] || 0;
          lines.push('| ' + key + ' | ' + status + ' | ' + latency + ' | ' + freshness + ' | ' + errCount + ' |');
        });
        lines.push('');

        lines.push('## Issues');
        var hasIssues = false;
        Object.keys(health.results).forEach(function(key) {
          if (!health.results[key].ok) {
            hasIssues = true;
            var r = health.results[key];
            lines.push('- **' + key + '**: ' + (r.error || 'status ' + r.status) + ' (latency: ' + r.latency + 'ms)');
          }
        });
        if (!hasIssues) lines.push('- None');
        lines.push('');

        lines.push('## Recommendations');
        var recs = [];
        if (quality.score < 60) recs.push('Critical: Quality score below 60. Immediate investigation required.');
        if (quality.score < 80) recs.push('Warning: Quality score below 80. Review endpoint health and freshness.');
        if (health.unhealthy > 0) recs.push('Investigate ' + health.unhealthy + ' unhealthy endpoint(s).');
        if (errors.errorRate > 5) recs.push('Error rate at ' + errors.errorRate + '%. Consider adjusting timeouts or retry logic.');
        if (errors.recommendation === 'critical') recs.push('CRITICAL: Error rate exceeds 20%. System may need maintenance.');
        if (recs.length === 0) recs.push('None — all systems healthy.');
        recs.forEach(function(r) { lines.push('- ' + r); });

        var reportStr = lines.join('\n');
        var reportFile = path.join(absReportDir, 'daily-' + dateStr + '.md');
        try { fs.writeFileSync(reportFile, reportStr, 'utf-8'); } catch (e) {}

        return reportStr;
        });
      });
    });
  });
}

function generateWeeklySummary() {
  var config = {};
  try { config = require('./config').CONFIG || {}; } catch (e) {}
  var reportDir = config.agent && config.agent.reportDir ? config.agent.reportDir : 'reports/data-engineering';
  var absReportDir = path.resolve(reportDir);

  var dateStr = today();
  var weekNum = weekNumber();
  var lines = [];
  lines.push('# Weekly Data Engineering Summary — W' + weekNum);
  lines.push('');

  var dailyScores = [];
  var dailyFiles = [];
  try {
    if (fs.existsSync(absReportDir)) {
      var allFiles = fs.readdirSync(absReportDir);
      var weekAgo = Date.now() - 7 * 86400000;
      allFiles.forEach(function(f) {
        if (f.indexOf('daily-') === 0 && f.indexOf('.md') > 0) {
          var fp = path.join(absReportDir, f);
          try {
            var stat = fs.statSync(fp);
            if (stat.mtimeMs >= weekAgo) {
              dailyFiles.push({ file: f, mtime: stat.mtime });
            }
          } catch (e) {}
        }
      });
    }
  } catch (e) {}

  dailyFiles.sort(function(a, b) { return a.mtime - b.mtime; });

  var totalCaptures = 0;
  var totalDataMB = 0;
  var endpointReliability = {};
  var lastWeekAvg = 0;
  var bestDay = { name: '', score: 0 };
  var worstDay = { name: '', score: Infinity };

  dailyFiles.forEach(function(df) {
    try {
      var content = fs.readFileSync(path.join(absReportDir, df.file), 'utf-8');
      var scoreMatch = content.match(/Quality Score:\s*(\d+)/);
      if (scoreMatch) {
        var score = parseInt(scoreMatch[1], 10);
        var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var dayName = dayNames[df.mtime.getDay()] || 'Unknown';
        dailyScores.push({ day: dayName, score: score, date: df.mtime.toISOString().slice(0, 10) });
        if (score > bestDay.score) { bestDay = { name: dayName, score: score }; }
        if (score < worstDay.score) { worstDay = { name: dayName, score: score }; }
      }
      var capMatch = content.match(/Captures today:\s*(\d+)/);
      if (capMatch) totalCaptures += parseInt(capMatch[1], 10);
      var dataMatch = content.match(/Data stored:\s*([\d.]+)\s*MB/);
      if (dataMatch) totalDataMB += parseFloat(dataMatch[1]);

      var epSection = content.match(/\| Endpoint.*\n\|[-| ]+\n([\s\S]*?)(?=\n##|\n$)/);
      if (epSection) {
        var epLines = epSection[1].split('\n');
        epLines.forEach(function(el) {
          el = el.trim();
          if (el.indexOf('|') === 0) {
            var parts = el.split('|').map(function(p) { return p.trim(); });
            if (parts.length >= 5) {
              var epName = parts[1];
              var epStatus = parts[2];
              var epErrors = parts[4];
              if (!endpointReliability[epName]) endpointReliability[epName] = { total: 0, errors: 0 };
              endpointReliability[epName].total++;
              if (epStatus !== '✅') endpointReliability[epName].errors++;
            }
          }
        });
      }
    } catch (e) {}
  });

  var avgScore = dailyScores.length > 0 ? Math.round(dailyScores.reduce(function(a, b) { return a + b.score; }, 0) / dailyScores.length) : 0;
  totalDataMB = Math.round(totalDataMB * 10) / 10;

  lines.push('## Trend (' + dailyFiles.length + ' days)');
  lines.push('- Avg Quality Score: ' + avgScore + ' (change data unavailable)');
  if (bestDay.name) lines.push('- Best day: ' + bestDay.name + ' (' + bestDay.score + ')');
  if (worstDay.name && worstDay.score < Infinity) lines.push('- Worst day: ' + worstDay.name + ' (' + worstDay.score + ')');
  lines.push('');

  lines.push('## Endpoint Reliability');
  var mostReliable = '', leastReliable = '';
  var highestRel = -1, lowestRel = 101;
  Object.keys(endpointReliability).forEach(function(ep) {
    var info = endpointReliability[ep];
    var pct = info.total > 0 ? ((info.total - info.errors) / info.total) * 100 : 0;
    pct = Math.round(pct * 10) / 10;
    if (pct > highestRel) { highestRel = pct; mostReliable = ep; }
    if (pct < lowestRel) { lowestRel = pct; leastReliable = ep; }
  });
  if (mostReliable) lines.push('- Most reliable: ' + mostReliable + ' (' + highestRel + '%)');
  if (leastReliable && leastReliable !== mostReliable) lines.push('- Least reliable: ' + leastReliable + ' (' + lowestRel + '%)');
  else if (leastReliable) lines.push('- Least reliable: ' + leastReliable + ' (' + lowestRel + '%)');
  lines.push('');

  lines.push('## Data Volume');
  lines.push('- Total captures: ' + totalCaptures);
  lines.push('- Total data: ' + totalDataMB + ' MB');
  lines.push('');

  lines.push('## New Sources Discovered');
  var discoveredDir = path.join(__dirname, '..', 'data-engineering');
  var hasNewSources = false;
  try {
    var discoveryFile = path.join(discoveredDir, 'discovery-state.json');
    if (fs.existsSync(discoveryFile)) {
      var discData = JSON.parse(fs.readFileSync(discoveryFile, 'utf-8'));
      if (discData.newSources && discData.newSources.length > 0) {
        hasNewSources = true;
        discData.newSources.forEach(function(s) {
          lines.push('- ' + (s.name || s.url || 'unknown'));
        });
      }
    }
  } catch (e) {}
  if (!hasNewSources) lines.push('- None this week');
  lines.push('');

  var dailyDetailLines = dailyScores.map(function(ds) { return ds.day + ': ' + ds.score + ' (' + ds.date + ')'; });
  if (dailyDetailLines.length > 0) {
    lines.push('## Daily Breakdown');
    dailyDetailLines.forEach(function(l) { lines.push('- ' + l); });
  }

  var reportStr = lines.join('\n');
  var weeklyDir = absReportDir;
  ensureDir(weeklyDir);
  var reportFile = path.join(weeklyDir, 'weekly-W' + weekNum + '.md');
  try { fs.writeFileSync(reportFile, reportStr, 'utf-8'); } catch (e) {}

  return reportStr;
}

function reportToTelos(report) {
  var telosDir = '/Users/prateekposwal/Desktop/Vrooom-computation/reports/data-engineering';
  ensureDir(telosDir);
  var dateStr = today();
  var header = '---\nGenerated: ' + new Date().toISOString() + '\nAgent: Data Engineer v1\nSource: block-space-economics/tools/data-engineering\n---\n\n';
  var fullReport = header + report;
  var reportFile = path.join(telosDir, 'daily-' + dateStr + '.md');
  try {
    fs.writeFileSync(reportFile, fullReport, 'utf-8');
    return { saved: true, path: reportFile };
  } catch (e) {
    return { saved: false, path: reportFile, error: e.message };
  }
}

function reportToArchitect(report) {
  var architectDir = path.join(__dirname, '..', '..', 'reports', 'architect');
  ensureDir(architectDir);
  var dateStr = today();

  var qualityMatch = report.match(/Quality Score:\s*(\d+)/);
  var qualityScore = qualityMatch ? qualityMatch[1] : 'N/A';

  var issuesSection = '';
  var issuesMatch = report.match(/## Issues\n([\s\S]*?)(?=\n## |\n$)/);
  if (issuesMatch) issuesSection = issuesMatch[1].trim();

  var recsSection = '';
  var recsMatch = report.match(/## Recommendations\n([\s\S]*?)(?=\n## |\n$)/);
  if (recsMatch) recsSection = recsMatch[1].trim();

  var newSources = 'None';

  var lines = [];
  lines.push('# Data Engineering Report — ' + dateStr + ' (Architect Summary)');
  lines.push('');
  lines.push('## Quality Score');
  lines.push('- Overall: ' + qualityScore + '/100');
  lines.push('');
  lines.push('## Issues');
  if (issuesSection && issuesSection !== '- None') {
    lines.push(issuesSection);
  } else {
    lines.push('- None');
  }
  lines.push('');
  lines.push('## Recommendations');
  if (recsSection && recsSection !== '- None') {
    lines.push(recsSection);
  } else {
    lines.push('- None');
  }
  lines.push('');
  lines.push('## New Sources Discovered');
  lines.push('- ' + newSources);

  var reportStr = lines.join('\n');
  var reportFile = path.join(architectDir, 'DE-' + dateStr + '.md');
  try {
    fs.writeFileSync(reportFile, reportStr, 'utf-8');
    return { saved: true, path: reportFile };
  } catch (e) {
    return { saved: false, path: reportFile, error: e.message };
  }
}

function appendSessionHandoff(opts) {
  opts = opts || {};
  var repo = path.join(__dirname, '..', '..');
  var lines = [];

  // 1. State (de-agent)
  var state = opts.state;
  if (!state) {
    try { state = JSON.parse(fs.readFileSync(path.join(repo, 'captured-data', 'de-agent-state.json'), 'utf8')); } catch (e) {}
  }
  // 2. Health
  var health = null;
  try { health = JSON.parse(fs.readFileSync(path.join(repo, 'captured-data', 'ops-health.json'), 'utf8')); } catch (e) {}
  // 4. Forecast
  var fc = null;
  try { fc = JSON.parse(fs.readFileSync(path.join(repo, 'tools', 'fee_forecast.json'), 'utf8')); } catch (e) {}

  var now = new Date().toISOString();
  var cycle = state && state.cycleCount ? state.cycleCount : '?';
  var m4 = state && state.m4 ? state.m4 : {};
  var issues = [];
  if (health && Array.isArray(health.issues)) issues = health.issues.slice(0, 3);
  if (state && Array.isArray(state.issues)) state.issues.forEach(function(i) { if (issues.indexOf(i) === -1) issues.push(i); });
  if (!issues.length) issues.push('- None');
  var quality = state && state.qualityScore !== undefined ? state.qualityScore : (health && health.status ? (health.status === 'HEALTHY' ? 'healthy' : 'degraded') : 'n/a');

  lines.push('## Session Handoff — ' + now);
  lines.push('');
  lines.push('### Current State');
  lines.push('- Session mood: neutral');
  lines.push('- Active work: cycle ' + cycle + ' · bridge=' + (m4.bridgeFlipped ? 'off' : 'on') + ' · M4 cleanCycles=' + (m4.cleanCycles || 0) + '/7');
  if (fc) lines.push('- Forecast: ' + (fc.model || '?') + ' · ' + fc.trend + ' · ' + (fc.quality ? 'rmse=' + fc.quality.rmse : '') + ' (' + (fc.data_points || 0) + ' pts)');
  lines.push('');
  lines.push('### Decisions Made');
  if (opts.m4Event && opts.m4Event.type === 'M4_COMPLETE') {
    lines.push('- **M4 COMPLETE**: bridge disabled at ' + opts.m4Event.at + ' after ' + opts.m4Event.cleanCycles + ' clean cycles');
  } else if (m4.cleanCycles) {
    lines.push('- M4 gate: cleanCycles=' + m4.cleanCycles + '/7 (no flip' + (m4.bridgeFlipped ? ' — already flipped' : '') + ')');
  } else {
    lines.push('- *(No decisions recorded)*');
  }
  lines.push('');
  lines.push('### Open Issues');
  issues.forEach(function(i) { lines.push('- ' + i); });
  lines.push('');
  lines.push('### Metrics');
  lines.push('- Quality: ' + quality);
  if (fc) lines.push('- Forecast: ' + fc.model + ' · ' + fc.trend + ' · regime=' + (fc.regime ? fc.regime.current : '?') + ' (' + (fc.data_points || 0) + ' pts)');
  lines.push('- M4: ' + (m4.cleanCycles || 0) + '/7 clean cycles · bridgeFlipped=' + (m4.bridgeFlipped || false));
  lines.push('');

  var block = lines.join('\n');

  // Append to AGENTS.md (repo root)
  var agentsPath = path.join(repo, 'AGENTS.md');
  var wrote = { agents: false, decisionLog: false };
  try {
    fs.appendFileSync(agentsPath, block);
    wrote.agents = true;
  } catch (e) {}

  // Append to captured-data/decision-log.json (BSAHI-side structured trace)
  try {
    var dlPath = path.join(repo, 'captured-data', 'decision-log.json');
    var dl = { version: '1.0', traces: [] };
    try { dl = JSON.parse(fs.readFileSync(dlPath, 'utf8')); } catch (e) {}
    dl.traces.push({
      ts: now,
      cycle: cycle,
      source: 'de-agent',
      decisions: (opts.m4Event && opts.m4Event.type === 'M4_COMPLETE') ? ['M4 COMPLETE: bridge disabled'] : ['M4 gate: cleanCycles=' + (m4.cleanCycles || 0) + '/7'],
      issues: issues,
      metrics: {
        quality: quality,
        m4CleanCycles: m4.cleanCycles || 0,
        bridgeFlipped: m4.bridgeFlipped || false,
        forecastModel: fc ? fc.model : null
      }
    });
    dl.traces = dl.traces.slice(-200);
    fs.writeFileSync(dlPath, JSON.stringify(dl, null, 2));
    wrote.decisionLog = true;
  } catch (e) {}

  return { saved: wrote.agents || wrote.decisionLog, appended: true, path: agentsPath, wrote: wrote };
}

module.exports = { generateDailyReport: generateDailyReport, generateWeeklySummary: generateWeeklySummary, reportToTelos: reportToTelos, reportToArchitect: reportToArchitect, appendSessionHandoff: appendSessionHandoff };
