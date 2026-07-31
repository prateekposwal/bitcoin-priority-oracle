// BSAHI — Domain Gate
// Only engage within our domain: block space economics.
// Out-of-domain topics: stay quiet. Never reply out of domain.

var DOMAIN = {
  in: ['fee', 'fees', 'mempool', 'block', 'transaction', 'lightning', 'node',
       'settlement', 'on-chain', 'miner', 'reward', 'hashrate', 'sats',
       'sat/vb', 'scarcity', 'economics', 'storage', 'cost', 'incentive',
       'congestion', 'confirmation', 'finality', 'second layer'],
  out: ['politics', 'election', 'war', 'sports', 'celebrity', 'gambling',
        'casino', 'porn', 'drug', 'crime', 'terror', 'religion', 'crypto casino',
        'meme coin', 'shitcoin', 'altcoin price', 'pump', 'moon']
};

function isInDomain(text) {
  var t = text.toLowerCase();
  // Explicit out-of-domain blocks
  for (var i = 0; i < DOMAIN.out.length; i++) {
    if (t.includes(DOMAIN.out[i])) return false;
  }
  // Must have at least one in-domain signal
  for (var j = 0; j < DOMAIN.in.length; j++) {
    if (t.includes(DOMAIN.in[j])) return true;
  }
  return false;
}

module.exports = { isInDomain: isInDomain, DOMAIN: DOMAIN };
