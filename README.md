# Bitcoin Sahi — Block Space Research & Decision Platform

**Live at [bitcoinsahi.com](https://bitcoinsahi.com)**

A research and decision platform for the Bitcoin block space economy. We translate network data into **clear decisions** for every participant: senders, exchanges, miners, node operators, researchers, and developers.

---

## What We Built

### For Users — 5 Live Pages

| Page | Purpose |
|------|---------|
| **Homepage** | Living fee visualization — 144-block bar chart, particles, weather, navigation |
| **Decide** (`/live`) | 7 persona tabs (Send, Lightning, Exchange, Node, Miner, Research, Developer) with Bitcoin Weather, Market Briefs, live data |
| **Learn** (`/learn`) | Block lifecycle storytelling — 5 animated chapters + architecture docs |
| **Capacity** (`/capacity`) | Network utilization dashboard — block weight, SegWit adoption, inflow rate, LN stats |
| **Fork Tracker** (`/fork-tracker`) | BIP-110 signaling tracker with Core30 explainer, node version info, scenario analysis |

### For Researchers — Data Infrastructure

| Component | Details |
|-----------|---------|
| **13 data sources** | mempool.space, Blockchair, CoinPaprika, Fear & Greed, Blockstream, our own Bitcoin Core node |
| **Data Engineering Agent** | Monitors all endpoints, discovers new sources (33 found), generates daily health reports |
| **5 Research Agents** | Bitcoin Core, Lightning, APIs, General, Academic — scanning GitHub, arXiv, forums every 4 hours |
| **Architect Notes** | Human feedback loop — insights written to `research/architect-notes.md` feed into agent cycles |
| **SQLite Database** | 640+ captures, queryable — `captured-data/bsahi.db` |
| **Bitcoin Core Node** | Syncing — will provide per-block fee percentiles via `getblockstats` |
| **Historical Sampler** | Sampling 960K blocks at intervals (2009-2026) using blockchain.info + mempool.space APIs |

### Key Research Finding

> **Storage Cost Coverage Ratio: 0.0149** — Current fees cover only ~1.5% of the estimated 10-year storage cost across 60,000 nodes. This is the first empirical evidence that Bitcoin's fee market does not price the storage externality.

Based on 148 blocks sampled over 24h. Full report: `reports/research/storage-ratio-YYYY-MM-DD.md`

---

## Architecture

```
Layer 1: Data Sources (13 endpoints + Bitcoin Core node)
Layer 2: Data Engineering Agent (monitoring, discovery, health reports)
Layer 3: Research Agents (5 specialists, 4h cycles, insight-driven)
Layer 4: Decision Engine (7 personas + Weather + Capacity + Fork Tracker)
```

---

## Running Processes

- DE Server: `localhost:3456` — health checks, research triggers, data status
- Backfill Runner: captures all 13 endpoints every 10 minutes
- Historical Sampler: samples blockchain history from 2009
- DB Writer: syncs capture files to SQLite
- Research Runner: 5 agents every 4 hours

---

## For Enterprise

We maintain private data feeds, historical access, custom integrations, and research consulting.

**Contact:** [prateek@block-space-economics.com](mailto:prateek@block-space-economics.com)

---

## Research Papers

| Paper | Status |
|-------|--------|
| [The Bitcoin Block Space Problem](research/problem_statement.md) | Published — defines the open question |
| [UTXO Storage Cost Model](research/utxo_cost_note.md) | Complete — $925/yr node cost, $0.0000019/byte/yr |
| [BIP-141 Analysis](research/bip141_analysis.md) | Complete — witness discount as unintended state subsidy |
| [Pruning Externality Analysis](research/pruning_externality_analysis.md) | Complete — theoretical externality exists but not economically significant |
| **Storage Cost Coverage Ratio** | First draft — contact for preprint |

---

## Development

```bash
# Dashboard
python3 telos/serve_dashboard.py

# Run research cycle
node tools/research/runner.js

# Generate storage ratio report
node tools/research/storage-ratio.js

# Add research insight
node tools/research/add-note.js "Section" "Your insight"

# Run all tests
PYTHONPATH=. python3 -m pytest tests/ -q
```

---

## License

MIT
