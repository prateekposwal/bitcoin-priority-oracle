var { makeValidator, isArr, isNum } = require('./helpers.js');

var schema = { name: 'capture.mempool_blocks', source: 'mempool_blocks', major: 1, minor: 0, protocolDoc: 'docs/protocols/mempool_blocks.md' };

function validate(data) {
  if (!isArr(data)) return { ok: false, reasons: ['must be array'] };
  if (data.length === 0) return { ok: false, reasons: ['empty array'] };
  var reasons = [];
  for (var i = 0; i < data.length; i++) {
    var b = data[i];
    if (!b || typeof b !== 'object') { reasons.push('item ' + i + ' not object'); continue; }
    ['blockSize', 'blockVSize', 'nTx', 'totalFees', 'medianFee', 'feeRange'].forEach(function(f) {
      if (!(f in b)) reasons.push('item ' + i + ' missing ' + f);
    });
    if (!isNum(b.medianFee) || b.medianFee < 0) reasons.push('item ' + i + ' medianFee invalid');
    if (!isArr(b.feeRange) || b.feeRange.length < 2) reasons.push('item ' + i + ' feeRange must be array >= 2');
  }
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
