var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
var spoolMod = require('./spool.js');

var TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'spool-test-'));
var tests = [];
var passed = 0;

function test(name, fn) { tests.push({ name: name, fn: fn }); }

function freshSpool() {
  var dir = path.join(TMP, 'spool-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
  return spoolMod.init({ dir: dir, fsync: false });
}

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
    Promise.resolve(t.fn()).then(function() {
      passed++;
      console.log('ok - ' + t.name);
      next();
    }).catch(function(e) {
      console.log('FAIL - ' + t.name + ': ' + e.message);
      next();
    });
  }
  next();
}

test('no loss accounting identity', function() {
  return freshSpool().then(function(s) {
    return s.enqueue('fees', { status: 200, data: { fastestFee: 2 } }, { captureTime: '2026-07-31_00-00-00', day: '2026-07-31' });
  }).then(function() {
    return freshSpool();
  }).then(function(s) {
    return s.stats();
  }).then(function(st) {
    assert.ok(st.accountingOk, 'accounting identity must hold: ' + JSON.stringify(st.totals));
  });
});

test('idempotency', function() {
  return freshSpool().then(function(s) {
    return s.enqueue('fees', { data: 1 }, { captureTime: '2026-07-31_01-00-00', day: '2026-07-31' }).then(function(r1) {
      assert.ok(r1.ok && !r1.duplicate, 'first enqueue not duplicate');
      return s;
    }).then(function(s2) {
      return s2.enqueue('fees', { data: 2 }, { captureTime: '2026-07-31_01-00-00', day: '2026-07-31' }).then(function(r2) {
        assert.ok(r2.duplicate, 'second enqueue should be duplicate');
        return s2.stats();
      });
    });
  }).then(function(st) {
    assert.strictEqual(st.totals.enqueued, 1, 'only one entry after duplicate');
  });
});

test('ordering', function() {
  return freshSpool().then(function(s) {
    var ops = [];
    for (var i = 1; i <= 5; i++) {
      var ts = '2026-07-31_0' + i + '-00-00';
      ops.push(s.enqueue('mempool', { n: i }, { captureTime: ts, day: '2026-07-31' }));
    }
    return Promise.all(ops).then(function() { return s; });
  }).then(function(s) {
    return s.dequeue('mempool').then(function(e1) { return s.dequeue('mempool').then(function(e2) { return { e1: e1, e2: e2 }; }); });
  }).then(function(r) {
    assert.ok(r.e1.seq < r.e2.seq, 'dequeue must return ascending seq');
  });
});

test('crash recovery torn line', function() {
  var dir = path.join(TMP, 'spool-crash-' + Date.now());
  var s0;
  return spoolMod.init({ dir: dir, fsync: false }).then(function(s) {
    s0 = s;
    return s.enqueue('blocks', { data: 1 }, { captureTime: '2026-07-31_02-00-00', day: '2026-07-31' });
  }).then(function() {
    fs.appendFileSync(path.join(dir, 'queue.jsonl'), '{"id":"fees:2026-07-31_02-00-00","sour');
    return spoolMod.init({ dir: dir, fsync: false });
  }).then(function(s) {
    return s.stats();
  }).then(function(st) {
    assert.strictEqual(st.totals.enqueued, 1, 'torn line must be quarantined, prior entries intact');
    var corrupt = fs.readFileSync(path.join(dir, 'corrupt.log'), 'utf8');
    assert.ok(corrupt.length > 0, 'corrupt.log must record the torn line');
  });
});

test('lease expiry', function() {
  return freshSpool().then(function(s) {
    return s.enqueue('lightning', { data: 1 }, { captureTime: '2026-07-31_03-00-00', day: '2026-07-31' }).then(function() { return s; });
  }).then(function(s) {
    return s.dequeue('lightning', { consumer: 't1' }).then(function(e) {
      return s.dequeue('lightning', { consumer: 't2' }).then(function(e2) { return { e: e, e2: e2 }; });
    });
  }).then(function(r) {
    assert.ok(r.e, 'first dequeue should get entry');
    assert.strictEqual(r.e2, null, 'active lease must block redelivery');
  });
});

test('poison handling', function() {
  return freshSpool().then(function(s) {
    return s.enqueue('poison1', { data: 1 }, { captureTime: '2026-07-31_04-00-00', day: '2026-07-31' }).then(function() { return s; });
  }).then(function(s) {
    return s.dequeue('poison1', { consumer: 't' }).then(function(e) {
      assert.ok(e, 'dequeue returns entry');
      function attempt() { return s.requeue(e.id, new Error('bad payload')); }
      return attempt().then(attempt).then(attempt).then(attempt);
    }).then(function(r) {
      assert.ok(r.dead, 'entry must dead-letter after attempt cap');
      return s.stats();
    });
  }).then(function(st) {
    assert.strictEqual(st.totals.dead, 1, 'poisoned entry must reach dead-letter');
    assert.strictEqual(st.totals.pending, 0, 'no pending poison left');
  });
});

test('compaction', function() {
  var dir = path.join(TMP, 'spool-compact-' + Date.now());
  return spoolMod.init({ dir: dir, fsync: false }).then(function(s) {
    return s.enqueue('fees', { data: 1 }, { captureTime: '2026-07-31_05-00-00', day: '2026-07-31' }).then(function() {
      return s.enqueue('fees', { data: 2 }, { captureTime: '2026-07-31_05-01-00', day: '2026-07-31' });
    }).then(function() { return s; });
  }).then(function(s) {
    return s.dequeue('fees', { consumer: 't' }).then(function(e) { return s.ack(e.id, 't'); }).then(function() { return s.compact(); });
  }).then(function(r) {
    assert.strictEqual(r.kept, 1, 'acked entry removed by compaction');
    return spoolMod.init({ dir: dir, fsync: false });
  }).then(function(s) {
    return s.stats();
  }).then(function(st) {
    assert.strictEqual(st.totals.pending, 1, 'pending preserved after compaction + reload');
    assert.ok(st.accountingOk, 'accounting after compaction');
  });
});

test('concurrency', function() {
  return freshSpool().then(function(s) {
    var ops = [];
    for (var i = 1; i <= 6; i++) {
      var ts = '2026-07-31_06-0' + i + '-00-00';
      ops.push(s.enqueue('mempool', { i: i }, { captureTime: ts, day: '2026-07-31' }));
    }
    return Promise.all(ops).then(function() { return s; });
  }).then(function(s) {
    return Promise.all([s.dequeue('mempool', { consumer: 'a' }), s.dequeue('mempool', { consumer: 'b' }), s.dequeue('mempool', { consumer: 'a' })]);
  }).then(function(results) {
    var ids = results.map(function(r) { return r ? r.id : null; });
    var seen = {};
    ids.forEach(function(id) { if (id) seen[id] = (seen[id] || 0) + 1; });
    Object.keys(seen).forEach(function(id) {
      assert.strictEqual(seen[id], 1, 'no id delivered twice while lease active');
    });
    assert.strictEqual(ids.filter(Boolean).length, 3, 'three distinct entries delivered');
  });
});

test('backfill logical names', function() {
  return freshSpool().then(function(s) {
    return s.enqueue('fee_history', { data: 'hist' }, { captureTime: '2026-06-15_00-00-00', day: '2026-06-15' }).then(function() { return s; });
  }).then(function(s) {
    return s.resolve('fee_history', '2026-06-15');
  }).then(function(entries) {
    assert.strictEqual(entries.length, 1, 'backfill entry resolvable by logical name');
    assert.strictEqual(entries[0].day, '2026-06-15');
  });
});

test('disk full no throw', function() {
  var ro = path.join(TMP, 'readonly-' + Date.now());
  var spool;
  return spoolMod.init({ dir: ro, fsync: false }).then(function(s) {
    spool = s;
    return s.enqueue('fees', { data: 0 }, { captureTime: '2026-07-31_06-59-00', day: '2026-07-31' });
  }).then(function() {
    fs.chmodSync(path.join(ro, 'tmp'), 0o444);
    return spool.enqueue('fees', { data: 1 }, { captureTime: '2026-07-31_07-00-00', day: '2026-07-31' });
  }).then(function(r) {
    fs.chmodSync(path.join(ro, 'tmp'), 0o755);
    assert.strictEqual(r.ok, false, 'enqueue must return {ok:false} on failure, not throw');
    assert.ok(r.error, 'error message attached');
  });
});

run();
