# Bitcoin Priority Oracle — Research Context

## Project Identity
- **Name:** Bitcoin Priority Oracle
- **Domain:** Bitcoin block space economics
- **Repo:** bitcoinsahi.com
- **Deployed URL:** bitcoinsahi.com (DNS pending)

## Domain Sources
### Primary Sources (fetch before answering)
- [mempool.space fees](https://mempool.space/api/v1/fees/recommended)
- [blockchain.info BTC price](https://blockchain.info/ticker)
- [blockchain.info UTXO count](https://blockchain.info/q/utxocount)
- [ordinals.com stats](https://ordinals.com/api/stats)
- [BIP-110 signaling](https://wickedsmartbitcoin.com/api/bip110)

### Community
- [r/BitcoinEngineering](https://reddit.com/r/BitcoinEngineering)
- [r/Bitcoin](https://old.reddit.com/r/Bitcoin/search?q=BIP-110&t=year)
- [r/BitcoinEngineering](https://old.reddit.com/r/BitcoinEngineering/search?q=fee+market+permanence&t=week)
- bitcoin-dev mailing list

### Related BIPs
- BIP-141 (SegWit) — the weight formula at the center of the question
- BIP-110 (Reduced Data Temporary Softfork) — consensus-level response
- BIP-337 (Compressed Transactions) — alternative data reduction path

## Research Checklist (do before every answer)
- [x] Fetch latest fee data from mempool.space
- [x] Check BIP-110 signaling status
- [x] Cross-reference against current model parameters
- [x] Update hypothesis if data contradicts current state
- [x] Commit any changes to repo

## State (2026-07-28)
- **All 3 research phases complete** — R1 (Reading), R2 (Cost Model), R3 (Problem Statement)
- **BIP-110 analyzed** — ~0.1% miner signaling, DOA. Michael Saylor called it "iatrogenic."
- **r/BitcoinEngineering discussion live** — /t/2750
- **Monetization plan** — Phase R4 in TODO: API tiers ($50–$500/mo), consulting, annual report
- **Domain ready** — bitcoinsahi.com, DNS not yet pointed
- **Pruned analysis completed** — Inscriptions are 0.91% of block space. Unavoidable cost: ~$2.53/yr/node. Negligible at current volumes.

## Key Numbers
- Node cost: $925/yr · Storage/inscription: $0.008 · Externality: $9.2K/yr
- Current fees: $0.06–$25 · Fee-to-storage ratio: 8×–3,000×

## Open Questions
1. Is the permanence externality economically significant enough to matter?
2. Does pruned node adoption eliminate the externality? (Answer: partially — unavoidable cost ~$2.53/yr/node)
3. If node operation becomes hobbyist-only in 10 years, does the externality argument collapse?

## Next Session
- Point bitcoinsahi.com DNS to GitHub Pages
- Run the economics simulator (Monte Carlo)

## Security (manual steps needed)
1. **Rotate Vercel token** — Go to vercel.com/account/tokens, create new, delete old
2. **Branch protection** — GitHub → Settings → Branches → Add rule for `main`: require PR + status checks
3. **Enable Dependabot** — GitHub → Insights → Dependency graph → Enable
4. **Signed commits** (optional) — GitHub → Settings → SSH and GPG keys
## Session Handoff — 2026-07-31T19:08:27.349Z

### Current State
- Session mood: neutral
- Active work: cycle 27 · bridge=on · M4 cleanCycles=4/7
- Forecast: holt-linear-trend · rising · rmse=1.145 (327 pts)

### Decisions Made
- M4 gate: cleanCycles=4/7 (no flip)

### Open Issues
- SPOOL: stale sources: block_height,block_interval,blockchair,blocks,btc_price,btc_rpc,coinpaprika,derived_metrics,difficulty,fear_greed,fee_history,fees,lightning,mempool,mempool_blocks,mining_pools,research_findings
- 1 endpoint unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · rising · regime=spike (327 pts)
- M4: 4/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-07-31T19:11:41.574Z

### Current State
- Session mood: neutral
- Active work: cycle 27 · bridge=on · M4 cleanCycles=3/7
- Forecast: holt-linear-trend · rising · rmse=1.145 (327 pts)

### Decisions Made
- M4 gate: cleanCycles=3/7 (no flip)

### Open Issues
- SPOOL: stale sources: block_height,block_interval,blockchair,blocks,btc_price,btc_rpc,coinpaprika,derived_metrics,difficulty,fear_greed,fee_history,fees,lightning,mempool,mempool_blocks,mining_pools,research_findings
- 2 endpoints unhealthy
- 17 sources stale (>30min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · rising · regime=spike (327 pts)
- M4: 3/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-07-31T20:03:30.982Z

### Current State
- Session mood: neutral
- Active work: cycle 28 · bridge=on · M4 cleanCycles=4/7
- Forecast: holt-linear-trend · rising · rmse=1.143 (328 pts)

### Decisions Made
- M4 gate: cleanCycles=4/7 (no flip)

### Open Issues
- SPOOL: stale sources: block_height,block_interval,blockchair,blocks,btc_price,btc_rpc,coinpaprika,derived_metrics,difficulty,fear_greed,fee_history,fees,lightning,mempool,mempool_blocks,mining_pools,research_findings
- DE SERVER: unhealthy
- 1 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · rising · regime=normal (328 pts)
- M4: 4/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-07-31T21:03:27.528Z

### Current State
- Session mood: neutral
- Active work: cycle 29 · bridge=on · M4 cleanCycles=5/7
- Forecast: holt-linear-trend · rising · rmse=1.144 (329 pts)

### Decisions Made
- M4 gate: cleanCycles=5/7 (no flip)

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- 1 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · rising · regime=normal (329 pts)
- M4: 5/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-07-31T22:18:32.745Z

### Current State
- Session mood: neutral
- Active work: cycle 30 · bridge=on · M4 cleanCycles=6/7
- Forecast: holt-linear-trend · stable · rmse=1.144 (330 pts)

### Decisions Made
- M4 gate: cleanCycles=6/7 (no flip)

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- 1 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (330 pts)
- M4: 6/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-07-31T23:23:47.236Z

### Current State
- Session mood: neutral
- Active work: cycle 31 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · rising · rmse=1.144 (331 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- ORCHESTRATOR: heartbeat 103 min ago
- 1 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · rising · regime=normal (331 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T01:03:48.998Z

### Current State
- Session mood: neutral
- Active work: cycle 32 · bridge=on · M4 cleanCycles=1/7
- Forecast: holt-linear-trend · stable · rmse=1.149 (332 pts)

### Decisions Made
- M4 gate: cleanCycles=1/7 (no flip)

### Open Issues
- ORCHESTRATOR: heartbeat 192 min ago
- 2 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (332 pts)
- M4: 1/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T01:59:32.234Z

### Current State
- Session mood: neutral
- Active work: cycle 33 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.151 (333 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- ORCHESTRATOR: heartbeat 252 min ago
- 2 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (333 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T03:22:17.673Z

### Current State
- Session mood: neutral
- Active work: cycle 34 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.151 (334 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- ORCHESTRATOR: heartbeat 313 min ago
- 1 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (334 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T04:47:39.859Z

### Current State
- Session mood: neutral
- Active work: cycle 36 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.151 (335 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- ORCHESTRATOR: heartbeat 420 min ago
- 2 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (335 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T05:34:23.854Z

### Current State
- Session mood: neutral
- Active work: cycle 37 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.155 (336 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- SPOOL: stale sources: block_interval,btc_rpc,derived_metrics,research_findings
- 2 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (336 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
