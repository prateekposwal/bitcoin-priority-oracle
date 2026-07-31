var { makeValidator } = require('./helpers.js');

module.exports = makeValidator(
  { name: 'capture.mempool', source: 'mempool', major: 1, minor: 0, protocolDoc: 'docs/protocols/mempool.md' },
  [
    { name: 'count', type: 'int', required: true, min: 0 },
    { name: 'vsize', type: 'int', required: true, min: 0 },
    { name: 'total_fee', type: 'int', required: true, min: 0 },
    { name: 'fee_histogram', type: 'arr', required: true }
  ]
);
