var fs = require('fs');
var path = require('path');
var DB_PATH = path.resolve(__dirname, '..', '..', 'captured-data', 'bsahi.db');

function getDB() {
  var db = null;
  try {
    var initSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    var child = require('child_process');
    var tmpFile = '/tmp/bsahi-db-init.sql';
    fs.writeFileSync(tmpFile, initSql);
    child.execSync('sqlite3 "' + DB_PATH + '" < "' + tmpFile + '"', { stdio: 'pipe' });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
    db = { path: DB_PATH };
  } catch (e) {
    console.error('DB init error:', e.message);
    return null;
  }
  return db;
}

function runSQL(sql, params) {
  try {
    params = params || [];
    var tmpFile = '/tmp/bsahi-query-' + Date.now() + '.sql';
    var escaped = sql.replace(/'/g, "''");
    // For simple SELECT queries, output JSON
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      var fullSql = '.mode json\n' + sql + ';';
      fs.writeFileSync(tmpFile, fullSql);
      var result = require('child_process').execSync('sqlite3 "' + DB_PATH + '" < "' + tmpFile + '"', { stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      try { fs.unlinkSync(tmpFile); } catch (e) {}
      try { return JSON.parse(result); } catch (e) { return result.trim(); }
    } else {
      fs.writeFileSync(tmpFile, sql + ';');
      require('child_process').execSync('sqlite3 "' + DB_PATH + '" < "' + tmpFile + '"', { stdio: 'pipe' });
      try { fs.unlinkSync(tmpFile); } catch (e) {}
      return true;
    }
  } catch (e) {
    console.error('SQL error:', e.message);
    return null;
  }
}

function insertCapture(source, endpointUrl, status, latencyMs, jsonData, minimizedData, filePath, cycleId) {
  var escaped = function(v) { return "'" + String(v).replace(/'/g, "''") + "'"; };
  var sql = 'INSERT INTO captures (captured_at, source, endpoint_url, status, latency_ms, json_data, minimized_data, file_path, cycle_id) VALUES (' +
    escaped(new Date().toISOString()) + ', ' +
    escaped(source) + ', ' +
    escaped(endpointUrl || '') + ', ' +
    (status || 0) + ', ' +
    (latencyMs || 0) + ', ' +
    escaped(jsonData || '') + ', ' +
    escaped(minimizedData || '') + ', ' +
    escaped(filePath || '') + ', ' +
    (cycleId || 0) + ')';
  return runSQL(sql);
}

function insertBlockStats(height, hash, timestamp, txCount, size, weight, avgFeeSats, avgFeeRate, feePercentiles, subsidyBtc, miner) {
  var sql = 'INSERT OR REPLACE INTO block_stats (height, hash, timestamp, tx_count, size, weight, avg_fee_sats, avg_fee_rate_satvb, fee_percentiles, subsidy_btc, miner) VALUES (' +
    height + ', ' +
    "'" + (hash || '') + "', " +
    "'" + (timestamp || '') + "', " +
    (txCount || 0) + ', ' +
    (size || 0) + ', ' +
    (weight || 0) + ', ' +
    (avgFeeSats || 0) + ', ' +
    (avgFeeRate || 0) + ", '" +
    JSON.stringify(feePercentiles || []) + "', " +
    (subsidyBtc || 0) + ", '" +
    (miner || '') + "')";
  return runSQL(sql);
}

function query(sql) {
  return runSQL(sql);
}

function migrateExistingFiles() {
  var dataDir = path.resolve(__dirname, '..', '..', 'captured-data');
  var migrated = 0, errors = 0;

  function walkDir(dir) {
    try {
      var entries = fs.readdirSync(dir);
      for (var i = 0; i < entries.length; i++) {
        var fullPath = path.join(dir, entries[i]);
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !fullPath.includes('staging') && !fullPath.includes('node_modules')) {
          walkDir(fullPath);
        } else if (fullPath.endsWith('.json') && !fullPath.includes('staging') && !fullPath.includes('state') && !fullPath.includes('.gitkeep')) {
          try {
            var content = fs.readFileSync(fullPath, 'utf8');
            var data = JSON.parse(content);
            var source = 'unknown';
            if (data.endpoints) source = 'capture_cycle';
            else if (data.key) source = data.key;
            else if (data.captureTime) source = 'backfill';

            // Determine source from filename or content
            var relPath = path.relative(dataDir, fullPath);
            if (relPath.includes('backfill')) source = 'backfill';
            else if (relPath.includes('btc-rpc')) source = 'btc_rpc';
            else if (relPath.includes('tracker')) source = 'tracker';
            else if (relPath.includes('enhanced')) source = 'enhanced';
            else if (relPath.includes('consolidated')) source = 'consolidated';

            var capturedAt = data.captureTime || data.timestamp || data.fetchedAt || new Date(stat.mtime).toISOString();

            if (source === 'capture_cycle' && data.endpoints) {
              var cycleId = data.cycle || 0;
              for (var key in data.endpoints) {
                var ep = data.endpoints[key];
                insertCapture(key, key, ep.status || 200, 0, JSON.stringify(ep.data || ep), '', relPath, cycleId);
                migrated++;
              }
            } else {
              insertCapture(source, source, 200, 0, JSON.stringify(data), '', relPath, 0);
              migrated++;
            }
          } catch (e) {
            errors++;
          }
        }
      }
    } catch (e) {}
  }

  console.log('Migrating existing capture files to SQLite...');
  walkDir(dataDir);
  console.log('Done: ' + migrated + ' entries migrated, ' + errors + ' errors');
  return { migrated: migrated, errors: errors };
}

function getStats() {
  var count = query("SELECT COUNT(*) as c FROM captures");
  var sources = query("SELECT source, COUNT(*) as c FROM captures GROUP BY source ORDER BY c DESC");
  var timeRange = query("SELECT MIN(captured_at) as first, MAX(captured_at) as last FROM captures");
  var dbSize = 0;
  try { dbSize = fs.statSync(DB_PATH).size; } catch (e) {}
  return { entries: count, bySource: sources, timeRange: timeRange, dbSize: dbSize, dbPath: DB_PATH };
}

if (require.main === module) {
  var args = process.argv.slice(2);
  if (args.includes('--init')) {
    var db = getDB();
    if (db) { console.log('SQLite database initialized at:', db.path); }
  }
  if (args.includes('--migrate')) {
    getDB();
    migrateExistingFiles();
  }
  if (args.includes('--stats')) {
    getDB();
    console.log(JSON.stringify(getStats(), null, 2));
  }
  if (args.length === 0) {
    getDB();
    var m = migrateExistingFiles();
    console.log('Stats:', JSON.stringify(getStats(), null, 2));
  }
}

module.exports = { getDB: getDB, runSQL: runSQL, insertCapture: insertCapture, insertBlockStats: insertBlockStats, query: query, migrateExistingFiles: migrateExistingFiles, getStats: getStats };
