var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');
var spoolMod = require('./spool.js');
var bridge = require('./spool-bridge.js');
var vc = require('./validate-capture.js');

var TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-test-'));
var tests = [];
var passed = 0;

function test(name, fn) { tests.push({ name: name, fn: fn }); }

function makeEnv(cycleTs) {
  return {
    root: path.join(TMP, 'root-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
    ingestedLog: path.join(TMP, 'ing-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.log'),
    violationsLog: path.join(TMP, 'viol-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.log')
  };
}

function writeMirror(o, cycleTs, endpoints) {
  fs.mkdirSync(o.root, { recursive: true });
  fs.writeFileSync(path.join(o.root, cycleTs + '.json'), JSON.stringify({ captureTime: '2026-07-31T12:00:00.000Z', endpoints: endpoints }));
}

test('B1 envelope adoption — valid file wrapped and validated', function() {
  var o = makeEnv('2026-07-31_12-00-00');
  writeMirror(o, '2026-07-31_12-00-00', {
    fees: { status: 200, data: { fastestFee: 1, halfHourFee: 1, hourFee: 1, economyFee: 1, minimumFee: 1 }, fetchedAt: '2026-07-31T12:00:00.000Z' },
    block_height: { status: 200, data: 960410, fetchedAt: '2026-07-31T12:00:00.000Z' }
  });
  var spoolDir = path.join(TMP, 'sp-' + Date.now());
  return spoolMod.init({ dir: spoolDir, fsync: false }).then(function(spool) {
    return bridge.ingestOnce(spool, o);
  }).then(function(r) {
    assert.strictEqual(r.ingested, 1);
    assert.strictEqual(r.validated, 2, 'both sources validated');
    assert.strictEqual(r.violated, 0);
    return spoolMod.init({ dir: spoolDir, fsync: false });
  }).then(function(spool2) {
    return spool2.resolve('fees', '2026-07-31');
  }).then(function(entries) {
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].payload.env.magic, 'BSAHI-CAPTURE');
    assert.strictEqual(entries[0].payload.env.provenance.validatedBy, 'capture.fees@1.0');
    assert.strictEqual(entries[0].payload.data.fastestFee, 1);
  });
});

test('B2 violation path — bad fees quarantined, cursor degraded', function() {
  var o = makeEnv('2026-07-31_13-00-00');
  writeMirror(o, '2026-07-31_13-00-00', {
    fees: { status: 200, data: { fastestFee: 'BAD' }, fetchedAt: '2026-07-31T13:00:00.000Z' }
  });
  return spoolMod.init({ dir: path.join(TMP, 'spv-' + Date.now()), fsync: false }).then(function(spool) {
    return bridge.ingestOnce(spool, o);
  }).then(function(r) {
    assert.strictEqual(r.violated, 1, 'violation counted');
    assert.strictEqual(r.quarantined, 1);
    assert.strictEqual(r.validated, 0);
    return spoolMod.init({ dir: path.dirname(o.ingestedLog) + '/qv', fsync: false }).then(function() { return r; });
  }).then(function() {
    assert.ok(fs.existsSync(o.violationsLog), 'violations log exists');
    var log = fs.readFileSync(o.violationsLog, 'utf8');
    assert.ok(log.indexOf('schemaViolation') !== -1 || log.indexOf('fastestFee') !== -1, 'violation logged');
    assert.ok(fs.existsSync(o.ingestedLog), 'file marked ingested');
    var ingested = fs.readFileSync(o.ingestedLog, 'utf8');
    assert.ok(ingested.indexOf('2026-07-31_13-00-00') !== -1, 'file marked ingested even when violated');
  });
});

test('B3 shape robustness — error/null/scalar/backfill shapes do not crash or quarantine', function() {
  var o = makeEnv('2026-07-31_14-00-00');
  writeMirror(o, '2026-07-31_14-00-00', {
    fees: { status: 0, error: 'timeout', fetchedAt: '2026-07-31T14:00:00.000Z' },
    block_height: { status: 200, data: 960411, fetchedAt: '2026-07-31T14:00:00.000Z' },
    lightning: { ok: false, error: 'timeout' },
    mempool: { ok: true, data: { count: 1, vsize: 2, total_fee: 3, fee_histogram: [] }, status: 200 },
    difficulty: { status: 200, data: null, fetchedAt: '2026-07-31T14:00:00.000Z' }
  });
  return spoolMod.init({ dir: path.join(TMP, 'spb-' + Date.now()), fsync: false }).then(function(spool) {
    return bridge.ingestOnce(spool, o);
  }).then(function(r) {
    assert.strictEqual(r.violated, 0, 'no false violations: ' + JSON.stringify(r));
    assert.strictEqual(r.failed.length, 0, 'no failures');
    assert.strictEqual(r.ingested, 1);
  });
});

test('B4 duplicate ingestion is idempotent', function() {
  var o = makeEnv('2026-07-31_15-00-00');
  writeMirror(o, '2026-07-31_15-00-00', {
    fees: { status: 200, data: { fastestFee: 1, halfHourFee: 1, hourFee: 1, economyFee: 1, minimumFee: 1 }, fetchedAt: '2026-07-31T15:00:00.000Z' }
  });
  var spoolDir = path.join(TMP, 'spid-' + Date.now());
  return spoolMod.init({ dir: spoolDir, fsync: false }).then(function(spool) {
    return bridge.ingestOnce(spool, o);
  }).then(function(r) {
    assert.strictEqual(r.ingested, 1);
    return spoolMod.init({ dir: spoolDir, fsync: false });
  }).then(function(spool) {
    return bridge.ingestOnce(spool, o);
  }).then(function(r2) {
    assert.strictEqual(r2.ingested, 0, 'second run skips already-ingested file');
  });
});

function run() {
  var idx = 0;
  function next() {
    if (idx >= tests.length) {
      console.log('\n' + passed + '/' + tests.length + ' tests passed');
      fs.rmSync(TMP, { recursive: true, force: true });
      process.exit(passed === tests.length ? 0 : 1);
      return;
    }
    var t = tests[idx++];
    Promise.resolve(t.fn()).then(function() { passed++; console.log('ok - ' + t.name); next(); })
      .catch(function(e) { console.log('FAIL - ' + t.name + ': ' + e.message); next(); });
  }
  next();
}

run();
