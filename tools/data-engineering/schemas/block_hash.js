var { isStr } = require('./helpers.js');

var HEX64 = /^[0-9a-f]{64}$/;

var schema = { name: 'capture.block_hash', source: 'block_hash', major: 1, minor: 0, protocolDoc: 'docs/protocols/block_hash.md' };

function validate(data) {
  if (!isStr(data)) return { ok: false, reasons: ['must be string'] };
  if (!HEX64.test(data)) return { ok: false, reasons: ['not a 64-char hex block hash'] };
  return { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
