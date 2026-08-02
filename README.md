# Bitcoin Sahi — Block Space Research & Decision Platform

**Live at [bitcoinsahi.com](https://bitcoinsahi.com)**

**Research focus:** open research into *unpriced state storage* — whether Bitcoin's
fee market internalizes the long-lived resource cost (Storage Cost Coverage Ratio,
SCCR). v1 (priority oracle) and v2 (externality fee) are dead; this is the
research-first successor.

© 2026 Prateek Poswal. All rights reserved.
This repository is made publicly available for viewing and evaluation purposes only.
For licensing inquiries: [prateek@block-space-economics.com](mailto:prateek@block-space-economics.com)

---

## What this is

- **Research artifacts:** the SCCR framework, working paper, cost model, Monte
  Carlo bounds, node census — `research/`, `reports/research/`
- **A live data platform:** 17 monitored Bitcoin data endpoints (fees, mempool,
  blocks, hashrate, lightning, sentiment) captured 24/7 into a spool, mirrored to
  `data/*.json` for the static site
- **A decision/documentation layer:** `docs/decisions/`, `TODO-bitcoin-oracle.md`,
  AGENTS.md session handoffs

## Quick start

```bash
# Live SCCR measurement (the canonical headline number)
node tools/research/storage-ratio.js

# Derive/verify the model spec (checks L_net etc. recompute correctly)
node tools/research/derive-model.js

# Data-engineering test suites (schema envelope, spool, capture-agent)
node tools/data-engineering/test-envelope.js
node tools/data-engineering/test-spool.js
node tools/data-engineering/test-capture-agent.js
node tools/data-engineering/test-bridge.js
```

## Architecture (as built 2026-08-02)

```
Public APIs (mempool.space, blockstream, blockchair, coinpaprika, alternative.me)
   │  17 endpoints, concurrency=4, per-endpoint timeoutMs/maxLatency, Happy Eyeballs,
   │  fallbacks on the core fees/price/mempool series
   ▼
Data-engine agents (tools/data-engineering/) — capture → validate (schemas/) → spool → mirror
   │
   ├─ captured-data/spool/  (indexed history: fees, mempool, blocks…)
   ├─ captured-data/btc-rpc/ (local Bitcoin Core node, syncing — see decisions)
   └─ data/*.json           (rich public snapshot written by tools/agents/19-web-snapshot-agent.js)
   │
   ▼
Deployment: GitHub Pages (live) + local launchd agents + GH Actions fallback
```

### launchd agents (macOS)

| Agent | plist | Schedule | Purpose |
|---|---|---|---|
| Data engine | `com.bsahi.de-server.plist` | continuous | capture/validate/spool loop |
| Snapshot | `com.bsahi.snapshot.plist` | 30 min | write rich `data/*.json` + commit/push |
| Site health | `com.bsahi.site-health.plist` | hourly | route/latency checks |
| Ops health | `com.bsahi.ops-health.plist` | hourly | agent/capture health |
| Engagement | `com.bsahi.engagement.plist` | continuous | community/content pipeline |
| SCCR tracker | `com.bsahi.sccr-tracker.plist` | daily | automated SCCR time-series |

Install: `cp com.bsahi.*.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/<name>.plist`

### GitHub Actions

- `data-snapshot.yml` — every 30 min; regenerates `data/` from committed rich
  history (stub-writer bug fixed 2026-08-02; reads `data/fee_history.json`, never
  the 1-entry `tools/` stub). Requires `secrets.SNAPSHOT_PAT` (bypasses branch protection).
- `capture-data.yml`, `lighthouse.yml`, `research-monitor.yml`

## Key data contract

All surfaces read SCCR from `research/model-spec.json` (v2.0.1, canonical) and the
live value from `node tools/research/storage-ratio.js`. **Never hardcode the ratio.**
Historical figures (1.49% v1.0.0, ~17% v2.0.0 @N=60K, ~29% working-paper dated
snapshot) are documented provenance — superseded by the canonical live measurement.

## Known open issues

See `docs/known-issues.md`.

## Reproducibility

- Env secrets live in `.env` / `credentials*` (git-ignored): BTC RPC creds,
  Nostr keys, `SNAPSHOT_PAT`.
- Dead external sources are documented in `tools/data-engineering/config.js`
  (`deadSources`) — never re-add them.
- Full runbook: see AGENTS.md session handoffs (DONE/LEFT discipline).
