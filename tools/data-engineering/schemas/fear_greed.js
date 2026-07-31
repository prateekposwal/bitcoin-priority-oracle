var { makeValidator, isObj, isStr, isArr } = require('./helpers.js');

var CLASSIFICATIONS = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'];

var schema = { name: 'capture.fear_greed', source: 'fear_greed', major: 1, minor: 0, protocolDoc: 'docs/protocols/fear_greed.md' };

function validate(data) {
  if (!isObj(data) || !isArr(data.data) || data.data.length === 0) return { ok: false, reasons: ['expected {data:[...]}'] };
  var d = data.data[0];
  var reasons = [];
  if (!isStr(d.value) || !/^\d+$/.test(d.value)) reasons.push('data[0].value must be numeric string');
  if (CLASSIFICATIONS.indexOf(d.value_classification) === -1) reasons.push('value_classification not in enum');
  if (!isStr(d.timestamp)) reasons.push('data[0].timestamp must be string');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
