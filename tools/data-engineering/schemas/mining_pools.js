var { makeValidator, isObj, isArr, isInt, isNum } = require('./helpers.js');

var schema = { name: 'capture.mining_pools', source: 'mining_pools', major: 1, minor: 1, protocolDoc: 'docs/protocols/mining_pools.md' };

function validate(data) {
  if (!isObj(data) || !isArr(data.pools) || data.pools.length === 0) return { ok: false, reasons: ['expected {pools:[...]}'] };
  var reasons = [];
  if (!isInt(data.blockCount) || data.blockCount < 0) reasons.push('blockCount invalid');
  var first = data.pools[0];
  if (!isObj(first)) reasons.push('pools[0] not object');
  else {
    ['poolId', 'name', 'blockCount', 'rank'].forEach(function(f) {
      if (!(f in first)) reasons.push('pools[0] missing ' + f);
    });
  }
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
