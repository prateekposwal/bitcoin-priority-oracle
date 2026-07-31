var { makeValidator, isObj, isInt, isNum, isStr } = require('./helpers.js');

var schema = { name: 'capture.lightning', source: 'lightning', major: 1, minor: 0, protocolDoc: 'docs/protocols/lightning.md' };

function validate(data) {
  if (!isObj(data) || !isObj(data.latest)) return { ok: false, reasons: ['expected {latest:{...}}'] };
  var l = data.latest;
  var reasons = [];
  ['id', 'channel_count', 'node_count', 'total_capacity'].forEach(function(f) {
    if (!(f in l)) reasons.push('latest missing ' + f);
  });
  if (!isInt(l.channel_count) || l.channel_count < 0) reasons.push('channel_count invalid');
  if (!isInt(l.node_count) || l.node_count < 0) reasons.push('node_count invalid');
  if (!isNum(l.total_capacity) || l.total_capacity < 0) reasons.push('total_capacity invalid');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
