function isInt(v) {
  if (typeof v === 'number') return Number.isInteger(v);
  if (typeof v === 'string' && v.trim() !== '') return Number.isInteger(Number(v));
  return false;
}
function isNum(v) {
  if (typeof v === 'number') return isFinite(v);
  if (typeof v === 'string' && v.trim() !== '') return isFinite(Number(v));
  return false;
}
function isStr(v) { return typeof v === 'string'; }
function isBool(v) { return typeof v === 'boolean'; }
function isArr(v) { return Array.isArray(v); }
function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function makeValidator(schema, checks) {
  var spec = checks || [];
  return {
    schema: schema,
    validate: function(data) {
      var reasons = [];
      if (data === null || data === undefined) return { ok: false, reasons: ['payload is null'] };
      for (var i = 0; i < spec.length; i++) {
        var c = spec[i];
        if (typeof c === 'string') {
          if (!(c in data)) reasons.push('missing required field: ' + c);
          continue;
        }
        var field = c.name;
        var has = field in data;
        if (c.required && !has) { reasons.push('missing required field: ' + field); continue; }
        if (!has || data[field] === null) continue;
        var v = data[field];
        if (c.type === 'int' && !isInt(v)) reasons.push(field + ' must be integer, got ' + typeof v);
        else if (c.type === 'num' && !isNum(v)) reasons.push(field + ' must be number, got ' + typeof v);
        else if (c.type === 'str' && !isStr(v)) reasons.push(field + ' must be string, got ' + typeof v);
        else if (c.type === 'bool' && !isBool(v)) reasons.push(field + ' must be boolean, got ' + typeof v);
        else if (c.type === 'arr' && !isArr(v)) reasons.push(field + ' must be array, got ' + typeof v);
        else if (c.type === 'obj' && !isObj(v)) reasons.push(field + ' must be object, got ' + typeof v);
        else if (c.regex && isStr(v) && !c.regex.test(v)) reasons.push(field + ' failed pattern ' + c.regex);
        else if (c.enum && v !== undefined && c.enum.indexOf(v) === -1) reasons.push(field + ' not in enum');
        else if (c.min !== undefined && isNum(v) && v < c.min) reasons.push(field + ' below min ' + c.min);
        else if (c.max !== undefined && isNum(v) && v > c.max) reasons.push(field + ' above max ' + c.max);
      }
      if (reasons.length) return { ok: false, reasons: reasons };
      return { ok: true, reasons: [] };
    }
  };
}

module.exports = { isInt: isInt, isNum: isNum, isStr: isStr, isBool: isBool, isArr: isArr, isObj: isObj, makeValidator: makeValidator };
