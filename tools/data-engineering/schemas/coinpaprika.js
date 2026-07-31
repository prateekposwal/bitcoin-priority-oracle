var { makeValidator, isObj, isStr, isInt, isBool } = require('./helpers.js');

var schema = { name: 'capture.coinpaprika', source: 'coinpaprika', major: 1, minor: 0, protocolDoc: 'docs/protocols/coinpaprika.md' };

function validate(data) {
  if (!isObj(data)) return { ok: false, reasons: ['must be object'] };
  var reasons = [];
  ['id', 'name', 'symbol', 'rank'].forEach(function(f) {
    if (!(f in data)) reasons.push('missing ' + f);
  });
  if (!isStr(data.id) || data.id !== 'btc-bitcoin') reasons.push('id must be btc-bitcoin');
  if (!isInt(data.rank) || data.rank < 1) reasons.push('rank invalid');
  if (data.is_active !== undefined && !isBool(data.is_active)) reasons.push('is_active must be boolean');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
