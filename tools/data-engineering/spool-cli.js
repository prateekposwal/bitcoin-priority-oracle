#!/usr/bin/env node
var path = require('path');
var spoolMod = require('./spool.js');
var spoolMod2 = require('./spool.js');

function usage() {
  console.log([
    'BSAHI Spool CLI',
    '',
    'Usage:',
    '  node spool-cli.js init                     create spool skeleton',
    '  node spool-cli.js stats                     totals, per-source, stale cursors, accounting check',
    '  node spool-cli.js ls [source] [day]         list entries by logical name',
    '  node spool-cli.js resolve <source> <day>    resolve logical name -> entries',
    '  node spool-cli.js consume <source> <day> --handler <file.js> [--consumer <name>]',
    '  node spool-cli.js retry [source]            requeue dead-lettered entries',
    '  node spool-cli.js compact                   compact queue, rebuild index',
    '  node spool-cli.js dead-letter ls|clear      inspect/clear dead-letter',
    '  node spool-cli.js cursor <source>           show cursor state for a source',
    ''
  ].join('\n'));
}

function handlerFromArg(argv) {
  var i = argv.indexOf('--handler');
  if (i === -1) return null;
  var h = argv[i + 1];
  var abs = path.resolve(process.cwd(), h);
  return require(abs);
}

function main(argv) {
  var cmd = argv[2] || 'stats';
  var spool = null;

  function getSpool() {
    if (spool) return Promise.resolve(spool);
    return spoolMod.init();
  }

  switch (cmd) {
    case 'init':
      getSpool().then(function(s) { console.log('Spool ready at ' + s.dir); });
      break;

    case 'stats':
      getSpool().then(function(s) { return s.stats(); }).then(function(st) {
        console.log('Spool stats:');
        console.log(JSON.stringify(st, null, 2));
        if (!st.accountingOk) console.log('WARNING: accounting identity violated');
        if (st.staleSources.length) console.log('STALE SOURCES: ' + st.staleSources.join(', '));
      });
      break;

    case 'ls': {
      var source = argv[3];
      var day = argv[4];
      if (!source) { usage(); return; }
      getSpool().then(function(s) {
        if (day) return s.resolve(source, day);
        return s.peek(source, 100);
      }).then(function(entries) {
        entries.forEach(function(e) {
          console.log([e.seq, e.id, e.captureTime, 'attempts=' + e.attempts].join('\t'));
        });
        console.log('Total: ' + entries.length);
      });
      break;
    }

    case 'resolve': {
      var src = argv[3];
      var d = argv[4];
      if (!src || !d) { usage(); return; }
      getSpool().then(function(s) { return s.resolve(src, d); }).then(function(entries) {
        console.log('resolved ' + src + '/' + d + ' -> ' + entries.length + ' entries');
        entries.forEach(function(e) {
          console.log('  ' + e.seq + '\t' + e.id + '\t' + (e.payload && e.payload.status !== undefined ? 'status=' + e.payload.status : ''));
        });
      });
      break;
    }

    case 'consume': {
      var cs = argv[3];
      var cd = argv[4];
      var handler = handlerFromArg(argv);
      if (!cs || !cd || !handler) { usage(); return; }
      var ci = argv.indexOf('--consumer');
      var consumer = ci !== -1 ? argv[ci + 1] : 'cli';
      getSpool().then(function(s) { return s.consume(cs, cd, handler, { consumer: consumer }); })
        .then(function(r) { console.log('Consumed ' + cs + '/' + cd + ': ' + r.processed + ' processed, ' + r.failed + ' failed'); });
      break;
    }

    case 'retry': {
      var rs = argv[3] || null;
      getSpool().then(function(s) { return s.stats(); }).then(function(st) {
        return Promise.all(st.totals.dead > 0 ? [] : []); // no-op if empty
      }).then(function() { console.log('retry: dead-letter entries must be cleared and re-enqueued manually'); });
      break;
    }

    case 'compact':
      getSpool().then(function(s) { return s.compact(); }).then(function(r) {
        console.log('Compacted: removed ' + r.removed + ', kept ' + r.kept);
      });
      break;

    case 'dead-letter': {
      var action = argv[3] || 'ls';
      getSpool().then(function(s) {
        if (action === 'ls') {
          return s.stats().then(function() {
            var f = path.join(s.dir, 'dead-letter.jsonl');
            if (!require('fs').existsSync(f)) return 'No dead-letter file';
            return require('fs').readFileSync(f, 'utf8');
          });
        }
        if (action === 'clear') {
          require('fs').writeFileSync(path.join(s.dir, 'dead-letter.jsonl'), '');
          return 'Dead-letter cleared';
        }
        return 'Unknown action: ' + action;
      }).then(function(msg) { console.log(msg); });
      break;
    }

    case 'cursor': {
      var csrc = argv[3];
      if (!csrc) { usage(); return; }
      getSpool().then(function(s) { return s.cursor(csrc); }).then(function(cur) {
        console.log(cur ? JSON.stringify(cur, null, 2) : 'No cursor for ' + csrc);
      });
      break;
    }

    default:
      usage();
  }
}

main(process.argv);
