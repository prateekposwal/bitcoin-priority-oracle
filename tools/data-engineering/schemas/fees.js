var { makeValidator } = require('./helpers.js');

module.exports = makeValidator(
  { name: 'capture.fees', source: 'fees', major: 1, minor: 0, protocolDoc: 'docs/protocols/fees.md' },
  [
    { name: 'fastestFee', type: 'int', required: true, min: 0 },
    { name: 'halfHourFee', type: 'int', required: true, min: 0 },
    { name: 'hourFee', type: 'int', required: true, min: 0 },
    { name: 'economyFee', type: 'int', required: true, min: 0 },
    { name: 'minimumFee', type: 'int', required: true, min: 0 }
  ]
);
