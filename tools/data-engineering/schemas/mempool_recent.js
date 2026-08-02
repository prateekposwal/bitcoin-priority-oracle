var { isArr, isObj, isStr, isNum } = require('./helpers.js');

var schema = { name: 'capture.mempool_recent', source: 'mempool_recent', major: 1, minor: 0, protocolDoc: 'docs/protocols/mempool_recent.md' };

function validate(data) {
  if (!isArr(data) || data.length === 0) return { ok: false, reasons: ['must be non-empty array'] };
  var reasons = [];
  data.slice(0, 50).forEach(function(tx, i) {
    if (!isObj(tx)) { reasons.push('item ' + i + ' not object'); return; }
    ['txid', 'fee', 'vsize', 'value'].forEach(function(f) {
      if (!(f in tx)) reasons.push('item ' + i + ' missing ' + f);
    });
    if ('txid' in tx && !isStr(tx.txid)) reasons.push('item ' + i + ' txid not string');
    if ('fee' in tx && !isNum(tx.fee)) reasons.push('item ' + i + ' fee not number');
    if ('vsize' in tx && !isNum(tx.vsize)) reasons.push('item ' + i + ' vsize not number');
  });
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
