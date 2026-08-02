# Bitcoin Block Space — Research Context

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
- **Name:** Bitcoin Block Space (Bitcoin Sahi)
- **Domain:** Bitcoin block space economics
- **Repo:** bitcoinsahi.com
- **Deployed URL:** bitcoinsahi.com (live, GitHub Pages — DNS pointed 2026-08-02)
- **Note:** v1 (priority oracle) and v2 (externality fee) are DEAD — refuted on Reddit for sound economic reasons. Successor is open research into unpriced state storage (SCCR). Never repoint anything to `bitcoin-priority-oracle`.

## Domain Sources
### Primary Sources (fetch before answering)
- [mempool.space fees](https://mempool.space/api/v1/fees/recommended)
- [blockstream.info](https://blockstream.info/api) — fee/blocks failover
- [blockchair.com](https://api.blockchair.com) — UTXO outputs proxy + redundancy
- [CoinPaprika BTC price](https://api.coinpaprika.com/v1/tickers/btc-bitcoin)

### Dead sources (DO NOT fetch — 404, documented in tools/data-engineering/config.js `deadSources`)
- ~~blockchain.info UTXO count~~ (404; proxied via blockchair outputs)
- ~~ordinals.com stats~~ (404; inscription stats via fetch_inscription_stats.py)
- ~~wickedsmartbitcoin BIP-110 signaling~~ (404, ~0.1% signaling, DOA)

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
- **Domain ready** — bitcoinsahi.com live on GitHub Pages (DNS pointed)
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
## Session Handoff — 2026-08-01T19:55:56.702Z

### Current State
- Session mood: neutral
- Active work: cycle 50 · bridge=on · M4 cleanCycles=2/7
- Forecast: holt-linear-trend · stable · rmse=1.152 (347 pts)

### Decisions Made
- M4 gate: cleanCycles=2/7 (no flip)

### Open Issues
- 2 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (347 pts)
- M4: 2/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T20:55:42.083Z

### Current State
- Session mood: neutral
- Active work: cycle 51 · bridge=on · M4 cleanCycles=3/7
- Forecast: holt-linear-trend · stable · rmse=1.15 (348 pts)

### Decisions Made
- M4 gate: cleanCycles=3/7 (no flip)

### Open Issues
- 3 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (348 pts)
- M4: 3/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T21:04:47.279Z

### Current State
- Session mood: neutral
- Active work: cycle 52 · bridge=on · M4 cleanCycles=4/7
- Forecast: holt-linear-trend · stable · rmse=1.152 (349 pts)

### Decisions Made
- M4 gate: cleanCycles=4/7 (no flip)

### Open Issues
- 2 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (349 pts)
- M4: 4/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T21:56:53.962Z

### Current State
- Session mood: neutral
- Active work: cycle 53 · bridge=on · M4 cleanCycles=5/7
- Forecast: holt-linear-trend · stable · rmse=1.15 (348 pts)

### Decisions Made
- M4 gate: cleanCycles=5/7 (no flip)

### Open Issues
- 3 endpoints unhealthy

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (348 pts)
- M4: 5/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T23:29:58.338Z

### Current State
- Session mood: neutral
- Active work: cycle 54 · bridge=on · M4 cleanCycles=6/7
- Forecast: holt-linear-trend · falling · rmse=1.151 (351 pts)

### Decisions Made
- M4 gate: cleanCycles=6/7 (no flip)

### Open Issues
- ORCHESTRATOR: heartbeat 104 min ago
- 13 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · falling · regime=normal (351 pts)
- M4: 6/7 clean cycles · bridgeFlipped=false
## Session Handoff — 2026-08-01T23:31:13.668Z

### Current State
- Session mood: neutral
- Active work: cycle 54 · bridge=off · M4 cleanCycles=7/7
- Forecast: holt-linear-trend · falling · rmse=1.151 (351 pts)

### Decisions Made
- **M4 COMPLETE**: bridge disabled at 2026-08-01T23:31:13.667Z after 7 clean cycles

### Open Issues
- ORCHESTRATOR: heartbeat 104 min ago
- 13 endpoints unhealthy

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · falling · regime=normal (351 pts)
- M4: 7/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T00:42:33.864Z

### Current State
- Session mood: neutral
- Active work: cycle 55 · bridge=off · M4 cleanCycles=7/7
- Forecast: holt-linear-trend · stable · rmse=1.15 (352 pts)

### Decisions Made
- M4 gate: cleanCycles=7/7 (no flip — already flipped)

### Open Issues
- ORCHESTRATOR: heartbeat 177 min ago
- 11 endpoints unhealthy
- 1 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (352 pts)
- M4: 7/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T01:43:48.124Z

### Current State
- Session mood: neutral
- Active work: cycle 56 · bridge=off · M4 cleanCycles=8/7
- Forecast: holt-linear-trend · stable · rmse=1.147 (354 pts)

### Decisions Made
- M4 gate: cleanCycles=8/7 (no flip — already flipped)

### Open Issues
- DE AGENT: last run 95 min ago
- ORCHESTRATOR: heartbeat 200 min ago
- 9 endpoints unhealthy
- 1 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (354 pts)
- M4: 8/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T02:46:56.963Z

### Current State
- Session mood: neutral
- Active work: cycle 57 · bridge=off · M4 cleanCycles=9/7
- Forecast: holt-linear-trend · stable · rmse=1.147 (354 pts)

### Decisions Made
- M4 gate: cleanCycles=9/7 (no flip — already flipped)

### Open Issues
- DE AGENT: last run 95 min ago
- ORCHESTRATOR: heartbeat 200 min ago
- 1 endpoints unhealthy
- 1 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (354 pts)
- M4: 9/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T04:16:23.191Z

### Current State
- Session mood: neutral
- Active work: cycle 58 · bridge=off · M4 cleanCycles=10/7
- Forecast: holt-linear-trend · stable · rmse=1.149 (355 pts)

### Decisions Made
- M4 gate: cleanCycles=10/7 (no flip — already flipped)

### Open Issues
- DE AGENT: last run 95 min ago
- ORCHESTRATOR: heartbeat 200 min ago
- 3 endpoints unhealthy
- 1 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (355 pts)
- M4: 10/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T05:20:10.222Z

### Current State
- Session mood: neutral
- Active work: cycle 59 · bridge=off · M4 cleanCycles=11/7
- Forecast: holt-linear-trend · stable · rmse=1.148 (356 pts)

### Decisions Made
- M4 gate: cleanCycles=11/7 (no flip — already flipped)

### Open Issues
- DE AGENT: last run 95 min ago
- ORCHESTRATOR: heartbeat 200 min ago
- 1 endpoints unhealthy
- 2 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (356 pts)
- M4: 11/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T06:26:21.811Z

### Current State
- Session mood: neutral
- Active work: cycle 60 · bridge=off · M4 cleanCycles=12/7
- Forecast: holt-linear-trend · stable · rmse=1.147 (357 pts)

### Decisions Made
- M4 gate: cleanCycles=12/7 (no flip — already flipped)

### Open Issues
- DE AGENT: last run 95 min ago
- ORCHESTRATOR: heartbeat 200 min ago
- 1 endpoints unhealthy
- 2 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (357 pts)
- M4: 12/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T07:02:40.497Z

### Current State
- Session mood: neutral
- Active work: cycle 61 · bridge=off · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.146 (358 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 13 endpoints unhealthy
- Data quality score below 60 (40)
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (358 pts)
- M4: 0/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T08:04:28.222Z

### Current State
- Session mood: neutral
- Active work: cycle 62 · bridge=off · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.145 (359 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 1 endpoints unhealthy
- Data quality score below 60 (28)
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (359 pts)
- M4: 0/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T08:41:09.363Z

### Current State
- Session mood: neutral
- Active work: cycle 63 · bridge=off · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.143 (360 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (360 pts)
- M4: 0/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02 (data-pipeline fix — Order 3)

### Current State
- Session mood: fixed
- Data pipeline: **Quality 98/100** (latest report 2026-08-02) · **17/17 endpoints healthy** · error rate <4% (healthy) · transient error-count deductions on raw_block_tip/mempool/lightning age out within ~12 rounds
- DE agent: restarted under launchd with new code · cycle 64 ran clean · endpoints=17 (was 13)
- Active work: pipeline restored to full health + block-data capture completed

### What was broken (root causes, all verified)
1. **IPv6 black-hole (the big one)** — Node 17+ defaults to IPv6; blockstream.info, api.blockchair.com, api.alternative.me black-hole IPv6 (packets dropped). curl falls back to IPv4, node hung. FIX: `autoSelectFamily: true` (Happy Eyeballs — races v4/v6). Verified: v6 hangs, v4 works, and vice-versa depending on the host/day; Happy Eyeballs handles both.
2. **Timeout conflation** — `maxLatency` doubled as health threshold AND fetch timeout (`maxLatency+2000` = 5–7s). Heavy endpoints verified at 13–28s when healthy (mining_pools weekly, mempool_recent, raw block). FIX: decoupled `timeoutMs` (hard fetch bound) from `maxLatency` (health bound); per-endpoint realistic values; `retries` per endpoint.
3. **Unbounded concurrency** — `Promise.all` fired all endpoints at once (8–13 simultaneous to mempool.space) → CDN throttle cascades. FIX: bounded pool (4 concurrent).
4. **3 passes per cycle** — getDataQualityScore ran 3 full endpoint rounds per hourly cycle. FIX: single-pass (reuse the cycle's health round).
5. **Stale pre-fix error history** — window was 100% pre-fix artifacts (36% error rate). Archived to `monitor-error-history.pre-fix.bak.json`, window reset.

### What was added (full block data capture — gaps closed)
- **block_hash** — tip header hash (blockstream) — new endpoint + schema `capture.block_hash@1.0`
- **raw_block_tip** — FULL raw block of the tip (~1.2–2.8 MB), chained fetch (tip hash → raw) — new endpoint + schema `capture.raw_block_tip@1.0`
- **hashrate** — 24h network hashrate series — new endpoint + schema `capture.hashrate@1.0`
- **mempool_recent** — tx-level mempool snapshot (txid/fee/vsize/value per tx) — new endpoint + schema `capture.mempool_recent@1.0`
- Protocol docs: `docs/protocols/{block_hash,raw_block_tip,hashrate,mempool_recent}.md`
- Dead external sources documented in config (`deadSources`): blockchain.info utxocount (404), ordinals.com stats (404), wickedsmartbitcoin BIP-110 (404) — each with an equivalent replacement.
- Capture-agent: chained-fetch support for raw_block_tip; Bitcoin Core node confirmed running (639K blocks, fee percentiles).

### Tests
- DE suite: test-envelope 15/15 · test-spool 17/17 · test-bridge 4/4 · test-capture-agent 6/6 (all green)
- Full capture cycle: 17/17 captured, 0 errored, 0 violated, 0 refused
- Daily report: **Quality 100/100, Issues: None** · site snapshot regenerated cleanly

### Metrics
- DI: 1.000 | MD: 0.000
- Quality: 98/100 (freshness 30 · reliability 30 · latency 20 · coverage 20) — latest report 2026-08-02; the post-fix run hit 100/100, current report shows 98/100 (transient error-count deductions)

### LEFT / TODO
- Monitor error window will fully age out the 2 raw_block_tip slow-round entries within ~12 rounds (already <4% error rate — healthy).
- (optional) Promote the new endpoints into `research/model-spec.json` consumers / fee-forecast inputs.
- (optional) Wire raw_block_tip into the R5 storage-ratio pipeline (per-block size verification from raw bytes).
## Session Handoff — 2026-08-02T09:50:39.396Z

### Current State
- Session mood: neutral
- Active work: cycle 64 · bridge=off · M4 cleanCycles=0/7
- Forecast: holt-linear-trend · stable · rmse=1.141 (362 pts)

### Decisions Made
- *(No decisions recorded)*

### Open Issues
- - None

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (362 pts)
- M4: 0/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T11:51:28.738Z

### Current State
- Session mood: neutral
- Active work: cycle 66 · bridge=off · M4 cleanCycles=2/7
- Forecast: holt-linear-trend · stable · rmse=1.138 (364 pts)

### Decisions Made
- M4 gate: cleanCycles=2/7 (no flip — already flipped)

### Open Issues
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (364 pts)
- M4: 2/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T12:51:27.109Z

### Current State
- Session mood: neutral
- Active work: cycle 67 · bridge=off · M4 cleanCycles=3/7
- Forecast: holt-linear-trend · stable · rmse=1.138 (365 pts)

### Decisions Made
- M4 gate: cleanCycles=3/7 (no flip — already flipped)

### Open Issues
- 1 sources stale (>120min old)

### Metrics
- Quality: healthy
- Forecast: holt-linear-trend · stable · regime=normal (365 pts)
- M4: 3/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02T13:51:19.499Z

### Current State
- Session mood: neutral
- Active work: cycle 68 · bridge=off · M4 cleanCycles=4/7
- Forecast: holt-linear-trend · stable · rmse=1.138 (364 pts)

### Decisions Made
- M4 gate: cleanCycles=4/7 (no flip — already flipped)

### Open Issues
- DE AGENT: last run 1294 min ago
- 1 sources stale (>120min old)

### Metrics
- Quality: degraded
- Forecast: holt-linear-trend · stable · regime=normal (364 pts)
- M4: 4/7 clean cycles · bridgeFlipped=true
## Session Handoff — 2026-08-02 (pre-publication execution plan)

### Current State
- Session mood: focused
- Active work: SCCR paper pre-publication execution plan (all 5 phases) — COMPLETE

### Decisions Made
- Paper renamed → **"Storage Cost Internalization in Bitcoin's Fee Market"** (program subtitle: The Bitcoin Block Space Problem); applied across working-paper.md/.html/.tex, README, publication-plan.
- Reproduction kit created (`research/reproduce/`): frozen input capture, Python + C implementations, cross-check script — **all three implementations (JS/Python/C) verified agreeing** (avg 0.2186, 171 blocks, per-block max diff 5e-7). The C implementation did NOT exist before this session despite the paper claiming "three independent implementations" — gap closed.
- Live SCCR dashboard + static API built: `tools/research/sccr_live.py` → `data/sccr.json|sccr_latest.json|sccr_history.json` (serving /sccr/latest, /sccr/history until R5-gated backend); wired into snapshot agent (19) + GH Actions fallback; learn.html live dashboard section added.
- Reviewer fixes F1–F8 applied to working-paper.md (efficient-markets objection, 1×-descriptive note, live connection counts, cost-trend limitation, two-sided framing, citation fixes, novelty sharpening, point-in-time language).
- Literature audit verified Liu et al. 2021 (closest prior) + Aronoff et al. 2026 (title in paper was WRONG — fixed to "A Model and Estimation of the Bitcoin Transaction Fee"); no prior reproducible fee-to-resource metric found in searched sources.
- LaTeX source `research/working-paper.tex` produced (compilable skeleton, 8 tables, references; pdflatex NOT available on dev machine — flagged).
- License: MIT (code) + CC BY 4.0 (paper) drafted in `research/license-draft.md`; LICENSE file NOT changed (needs Prateek ratification).
- Author identity recommendation: **Prateek Poswal, Independent Researcher** (`research/author-identity.md`); ORCID signup steps included.

### Open Issues
- **DECISIONS NEEDED (Prateek):** arXiv account, ORCID iD, author identity ratification (default: Independent Researcher), license ratification (default: MIT+CC BY 4.0). See DECISIONS section of the execution report + research/author-identity.md + research/license-draft.md.
- External reproduction (someone uninvolved) — Prateek's task; protocol + log in `research/reproduce/`.
- LaTeX needs a compile pass on a machine with pdflatex (toolchain absent locally).
- Companion note `archival-vs-pruned-note.md` still awaiting Prateek review before it ships.

### Metrics
- Validation: `node tools/validate.js` ✅ PASS (0 errors)
- Reproduction: 3/3 implementations agree (0.2186, 171 blocks, 100% below 1×)
- Live SCCR at session end: 0.2151 (169 blocks — rolling 24h window)
