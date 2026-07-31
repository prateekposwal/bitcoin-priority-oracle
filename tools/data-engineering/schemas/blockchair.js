var { makeValidator, isObj, isInt, isNum } = require('./helpers.js');

var schema = { name: 'capture.blockchair', source: 'blockchair', major: 1, minor: 0, protocolDoc: 'docs/protocols/blockchair.md' };

function validate(data) {
  if (!isObj(data) || !isObj(data.data)) return { ok: false, reasons: ['expected {data:{...}}'] };
  var d = data.data;
  var reasons = [];
  ['blocks', 'transactions', 'best_block_height', 'difficulty', 'mempool_transactions', 'market_price_usd'].forEach(function(f) {
    if (!(f in d)) reasons.push('data missing ' + f);
  });
  if (!isInt(d.blocks) || d.blocks <= 0) reasons.push('data.blocks invalid');
  if (!isNum(d.difficulty) || d.difficulty <= 0) reasons.push('data.difficulty invalid');
  if (!isNum(d.market_price_usd) || d.market_price_usd <= 0) reasons.push('data.market_price_usd invalid');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
