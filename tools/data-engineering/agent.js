var fs = require('fs');
var path = require('path');
var { CONFIG } = require('./config.js');
var discover = require('./discover.js');
var integrate = require('./integrate.js');
var monitor = require('./monitor.js');
var report = require('./report.js');
var tracker = require('../../tools/agents/03-block-interval-tracker.js');
var btcRpc = require('../../tools/agents/06-bitcoin-core-rpc.js');
var digest = require('../../tools/agents/12-research-digest.js');
var publisher = require('../../tools/marketing/publisher.js');

var STATE = { lastRun: null, cycleCount: 0, discoveredSources: [], issues: [] };
var STATE_FILE = path.resolve(__dirname, '..', '..', CONFIG.agent.stateFile);

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) STATE = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) { STATE = { lastRun: null, cycleCount: 0, discoveredSources: [], issues: [] }; }
}

function saveState() {
  try {
    ensureDir(path.dirname(STATE_FILE));
    fs.writeFileSync(STATE_FILE, JSON.stringify(STATE, null, 2));
  } catch (e) { console.error('DE Agent: Failed to save state', e.message); }
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function log(msg) {
  var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[DE Agent ' + ts + '] ' + msg);
}

async function runCycle() {
  var start = Date.now();
  STATE.cycleCount++;
  log('Cycle ' + STATE.cycleCount + ' started');

  // Step 1: Check all current endpoints
  log('Checking ' + CONFIG.endpoints.length + ' endpoints...');
  var health = await monitor.checkAllEndpoints(CONFIG.endpoints);
  var healthyCount = health.healthy || 0;
  var unhealthyCount = health.unhealthy || 0;
  log('Endpoints: ' + healthyCount + '/' + CONFIG.endpoints.length + ' healthy' + (unhealthyCount > 0 ? ', ' + unhealthyCount + ' unhealthy' : ''));

  // Step 2: Check data freshness
  var freshness = monitor.getFreshnessReport ? await monitor.getFreshnessReport('captured-data') : { sources: {} };
  log('Freshness checked');

  // Step 2b: M3 dual-write — envelope bridge + fate-shared capture agent (one shared spool)
  try {
    var spoolMod = require('./spool.js');
    var spool = await spoolMod.init();
    if (CONFIG.capture.bridge) {
      var spoolBridge = require('./spool-bridge.js');
      var ingestResult = await spoolBridge.ingestOnce(spool);
      log('Spool: scanned=' + ingestResult.scanned + ' new=' + ingestResult.newFiles +
          ' ingested=' + ingestResult.ingested + ' validated=' + ingestResult.validated +
          ' violated=' + ingestResult.violated + ' failed=' + ingestResult.failed.length);
    }
    if (CONFIG.capture.mirror) {
      var capAgent = require('./capture-agent.js').createCaptureAgent(
        { spool: spool, endpoints: CONFIG.endpoints, config: CONFIG.capture });
      var capResult = await capAgent.runCycle();
      log('Capture-agent: cycle=' + capResult.cycleTs + ' captured=' + capResult.captured +
          ' skipped=' + capResult.skipped + ' violated=' + capResult.violated + ' errored=' + capResult.errored);
    }
  } catch (e) { log('Step 2b error: ' + e.message); }

  // Step 3: Check Bitcoin Core node (if running)
  try {
    var btcResult = await btcRpc.run();
    if (btcResult.ok) {
      var bp = btcResult.blockchain;
      log('Bitcoin Core: ' + bp.blocks + ' blocks, ' + btcResult.blocks.length + ' fee stats, ' + btcResult.peerCount + ' peers');
      if (btcResult.blocks.length > 0) {
        var latest = btcResult.blocks[0];
        if (latest.feePercentiles && latest.feePercentiles.length === 5) {
          log('  Fee percentiles (p10/p25/p50/p75/p90): ' + latest.feePercentiles.map(function(v) { return (v / 1000).toFixed(1); }).join('/') + ' sat/vB');
        }
      }
    }
  } catch (e) { log('Bitcoin Core: offline (' + e.message + ')'); }

  // Step 4: Run block interval tracker
  try {
    var blockMetrics = tracker.track ? await tracker.track() : null;
    if (blockMetrics) {
      log('Block intervals: ' + (blockMetrics.blocks ? blockMetrics.blocks.avgInterval + 's avg' : 'N/A'));
    }
  } catch (e) { log('Tracker error: ' + e.message); }

  // Step 4: Get quality score
  var quality = monitor.getDataQualityScore ? monitor.getDataQualityScore() : { score: 0 };
  log('Data quality score: ' + (quality.score || 'N/A') + '/100');

  // Step 4: Every 24 hours, run discovery
  var doDiscovery = STATE.cycleCount === 1 || (STATE.lastRun && (Date.now() - STATE.lastRun) > CONFIG.discovery.searchIntervalHours * 3600000);
  if (doDiscovery && CONFIG.discovery.enabled) {
    log('Running API discovery...');
    try {
      var newSources = await discover.searchForNewSources();
      if (newSources && newSources.length > 0) {
        var unknown = discover.findNewEndpoints(CONFIG.endpoints);
        if (unknown && unknown.length > 0) {
          log('Found ' + unknown.length + ' new potential sources');
          STATE.discoveredSources = unknown;
          for (var i = 0; i < unknown.length && i < CONFIG.discovery.maxNewSources; i++) {
            var src = unknown[i];
            var endpoint = { key: src.key || src.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''), url: src.url, name: src.name, type: src.type, category: src.category || 'discovered' };
            log('  Testing: ' + endpoint.name + ' (' + endpoint.url + ')');
            var testResult = await integrate.testEndpoint(endpoint);
            if (testResult.ok) {
              var staged = integrate.stageEndpoint(endpoint);
              log('  Staged for review: ' + (staged || endpoint.key));
            }
          }
        } else {
          log('No new sources found');
        }
      }
    } catch (e) { log('Discovery error: ' + e.message); }
  }

  // Step 5: Check for issues
  STATE.issues = [];
  if (unhealthyCount > 0) STATE.issues.push(unhealthyCount + ' endpoints unhealthy');
  if (quality.score < 60) STATE.issues.push('Data quality score below 60 (' + quality.score + ')');
  if (freshness && freshness.sources) {
    var staleCount = 0;
    for (var k in freshness.sources) {
      if (freshness.sources[k] && freshness.sources[k].ageMinutes > CONFIG.monitoring.freshnessMaxAgeMinutes) staleCount++;
    }
    if (staleCount > 0) STATE.issues.push(staleCount + ' sources stale (>' + CONFIG.monitoring.freshnessMaxAgeMinutes + 'min old)');
  }

  // Step 6: Generate reports
  if (STATE.cycleCount % 4 === 0 || STATE.issues.length > 0) {
    log('Generating reports...');
    try {
      var dailyReport = await report.generateDailyReport();
      if (dailyReport) {
        await report.reportToTelos(dailyReport);
        await report.reportToArchitect(dailyReport);
        log('Reports saved');
      }
      // Generate research digest every 4 cycles (daily at 60min cycle)
      if (STATE.cycleCount % 4 === 0) {
        try {
          log('Generating research digest...');
          digest.generateLinkedInPost();
          digest.generateTweetThread();
          digest.generateRedditPost();
          log('Digest saved to reports/digest/');
        } catch (e) { log('Digest error: ' + e.message); }
      }
    } catch (e) { log('Report error: ' + e.message); }
  }

  // Step 7: Run Nostr publisher (every cycle = hourly)
  try {
    var pubStart = Date.now();
    var pubResult = await publisher.runFullCycle();
    var pubElapsed = Math.round((Date.now() - pubStart) / 1000);
    log('Publisher: ' + pubResult.length + ' posts in ' + pubElapsed + 's');
    publisher.generateRSSFeed();
    publisher.generateReport();
  } catch (e) { log('Publisher error: ' + e.message); }

  STATE.lastRun = Date.now();
  saveState();
  var elapsed = Math.round((Date.now() - start) / 1000);
  log('Cycle ' + STATE.cycleCount + ' complete in ' + elapsed + 's');

  if (STATE.issues.length > 0) {
    log('ISSUES: ' + STATE.issues.join(' | '));
  }
}

function start() {
  log('Starting — ' + CONFIG.agent.name);
  log('Cycle interval: ' + CONFIG.agent.cycleMinutes + ' minutes');
  log('Endpoints: ' + CONFIG.endpoints.length);
  ensureDir(path.resolve(__dirname, '..', '..', 'reports', 'data-engineering'));
  ensureDir(path.resolve(__dirname, '..', '..', 'reports', 'architect'));
  ensureDir(path.dirname(STATE_FILE));
  loadState();

  runCycle().catch(function(e) { log('Cycle error: ' + e.message); });
  setInterval(function() {
    runCycle().catch(function(e) { log('Cycle error: ' + e.message); });
  }, CONFIG.agent.cycleMinutes * 60 * 1000);
}

if (require.main === module) {
  start();
}

module.exports = { start: start, runCycle: runCycle, getState: function() { return STATE; } };
