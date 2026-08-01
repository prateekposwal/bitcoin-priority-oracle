# Bitcoin Priority Oracle — Research Context

## Core Operating Principle — NEVER CONFUSE WITH UNDONE WORK (Architect Mandate, 2026-08-01)

Every session in this repo MUST honor these load-bearing rules:

1. **DONE vs LEFT is mandatory.** Every report/status/plan ends with (a) a `DONE (verified)` list
   and (b) a `LEFT / TODO (verified)` list — explicitly labeled. Mixing done + pending without
   labels is a FAILURE.
2. **DONE means SHIPPED.** "Done" = verified AND committed/pushed/deployed/live. Uncommitted,
   unshipped, or not-live work goes in LEFT, never DONE.
3. **Pattern identification + gap filling.** When work is complete, scan for recurring patterns
   and structural gaps; propose or execute the fix that closes them. Do not stop at "task complete."

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
- Node cost: $925/yr · Storage/inscription: $0.0077 · Externality: $9.2K/yr
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
## Session Handoff — 2026-08-01T06:43:41.794Z

### Current State
- Session mood: neutral
- Active work: cycle 38 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.153 (337 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 13 endpoints unhealthy
- Data quality score below 60 (50)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (337 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T08:39:02.477Z

### Current State
- Session mood: neutral
- Active work: cycle 39 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.153 (337 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 13 endpoints unhealthy
- Data quality score below 60 (48)
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (337 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T09:49:47.024Z

### Current State
- Session mood: neutral
- Active work: cycle 40 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.153 (337 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 13 endpoints unhealthy
- Data quality score below 60 (48)
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (337 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T10:51:16.785Z

### Current State
- Session mood: neutral
- Active work: cycle 41 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.153 (337 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- SPOOL: stale sources: block_interval
- 10 endpoints unhealthy
- 1 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (337 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T11:50:52.076Z

### Current State
- Session mood: neutral
- Active work: cycle 42 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.152 (338 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 1 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (338 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T12:51:16.042Z

### Current State
- Session mood: neutral
- Active work: cycle 43 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · falling · rmse=1.152 (339 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 8 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · falling · regime=normal (339 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T14:01:27.644Z

### Current State
- Session mood: neutral
- Active work: cycle 44 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.152 (340 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 1 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (340 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T16:15:05.274Z

### Current State
- Session mood: neutral
- Active work: cycle 46 · bridge=on · M4 cleanCycles=1/7
- Forecast: holt-linear-trend · stable · rmse=1.155 (342 pts)

### Decisions Made
- M4 gate: cleanCycles=1/7 (no flip)

### Open Issues
- 6 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (342 pts)
- M4: 1/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T18:14:48.160Z

### Current State
- Session mood: neutral
- Active work: cycle 48 · bridge=on · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.156 (343 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- DE AGENT: last run 111 min ago
- 6 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (343 pts)
- M4: 0/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T19:15:17.808Z

### Current State
- Session mood: neutral
- Active work: cycle 49 · bridge=on · M4 cleanCycles=1/7
- Forecast: holt-linear-trend · stable · rmse=1.154 (345 pts)

### Decisions Made
- M4 gate: cleanCycles=1/7 (no flip)

### Open Issues
- 1 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (345 pts)
- M4: 1/7 clean cycles · bridgeFlipped=false
