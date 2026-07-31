var { makeValidator, isArr, isInt, isNum, isStr } = require('./helpers.js');

var HEX64 = /^[0-9a-f]{64}$/;

var schema = { name: 'capture.blocks', source: 'blocks', major: 1, minor: 0, protocolDoc: 'docs/protocols/blocks.md' };

function validate(data) {
  if (!isArr(data)) return { ok: false, reasons: ['must be array'] };
  if (data.length === 0) return { ok: false, reasons: ['empty array'] };
  if (data.length > 10) return { ok: false, reasons: ['more than 10 blocks'] };
  var reasons = [];
  for (var i = 0; i < data.length; i++) {
    var b = data[i];
    if (!b || typeof b !== 'object') { reasons.push('item ' + i + ' not object'); continue; }
    ['id', 'height', 'timestamp', 'tx_count', 'size', 'weight', 'difficulty'].forEach(function(f) {
      if (!(f in b)) reasons.push('item ' + i + ' missing ' + f);
    });
    if (!isStr(b.id) || !HEX64.test(b.id)) reasons.push('item ' + i + ' id not 64-hex');
    if (!isInt(b.height) || b.height <= 0) reasons.push('item ' + i + ' height invalid');
    if (!isNum(b.difficulty) || b.difficulty <= 0) reasons.push('item ' + i + ' difficulty invalid');
  }
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
