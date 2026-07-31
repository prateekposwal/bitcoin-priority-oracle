var CONFIG = {
  agent: {
    name: 'Data Engineer v1',
    cycleMinutes: 60,
    reportDir: 'reports/data-engineering',
    stateFile: 'captured-data/de-agent-state.json',
  },
  discovery: {
    enabled: true,
    searchIntervalHours: 24,
    maxNewSources: 5,
    sources: [
      { name: 'BitcoinOps', url: 'https://bitcoinops.org/en/newsletters/', type: 'newsletter' },
      { name: 'DelvingBitcoin', url: 'https://delvingbitcoin.org/', type: 'forum' },
      { name: 'BitcoinDevMailingList', url: 'https://lists.linuxfoundation.org/pipermail/bitcoin-dev/', type: 'mailinglist' },
      { name: 'MempoolSpace', url: 'https://mempool.space/api/v1/services', type: 'api-index' },
      { name: 'BlockstreamInfo', url: 'https://blockstream.info/api/', type: 'api' },
      { name: 'GitHubBitcoin', url: 'https://api.github.com/search/repositories?q=bitcoin+api&sort=updated', type: 'github' },
      { name: 'NerdVana', url: 'https://www.nerd.vana.com/', type: 'blog' },
    ],
  },
  integration: {
    enabled: true,
    stagingDir: 'captured-data/staging',
    maxRetries: 3,
    testBeforeDeploy: true,
  },
  monitoring: {
    checkIntervalMinutes: 15,
    freshnessMaxAgeMinutes: 30,
    staleAfterMinutes: 0,
    errorThreshold: 5,
    latencyWarningMs: 3000,
    reportOnFailure: true,
  },
  capture: {
    baseIntervalMinutes: 60,
    timeoutMs: 15000,
    degradedMultiplier: 2,
    recoveryMultiplier: 1.5,
    recoveryCycles: 2,
    maxMissedCycles: 3,
    mirror: true,
    bridge: true
  },
  reporting: {
    formats: ['markdown', 'json'],
    maxReportAge: 7,
    slackWebhook: null,
  },
  endpoints: [
    { key: 'fees', url: 'https://mempool.space/api/v1/fees/recommended', method: 'GET', category: 'fees', priority: 1, maxLatency: 2000 },
    { key: 'btc_price', url: 'https://mempool.space/api/v1/prices', method: 'GET', category: 'price', priority: 1, maxLatency: 2000 },
    { key: 'mempool', url: 'https://mempool.space/api/mempool', method: 'GET', category: 'mempool', priority: 1, maxLatency: 3000 },
    { key: 'mempool_blocks', url: 'https://mempool.space/api/v1/fees/mempool-blocks', method: 'GET', category: 'fees', priority: 2, maxLatency: 3000 },
    { key: 'fee_history', url: 'https://mempool.space/api/v1/mining/blocks/fees/24h', method: 'GET', category: 'fees', priority: 1, maxLatency: 5000 },
    { key: 'lightning', url: 'https://mempool.space/api/v1/lightning/statistics/latest', method: 'GET', category: 'lightning', priority: 2, maxLatency: 3000 },
    { key: 'blocks', url: 'https://mempool.space/api/blocks?limit=10', method: 'GET', category: 'blocks', priority: 2, maxLatency: 3000 },
    { key: 'block_height',    url: 'https://blockstream.info/api/blocks/tip/height', method: 'GET', category: 'blocks', priority: 2, maxLatency: 3000 },
    { key: 'coinpaprika',     url: 'https://api.coinpaprika.com/v1/coins/btc-bitcoin', method: 'GET', category: 'price', priority: 3, maxLatency: 5000 },
    { key: 'fear_greed',      url: 'https://api.alternative.me/fng/', method: 'GET', category: 'sentiment', priority: 3, maxLatency: 5000 },
    { key: 'blockchair',      url: 'https://api.blockchair.com/bitcoin/stats', method: 'GET', category: 'general', priority: 3, maxLatency: 5000 },
    { key: 'mining_pools',    url: 'https://mempool.space/api/v1/mining/pools/weekly', method: 'GET', category: 'mining', priority: 3, maxLatency: 5000 },
    { key: 'difficulty',      url: 'https://mempool.space/api/v1/difficulty-adjustment', method: 'GET', category: 'mining', priority: 2, maxLatency: 3000 },
  ],
};

function staleAfterMinutes() {
  if (CONFIG.monitoring.staleAfterMinutes > 0) return CONFIG.monitoring.staleAfterMinutes;
  return Math.max(2 * (CONFIG.capture.baseIntervalMinutes || CONFIG.agent.cycleMinutes || 60), 30);
}

if (typeof module !== 'undefined') module.exports = { CONFIG, staleAfterMinutes };
