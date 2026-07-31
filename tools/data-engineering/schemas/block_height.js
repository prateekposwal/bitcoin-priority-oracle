var { makeValidator, isInt } = require('./helpers.js');

var schema = { name: 'capture.block_height', source: 'block_height', major: 1, minor: 0, protocolDoc: 'docs/protocols/block_height.md' };

function validate(data) {
  if (!isInt(data) || data <= 0) return { ok: false, reasons: ['must be positive integer'] };
  return { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
