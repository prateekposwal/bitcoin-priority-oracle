var { makeValidator, isArr, isNum, isInt } = require('./helpers.js');

var schema = { name: 'capture.fee_history', source: 'fee_history', major: 1, minor: 0, protocolDoc: 'docs/protocols/fee_history.md' };

function validate(data) {
  if (!isArr(data)) return { ok: false, reasons: ['must be array'] };
  if (data.length === 0) return { ok: false, reasons: ['empty array'] };
  var reasons = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r || typeof r !== 'object') { reasons.push('item ' + i + ' not object'); continue; }
    ['avgHeight', 'timestamp', 'avgFees'].forEach(function(f) {
      if (!(f in r)) reasons.push('item ' + i + ' missing ' + f);
    });
    if (!isInt(r.avgHeight) || r.avgHeight <= 0) reasons.push('item ' + i + ' avgHeight invalid');
    if (!isNum(r.avgFees) || r.avgFees < 0) reasons.push('item ' + i + ' avgFees invalid');
  }
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
