var child_process = require('child_process');
var path = require('path');

var AGENTS = [
  { name: 'Block Tracker',  file: 'tools/agents/03-block-interval-tracker.js', always: true },
  { name: 'Enhanced',       file: 'tools/agents/02-enhanced-capture.js', always: false },
  { name: 'Backfill',       file: 'tools/agents/01-backfill-runner.js',  always: false },
];

function runAgent(agent) {
  return new Promise(function(resolve) {
    var start = Date.now();
    var cp = child_process.fork(path.resolve(__dirname, '..', '..', agent.file), [], {
      silent: true, timeout: 60000
    });
    var out = '';
    cp.stdout.on('data', function(d) { out += d; });
    cp.stderr.on('data', function(d) { out += d; });
    cp.on('close', function(code) {
      var elapsed = Date.now() - start;
      console.log('[' + agent.name + '] ' + (code === 0 ? 'OK' : 'FAIL (' + code + ')') + ' — ' + elapsed + 'ms');
      if (code !== 0) console.log('  ' + out.split('\n').slice(0, 3).join('\n  '));
      resolve({ name: agent.name, code: code, elapsed: elapsed, output: out });
    });
  });
}

async function main() {
  var args = process.argv.slice(2);
  var runAll = args.includes('--all') || args.includes('-a');
  var runEnhanced = args.includes('--enhanced') || args.includes('-e');

  console.log('Running agents: ' + AGENTS.filter(function(a) {
    return a.always || (runAll && !a.always) || (runEnhanced && a.name === 'Enhanced');
  }).map(function(a) { return a.name; }).join(', '));

  var results = [];
  for (var i = 0; i < AGENTS.length; i++) {
    var a = AGENTS[i];
    if (!a.always && !runAll && !(runEnhanced && a.name === 'Enhanced')) continue;
    results.push(await runAgent(a));
  }

  var ok = results.filter(function(r) { return r.code === 0; }).length;
  console.log('\nDone: ' + ok + '/' + results.length + ' agents passed');
  process.exit(ok === results.length ? 0 : 1);
}

main().catch(function(e) { console.error('Orchestrator error:', e.message); process.exit(1); });
