var { makeValidator } = require('./helpers.js');

module.exports = makeValidator(
  { name: 'capture.btc_price', source: 'btc_price', major: 1, minor: 0, protocolDoc: 'docs/protocols/btc_price.md' },
  [
    { name: 'time', type: 'int', required: true, min: 0 },
    { name: 'USD', type: 'int', required: true, min: 0 },
    { name: 'EUR', type: 'int', required: true, min: 0 },
    { name: 'GBP', type: 'int', required: true, min: 0 },
    { name: 'CAD', type: 'int', required: true, min: 0 },
    { name: 'CHF', type: 'int', required: true, min: 0 },
    { name: 'AUD', type: 'int', required: true, min: 0 },
    { name: 'JPY', type: 'int', required: true, min: 0 }
  ]
);
