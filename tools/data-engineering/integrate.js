var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');

var { CONFIG } = require('./config.js');

var ROOT = path.resolve(__dirname, '..', '..');
var CONFIG_PATH = path.join(__dirname, 'config.js');
var STAGING_DIR = path.join(ROOT, CONFIG.integration.stagingDir);

function log(action, detail) {
  var ts = new Date().toISOString();
  var msg = '[' + ts + '] [INTEGRATE] ' + action + (detail ? ' | ' + JSON.stringify(detail) : '');
  console.log(msg);
  return msg;
}

function fetch(url, timeout) {
  return new Promise(function (resolve) {
    timeout = timeout || 15000;
    try {
      var u = new URL(url);
      var mod = u.protocol === 'https:' ? https : http;
      var opts = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        timeout: timeout,
        headers: { 'User-Agent': 'BitcoinSahiDataEngine/1.0' },
      };
      var start = Date.now();
      var req = mod.request(opts, function (res) {
        var body = '';
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
          var parsed = null;
          try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            latency: Date.now() - start,
            body: body,
            data: parsed,
            contentType: res.headers['content-type'] || '',
          });
        });
      });
      req.on('error', function (e) {
        resolve({ ok: false, status: 0, latency: Date.now() - start, error: e.message, data: null, body: '' });
      });
      req.on('timeout', function () {
        req.destroy();
        resolve({ ok: false, status: 0, latency: Date.now() - start, error: 'timeout', data: null, body: '' });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, latency: 0, error: e.message, data: null, body: '' });
    }
  });
}

function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (e) {
    return false;
  }
}

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    var raw = fs.readFileSync(filePath, 'utf-8');
    var match = raw.match(/var CONFIG\s*=\s*(\{[\s\S]*?\});/);
    if (match) {
      return eval('(' + match[1] + ')');
    }
    return null;
  } catch (e) {
    return null;
  }
}

function writeJSON(filePath, obj) {
  try {
    var content = fs.readFileSync(filePath, 'utf-8');
    var serialized = JSON.stringify(obj, null, 2);
    var updated = content.replace(
      /var CONFIG\s*=\s*\{[\s\S]*?\};/,
      'var CONFIG = ' + serialized + ';'
    );
    fs.writeFileSync(filePath, updated, 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

function addEndpoint(endpoint) {
  try {
    if (!endpoint || !endpoint.key || !endpoint.url) {
      log('addEndpoint FAILED', { error: 'endpoint must have key and url', endpoint: endpoint });
      return { added: false, key: endpoint && endpoint.key, error: 'endpoint must have key and url' };
    }

    var ep = {
      key: endpoint.key,
      url: endpoint.url,
      method: endpoint.method || 'GET',
      category: endpoint.category || 'custom',
      priority: endpoint.priority || 3,
      maxLatency: endpoint.maxLatency || 5000,
    };

    var existing = CONFIG.endpoints.find(function (e) { return e.key === ep.key; });
    if (existing) {
      log('addEndpoint FAILED', { error: 'key already exists', key: ep.key });
      return { added: false, key: ep.key, error: 'key "' + ep.key + '" already exists in CONFIG.endpoints' };
    }

    CONFIG.endpoints.push(ep);
    var saved = writeJSON(CONFIG_PATH, CONFIG);
    if (!saved) {
      log('addEndpoint WARN', { error: 'could not save config file, config updated in memory only' });
    }

    var dataDir = path.join(ROOT, 'captured-data', ep.key);
    ensureDir(dataDir);

    log('addEndpoint OK', { key: ep.key, url: ep.url, category: ep.category });
    return { added: true, key: ep.key, error: null };
  } catch (e) {
    log('addEndpoint ERROR', { error: e.message });
    return { added: false, key: endpoint && endpoint.key, error: e.message };
  }
}

function testEndpoint(endpoint) {
  try {
    var url = endpoint.url || endpoint;
    var numTests = 3;
    var results = [];
    var tasks = [];
    for (var i = 0; i < numTests; i++) {
      tasks.push(fetch(url, 15000));
    }
    return Promise.all(tasks).then(function (responses) {
      var okCount = 0;
      var totalLatency = 0;
      var sampleData = null;
      var bodySize = 0;
      for (var j = 0; j < responses.length; j++) {
        var r = responses[j];
        if (r.ok) okCount++;
        totalLatency += r.latency;
        if (r.data && typeof r.data === 'object' && !sampleData) {
          sampleData = r.data;
        }
        if (r.body && r.body.length > bodySize) {
          bodySize = r.body.length;
        }
      }
      var avgLatency = responses.length > 0 ? Math.round(totalLatency / responses.length) : 0;
      var stable = okCount === responses.length;
      var shapeKeys = [];
      var sample = null;
      if (sampleData && typeof sampleData === 'object') {
        shapeKeys = Object.keys(sampleData);
        sample = sampleData;
        if (Array.isArray(sampleData)) {
          shapeKeys = ['array'];
          sample = { length: sampleData.length, firstItem: sampleData[0] || null };
        }
      }
      var recommendation = 'ready';
      if (okCount === 0) recommendation = 'empty';
      else if (avgLatency > 5000) recommendation = 'too_slow';
      else if (!stable) recommendation = 'unstable';
      var result = {
        ok: okCount > 0,
        status: responses[0] ? responses[0].status : 0,
        latency: avgLatency,
        dataShape: { keys: shapeKeys, sample: sample },
        estimatedSize: bodySize,
        stable: stable,
        recommendation: recommendation,
        testsRun: responses.length,
        testsPassed: okCount,
      };
      log('testEndpoint', { key: endpoint.key || url, ok: result.ok, latency: avgLatency, recommendation: recommendation });
      return result;
    });
  } catch (e) {
    log('testEndpoint ERROR', { error: e.message });
    return Promise.resolve({ ok: false, status: 0, latency: 0, dataShape: { keys: [], sample: null }, estimatedSize: 0, stable: false, recommendation: 'empty', testsRun: 0, testsPassed: 0 });
  }
}

function stageEndpoint(endpoint) {
  try {
    if (!endpoint || !endpoint.key || !endpoint.url) {
      log('stageEndpoint FAILED', { error: 'endpoint must have key and url' });
      return null;
    }
    ensureDir(STAGING_DIR);
    var staged = {
      endpoint: {
        key: endpoint.key,
        url: endpoint.url,
        method: endpoint.method || 'GET',
        category: endpoint.category || 'custom',
        priority: endpoint.priority || 3,
        maxLatency: endpoint.maxLatency || 5000,
      },
      metadata: {
        stagedAt: new Date().toISOString(),
        stagedBy: 'integrate.js',
        status: 'staged',
      },
    };
    var filePath = path.join(STAGING_DIR, endpoint.key + '.json');
    fs.writeFileSync(filePath, JSON.stringify(staged, null, 2), 'utf-8');
    log('stageEndpoint OK', { key: endpoint.key, path: filePath });
    return filePath;
  } catch (e) {
    log('stageEndpoint ERROR', { error: e.message });
    return null;
  }
}

function deployEndpoint(key) {
  try {
    if (!key) {
      log('deployEndpoint FAILED', { error: 'key is required' });
      return { deployed: false, key: key, timestamp: new Date().toISOString(), report: { error: 'key is required' } };
    }
    var stagingFile = path.join(STAGING_DIR, key + '.json');
    if (!fs.existsSync(stagingFile)) {
      log('deployEndpoint FAILED', { error: 'no staging file found for key', key: key });
      return { deployed: false, key: key, timestamp: new Date().toISOString(), report: { error: 'no staging file found for key "' + key + '"' } };
    }
    var stagedData = JSON.parse(fs.readFileSync(stagingFile, 'utf-8'));
    var ep = stagedData.endpoint;
    var addResult = addEndpoint(ep);
    if (!addResult.added) {
      log('deployEndpoint FAILED', { error: addResult.error, key: key });
      return { deployed: false, key: key, timestamp: new Date().toISOString(), report: { error: addResult.error } };
    }
    return testEndpoint(ep).then(function (testResult) {
      fs.writeFileSync(stagingFile, JSON.stringify({
        endpoint: ep,
        metadata: { stagedAt: stagedData.metadata.stagedAt, stagedBy: stagedData.metadata.stagedBy, deployedAt: new Date().toISOString(), status: 'deployed' },
        deployTest: testResult,
      }, null, 2), 'utf-8');
      var report = {
        endpoint: ep,
        addResult: addResult,
        testResult: testResult,
        codeSnippet: generateEndpointCode(ep),
      };
      log('deployEndpoint OK', { key: key, status: testResult.status, recommendation: testResult.recommendation });
      return { deployed: true, key: key, timestamp: new Date().toISOString(), report: report };
    });
  } catch (e) {
    log('deployEndpoint ERROR', { error: e.message });
    return Promise.resolve({ deployed: false, key: key, timestamp: new Date().toISOString(), report: { error: e.message } });
  }
}

function generateEndpointCode(endpoint) {
  try {
    var key = endpoint.key;
    var url = endpoint.url;
    var lines = [];
    lines.push('// 1. Add to ENDPOINTS array');
    lines.push("{ key: '" + key + "', url: '" + url + "' },");
    lines.push('');
    lines.push('// 2. Add normalize() case');
    lines.push("case '" + key + "':");
    lines.push("  DATA." + key + " = raw;");
    lines.push('  break;');
    lines.push('');
    lines.push('// 3. Add minimizeEntry() case');
    lines.push("case '" + key + "':");
    lines.push("  m.d = raw;");
    lines.push('  break;');
    return lines.join('\n');
  } catch (e) {
    log('generateEndpointCode ERROR', { error: e.message });
    return '';
  }
}

function getAllStaged() {
  try {
    if (!fs.existsSync(STAGING_DIR)) {
      return [];
    }
    var files = fs.readdirSync(STAGING_DIR).filter(function (f) { return f.endsWith('.json'); });
    var staged = [];
    for (var i = 0; i < files.length; i++) {
      try {
        var content = JSON.parse(fs.readFileSync(path.join(STAGING_DIR, files[i]), 'utf-8'));
        staged.push(content);
      } catch (e) {
        log('getAllStaged WARN', { error: 'could not parse ' + files[i], message: e.message });
      }
    }
    return staged;
  } catch (e) {
    log('getAllStaged ERROR', { error: e.message });
    return [];
  }
}

module.exports = { addEndpoint, testEndpoint, stageEndpoint, deployEndpoint, generateEndpointCode, getAllStaged };
