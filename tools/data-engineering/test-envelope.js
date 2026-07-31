var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');
var registry = require('./schemas/registry.js');
var vc = require('./validate-capture.js');
var env = require('./envelope.js');
var spoolMod = require('./spool.js');

var tests = [];
var passed = 0;

function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('registry loads all 13 schemas', function() {
  var all = registry.loadAll();
  assert.strictEqual(Object.keys(all).length, 13, '13 schemas');
  assert.ok(all.fees && all.fees.schema && all.fees.validate, 'fees module shape');
  assert.strictEqual(all.fees.schema.name, 'capture.fees');
  assert.ok(all.block_height.validate(960410).ok, 'scalar block_height');
});

test('registry init writes schemas.json snapshot', function() {
  var snap = registry.init();
  assert.strictEqual(snap.count, 13);
  assert.ok(fs.existsSync(path.resolve(__dirname, '..', '..', 'captured-data', 'spool', 'schemas.json')));
});

test('all real captured samples validate', function() {
  return spoolMod.init().then(function(s) {
    return Promise.all(registry.SOURCES.map(function(src) {
      return Promise.all(['2026-07-31', '2026-07-30'].map(function(day) {
        return s.resolve(src, day);
      })).then(function(byDay) {
        var all = byDay[0].concat(byDay[1]);
        var good = null;
        for (var i = all.length - 1; i >= 0; i--) {
          var d = all[i].payload.data;
          if (d && !d.ok && d.error) continue;
          if (d !== null && d !== undefined) { good = d; break; }
        }
        return { src: src, data: good };
      });
    }));
  }).then(function(samples) {
    var coveredByFixtures = { mining_pools: true, difficulty: true };
    var missing = samples.filter(function(x) { return (x.data === null || x.data === undefined) && !coveredByFixtures[x.src]; });
    assert.strictEqual(missing.length, 0, 'every spool source has a real sample: ' + missing.map(function(x) { return x.src; }).join(', '));
    var report = vc.runConformance(samples.filter(function(x) { return x.data !== null && x.data !== undefined; }).map(function(x) { return { source: x.src, data: x.data }; }));
    assert.strictEqual(report.failed, 0, 'all sources pass: ' + JSON.stringify(report.violations));
  });
});

test('live-verified fixtures validate (mining_pools, difficulty)', function() {
  var liveFixtures = [
    { source: 'mining_pools', data: { pools: [{ poolId: 1, name: 'Unknown', blockCount: 220586, rank: 1, slug: 'unknown', avgMatchRate: 98.95, avgFeeDelta: '-0.06039664' }], blockCount: 520217 } },
    { source: 'difficulty', data: { progressPercent: 39.48, difficultyChange: -2.099, estimatedRetargetDate: 1786256956920, remainingBlocks: 1220, remainingTime: 748635920, previousRetarget: -0.738, previousTime: 1785019866, nextRetargetHeight: 961632, timeAvg: 613636, adjustedTimeAvg: 613636, timeOffset: 0, expectedBlocks: 814.09 } }
  ];
  var report = vc.runConformance(liveFixtures);
  assert.strictEqual(report.failed, 0, 'live fixtures pass: ' + JSON.stringify(report.violations));
});

test('fees validator rejects wrong types', function() {
  var entry = registry.get('fees');
  var bad = entry.validate({ fastestFee: 'not-int', halfHourFee: 1, hourFee: 1, economyFee: 1, minimumFee: 1 });
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.reasons.some(function(r) { return r.indexOf('fastestFee') !== -1; }));
});

test('unknown extra fields allowed (forward compat)', function() {
  var entry = registry.get('fees');
  var ok = entry.validate({ fastestFee: 1, halfHourFee: 1, hourFee: 1, economyFee: 1, minimumFee: 1, newField: 'future' });
  assert.ok(ok.ok);
});

test('missing required field flagged', function() {
  var entry = registry.get('fees');
  var bad = entry.validate({ fastestFee: 1 });
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.reasons.some(function(r) { return r.indexOf('halfHourFee') !== -1; }));
});

test('wrapCapture produces envelope', function() {
  var p = env.wrapCapture('fees', { status: 200, data: { fastestFee: 2 }, fetchedAt: '2026-07-31T00:00:00.000Z' }, { cycleTs: '2026-07-31_00-00-00', schema: { name: 'capture.fees', major: 1, minor: 0 }, producer: 'test' });
  assert.strictEqual(p.env.magic, 'BSAHI-CAPTURE');
  assert.strictEqual(p.env.envelopeVersion, 1);
  assert.ok(p.env.captured.satisfied);
  assert.strictEqual(p.data.fastestFee, 2);
  assert.strictEqual(p.env.captured.cycleTs, '2026-07-31_00-00-00');
});

test('unwrap identity on legacy payload', function() {
  var legacy = { status: 200, data: { count: 5 }, fetchedAt: '2026-07-31T00:00:00.000Z' };
  var out = env.unwrap(legacy);
  assert.strictEqual(out.status, 200);
  assert.deepStrictEqual(out.data, { count: 5 });
  assert.strictEqual(out.fetchedAt, '2026-07-31T00:00:00.000Z');
});

test('unwrap of enveloped payload returns legacy shape', function() {
  var p = env.wrapCapture('blocks', { status: 200, data: [{ id: '00000000000000000002130ee678a8873070470fc9bf79aa471ec3ff6fb728ee', height: 960409, tx_count: 1, size: 1, weight: 1, difficulty: 1 }], fetchedAt: '2026-07-31T00:00:00.000Z' }, { cycleTs: '2026-07-31_00-00-00' });
  var out = env.unwrap(p);
  assert.strictEqual(out.status, 200);
  assert.strictEqual(out.data.length, 1);
  assert.ok(out.env, 'env preserved for version-aware consumers');
});

test('error capture wrapped satisfied=false', function() {
  var p = env.wrapCapture('fees', { status: 0, error: 'timeout', fetchedAt: '2026-07-31T00:00:00.000Z' }, { cycleTs: '2026-07-31_00-00-00' });
  assert.strictEqual(p.env.captured.satisfied, false);
  assert.strictEqual(p.env.provenance.dataSha256, null);
});

test('wrapAndValidate marks provenance', function() {
  var r = vc.wrapAndValidate('fees', { status: 200, data: { fastestFee: 1, halfHourFee: 1, hourFee: 1, economyFee: 1, minimumFee: 1 }, fetchedAt: '2026-07-31T00:00:00.000Z' }, { cycleTs: '2026-07-31_00-00-00' });
  assert.ok(r.ok);
  assert.ok(r.payload.env.provenance.validated);
  assert.ok(r.payload.env.provenance.validatedBy.indexOf('capture.fees@1.0') === 0);
});

test('wrapAndValidate flags violation', function() {
  var r = vc.wrapAndValidate('fees', { status: 200, data: { fastestFee: 'x' }, fetchedAt: '2026-07-31T00:00:00.000Z' }, { cycleTs: '2026-07-31_00-00-00' });
  assert.strictEqual(r.ok, false);
  assert.ok(r.reasons.length > 0);
});

test('deadletter + deadLetterList', function() {
  var dir = path.join(os.tmpdir(), 'spool-dl-' + Date.now());
  return spoolMod.init({ dir: dir, fsync: false }).then(function(s) {
    return s.deadletter('fees:2026-07-31_00-00-00', 'schemaViolation', { source: 'fees', captureTime: '2026-07-31_00-00-00', producer: 'test', detail: 'fastestFee wrong type' });
  }).then(function(r) {
    assert.ok(r.dead);
    return spoolMod.init({ dir: dir, fsync: false });
  }).then(function(s) {
    return s.deadLetterList();
  }).then(function(list) {
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].reason, 'schemaViolation');
    assert.ok(list[0].quarantined);
  });
});

test('quarantine via validate-capture', function() {
  var dir = path.join(os.tmpdir(), 'spool-q-' + Date.now());
  return spoolMod.init({ dir: dir, fsync: false }).then(function(s) {
    var p = env.wrapCapture('fees', { status: 200, data: { fastestFee: 'bad' }, fetchedAt: '2026-07-31T00:00:00.000Z' }, { cycleTs: '2026-07-31_00-00-00' });
    return vc.quarantine(s, p, ['fastestFee wrong type']).then(function(r) {
      assert.ok(r.dead);
      return s.deadLetterList();
    });
  }).then(function(list) {
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].reason, 'schemaViolation');
    assert.ok(list[0].detail.indexOf('fastestFee') !== -1);
  });
});

function run() {
  var idx = 0;
  function next() {
    if (idx >= tests.length) {
      console.log('\n' + passed + '/' + tests.length + ' tests passed');
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
