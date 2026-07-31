var { makeValidator, isObj, isInt, isNum } = require('./helpers.js');

var schema = { name: 'capture.difficulty', source: 'difficulty', major: 1, minor: 1, protocolDoc: 'docs/protocols/difficulty.md' };

function validate(data) {
  if (!isObj(data)) return { ok: false, reasons: ['must be object'] };
  var reasons = [];
  ['difficultyChange', 'estimatedRetargetDate', 'remainingBlocks', 'nextRetargetHeight', 'timeAvg'].forEach(function(f) {
    if (!(f in data)) reasons.push('missing ' + f);
  });
  if (!isNum(data.difficultyChange)) reasons.push('difficultyChange must be number');
  if (!isInt(data.remainingBlocks) || data.remainingBlocks < 0) reasons.push('remainingBlocks invalid');
  if (!isInt(data.nextRetargetHeight) || data.nextRetargetHeight <= 0) reasons.push('nextRetargetHeight invalid');
  if (!isInt(data.timeAvg) || data.timeAvg <= 0) reasons.push('timeAvg invalid');
  return reasons.length ? { ok: false, reasons: reasons } : { ok: true, reasons: [] };
}

module.exports = { schema: schema, validate: validate };
