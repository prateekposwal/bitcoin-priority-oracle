var { isObj, isStr, isNum } = require('./helpers.js');

var HEX64 = /^[0-9a-f]{64}$/;

var schema = { name: 'capture.raw_block_tip', source: 'raw_block_tip', major: 1, minor: 0, protocolDoc: 'docs/protocols/raw_block_tip.md' };

function validate(data) {
  if (!isObj(data)) return { ok: false, reasons: ['must be object'] };
  var reasons = [];
  if (!isStr(data.blockHash) || !HEX64.test(data.blockHash)) reasons.push('blockHash not 64-hex');
  if (!isStr(data.rawHex) || data.rawHex.length === 0) reasons.push('rawHex empty');
  if (!isNum(data.size) || data.size <= 0) reasons.push('size invalid');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
