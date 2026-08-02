var { isArr, isObj, isNum } = require('./helpers.js');

var schema = { name: 'capture.hashrate', source: 'hashrate', major: 1, minor: 0, protocolDoc: 'docs/protocols/hashrate.md' };

function validate(data) {
  if (!isObj(data)) return { ok: false, reasons: ['must be object'] };
  var reasons = [];
  if (!('hashrates' in data) || !isArr(data.hashrates) || data.hashrates.length === 0) {
    reasons.push('missing/empty hashrates array');
  } else {
    data.hashrates.forEach(function(h, i) {
      if (!isObj(h) || !('timestamp' in h) || !isNum(h.avgHashrate)) {
        reasons.push('hashrates[' + i + '] missing timestamp/avgHashrate');
      }
    });
  }
  if (!isNum(data.currentHashrate)) reasons.push('currentHashrate must be number');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
