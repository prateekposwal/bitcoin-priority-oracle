// Bitcoin Sahi — Comprehensive Research Agent System
// Launches parallel research agents every session
// Covers Bitcoin, blockchain, APIs, developments, tools, everything

var RESEARCH_AGENTS = [
  {
    id: 'bitcoin-core',
    name: 'Bitcoin Core & Protocol',
    sources: [
      'https://github.com/bitcoin/bitcoin/releases',
      'https://github.com/bitcoin/bips',
      'https://delvingbitcoin.org',
      'https://bitcoinops.org',
      'https://lists.linuxfoundation.org/pipermail/bitcoin-dev/',
      'https://github.com/bitcoin/bitcoin/pulls'
    ],
    questions: [
      'What BIPs are new or changing status?',
      'What Bitcoin Core PRs are notable?',
      'What protocol discussions are happening?',
      'What new proposals affect block space, fees, or UTXOs?',
      'What are the roadmap items for next release?'
    ]
  },
  {
    id: 'lightning',
    name: 'Lightning Network',
    sources: [
      'https://github.com/lightningnetwork/lnd/releases',
      'https://github.com/ElementsProject/lightning/releases',
      'https://github.com/ACINQ/eclair/releases',
      'https://bitcoinops.org',
      'https://delvingbitcoin.org'
    ],
    questions: [
      'What new LN features or protocols are emerging?',
      'What are the channel management trends?',
      'What fee-related LN discussions are happening?',
      'What new routing or liquidity management tools exist?',
      'What is the LN capacity and node count?'
    ]
  },
  {
    id: 'api-data',
    name: 'Blockchain APIs & Data Sources',
    sources: [
      'https://mempool.space/api/v1/fees/recommended',
      'https://mempool.space/api/v1/prices',
      'https://mempool.space/api/v1/difficulty-adjustment',
      'https://mempool.space/api/v1/fees/mempool-blocks',
      'https://blockstream.info/api/blocks/tip/height',
      'https://blockchain.info/q/utxocount',
      'https://ordinals.com/api/stats',
      'https://api.blockchain.info/stats'
    ],
    questions: [
      'What new blockchain APIs are available?',
      'What existing APIs have changed or added features?',
      'What WebSocket/streaming APIs exist?',
      'What free data sources are we not using?',
      'What rate limits or breaking changes should we track?'
    ]
  },
  {
    id: 'blockchain-general',
    name: 'General Blockchain & Crypto',
    sources: [
      'https://coinmarketcap.com',
      'https://defillama.com',
      'https://github.com/bitcoin',
      'https://www.reddit.com/r/CryptoTechnology/',
      'https://news.ycombinator.com/'
    ],
    questions: [
      'What new blockchain innovations or trends?',
      'What new L1/L2 developments?',
      'What new data availability or storage solutions?',
      'What fee market innovations in other chains?',
      'What regulatory changes affect Bitcoin?'
    ]
  },
  {
    id: 'research-papers',
    name: 'Academic Research',
    sources: [
      'https://arxiv.org/search/?searchtype=all&query=bitcoin+fee+market',
      'https://arxiv.org/search/?searchtype=all&query=blockchain+storage+cost',
      'https://arxiv.org/search/?searchtype=all&query=UTXO+externality',
      'https://scholar.google.com/scholar?q=bitcoin+block+space+economics'
    ],
    questions: [
      'What new papers are published on Bitcoin economics?',
      'What research touches on fee markets, storage costs, externalities?',
      'What blockchain data analysis tools or datasets are published?',
      'What papers could inform our model?'
    ]
  }
];

module.exports = RESEARCH_AGENTS;
