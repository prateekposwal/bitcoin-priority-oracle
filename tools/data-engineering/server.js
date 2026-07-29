var http = require('http');
var path = require('path');
var { CONFIG } = require('./config.js');
var monitor = require('./monitor.js');
var report = require('./report.js');
var agent = require('./agent.js');
var researchRunner = require('../../tools/research/runner.js');

var PORT = process.env.PORT || 3456;
var agentRunning = false;

function jsonResponse(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data, null, 2));
}

var server = http.createServer(function(req, res) {
  var u = new URL(req.url, 'http://localhost');
  var route = u.pathname;

  if (route === '/health') {
    jsonResponse(res, { status: 'ok', agent: agentRunning ? 'running' : 'stopped', uptime: process.uptime() });

  } else if (route === '/status') {
    var agentState = agent.getState ? agent.getState() : {};
    jsonResponse(res, {
      agent: CONFIG.agent.name,
      cycles: agentState.cycleCount || 0,
      lastRun: agentState.lastRun,
      issues: agentState.issues || [],
      endpoints: CONFIG.endpoints.length,
      discoveredSources: (agentState.discoveredSources || []).length,
    });

  } else if (route === '/endpoints') {
    jsonResponse(res, { endpoints: CONFIG.endpoints });

  } else if (route === '/check') {
    monitor.checkAllEndpoints(CONFIG.endpoints).then(function(result) {
      jsonResponse(res, result);
    }).catch(function(e) {
      jsonResponse(res, { error: e.message }, 500);
    });

  } else if (route === '/report') {
    report.generateDailyReport().then(function(r) {
      jsonResponse(res, { report: r });
    }).catch(function(e) {
      jsonResponse(res, { error: e.message }, 500);
    });

  } else if (route === '/quality') {
    var q = monitor.getDataQualityScore ? monitor.getDataQualityScore() : { score: 0 };
    jsonResponse(res, q);

  } else if (route === '/start') {
    if (!agentRunning) {
      agent.start();
      agentRunning = true;
    }
    jsonResponse(res, { status: 'started' });

  } else if (route === '/research') {
    var rs = researchRunner.getState ? researchRunner.getState() : {};
    jsonResponse(res, { cycles: rs.cycleCount || 0, lastRun: rs.lastRun, agents: 5, report: 'reports/research/' + (rs.lastRun ? new Date(rs.lastRun).toISOString().slice(0, 10) + '.md' : 'none') });

  } else if (route === '/research/run') {
    researchRunner.runCycle().then(function(results) {
      jsonResponse(res, { ok: true, agents: results.length, findings: results.reduce(function(s, r) { return s + r.findings.length; }, 0) });
    }).catch(function(e) {
      jsonResponse(res, { error: e.message }, 500);
    });

  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><html><head><title>Bitcoin Sahi — Data Engineer</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#1A1612;color:#E8E5E0;font-family:-apple-system,sans-serif;padding:40px;max-width:800px;margin:0 auto;}h1{color:#F7931A;}a{color:#F7931A;}pre{background:#2A2622;padding:16px;border-radius:8px;overflow-x:auto;}</style></head><body><h1>⬡ Data Engineer</h1><p>Bitcoin Sahi data engineering agent. Running on port ' + PORT + '.</p><ul><li><a href="/health">/health</a></li><li><a href="/status">/status</a></li><li><a href="/endpoints">/endpoints</a></li><li><a href="/check">/check</a></li><li><a href="/quality">/quality</a></li><li><a href="/report">/report</a></li><li><a href="/research">/research</a></li><li><a href="/research/run">/research/run</a></li></ul></body></html>');
  }
});

server.listen(PORT, function() {
  console.log('DE Server running on http://localhost:' + PORT);
});

module.exports = server;
