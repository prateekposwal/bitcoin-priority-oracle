#!/usr/bin/env node
// BSAHI — Engagement Orchestrator (Node wrapper)
// Runs the Python engagement engines through node's TCC access.
// launchd runs THIS via node (which has Desktop access); node spawns python.
var { exec } = require('child_process');
var path = require('path');

var REPO = '/Users/prateekposwal/Desktop/block-space-economics';
// Ensure node is found by python engines (launchd has minimal PATH)
process.env.PATH = '/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin';
var logFile = path.join(REPO, 'captured-data', 'engagement.log');
var fs = require('fs');

function log(msg) {
  var line = '[' + new Date().toISOString().replace('T', ' ').slice(0, 19) + '] ' + msg;
  console.log(line);
  try { fs.appendFileSync(logFile, line + '\n'); } catch(e) {}
}

function run(script, args, cb) {
  var cmd = 'python3 ' + path.join(REPO, script) + ' ' + args.join(' ');
  log('RUN: ' + cmd);
  exec(cmd, { cwd: REPO, timeout: 240000, maxBuffer: 1024*1024 }, function(err, stdout, stderr) {
    if (stdout) log(stdout.trim().split('\n').pop());
    if (stderr) log('STDERR: ' + stderr.trim().slice(-200));
    cb(err);
  });
}

function cycle() {
  log('=== Engagement cycle ===');
  // Phase 1: reply back always
  run('tools/bridge/reply-engine.py', [], function() {
    // Phase 2: comment (engagement before publishing)
    run('tools/bridge/comment-engine.py', ['8'], function() {
      // Phase 3: engage LinkedIn/Medium
      run('tools/bridge/engage-engine.py', ['3', '3'], function() {
        // Phase 4: check if engagement threshold met, then publish
        run('tools/bridge/scheduler.py', [], function() {
          log('=== Cycle complete ===');
        });
      });
    });
  });
}

// Daemon mode: loop every 30 min
log('Engagement orchestrator started');
cycle();
setInterval(cycle, 1800000);
