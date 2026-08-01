#!/usr/bin/env node
var assert = require('assert');
var path = require('path');

var tests = [];
var passed = 0;

function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('buildFeedTitle formats topic + seq + preview words', function() {
  var p = require('../../tools/marketing/publisher.js');
  var t = p.buildFeedTitle('storage', 14, '## The Physical Bitcoin\n\nBitcoin is not just code');
  assert.strictEqual(t, 'Storage #14 — The Physical Bitcoin Bitcoin is not');
});

test('buildFeedTitle handles empty preview', function() {
  var p = require('../../tools/marketing/publisher.js');
  assert.strictEqual(p.buildFeedTitle('fee', 3, null), 'Fee #3');
});

test('buildFeedTitle strips markdown links', function() {
  var p = require('../../tools/marketing/publisher.js');
  var t = p.buildFeedTitle('blocks', 1, 'See [the research](https://bitcoinsahi.com/learn) here');
  assert.ok(t.indexOf('the research here') !== -1);
  assert.ok(t.indexOf('(') === -1);
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
    try { t.fn(); passed++; console.log('ok - ' + t.name); } catch (e) { console.log('FAIL - ' + t.name + ': ' + e.message); }
    next();
  }
  next();
}

run();
