# Bitcoin Block Space — Open Research

We thought we had a solution. We were wrong. Twice.

## What Happened

We proposed a Priority Oracle (v1). The Bitcoin community on Reddit correctly identified that it doesn't survive contact with miner incentive structures. We pivoted to an Externality Fee concept (v2). Same result.

Both failures taught us something useful: **the question of whether Bitcoin's fee market prices the lifetime cost of permanent data storage is genuinely open.** Nobody has solved it. BIP-141 (SegWit) created a differential pricing mechanism by accident — it was designed for malleability, not state economics.

## Current Status

**This is not a solution. This is a research survey with a complete cost model.**

All 3 research phases are complete:
- **Phase R1 (Reading)**: BIP-141 analysis, covenant survey, Delving Bitcoin threads → [analysis](research/bip141_analysis.md)
- **Phase R2 (Cost Model)**: UTXO cost function with sensitivity analysis → [model](research/utxo_cost_model.py), [verification appendix](research/verification_appendix.md)
- **Phase R3 (Framing)**: Problem statement + community posts → [problem statement](research/problem_statement.md), [Delving Bitcoin discussion](https://reddit.com/r/BitcoinEngineering)

## Key Numbers

| Metric | Value |
|--------|-------|
| Annual full node operation cost | $925 (HW $167 + bandwidth $600 + electricity $158) |
| Cost per byte per year | $0.0000019 |
| Lifetime storage cost per inscription (10yr) | $0.008 |
| Unpriced externality at 100K inscriptions/mo | $9,200/yr spread across all nodes |
| Current fee range | $0.06 (low activity) to $25 (peak) |
| Fee-to-storage-cost ratio | 8× (low) to 3,000× (peak) |

## The Key Insight

The fee market prices **congestion** (space in the next block). It does **not** price **permanence** (lifetime storage in every full node's UTXO set). These are different market failures, and the SegWit weight formula was never designed as a state-pricing mechanism.

**Open question:** Is the permanence externality economically significant enough to warrant a protocol-level response?

## Contents

| File | What It Is |
|------|-----------|
| [Research survey](bitcoin-oracle-arch.md) | State expiry, UTXO pricing, SegWit discount, and relay policy open problems |
| [Cost model](research/utxo_cost_model.py) | Python model for UTXO cost function with adjustable parameters |
| [Verification appendix](research/verification_appendix.md) | Full source documentation for every model parameter |
| [Problem statement](research/problem_statement.md) | 1-page clear framing of the open question |
| [Delving Bitcoin discussion](https://reddit.com/r/BitcoinEngineering) | Live community thread |
| [Interactive page](interactive-block.html) | Visual landing page for the research |
| [TODO](TODO-bitcoin-oracle.md) | Research reading list and open questions |

## Community

- **Delving Bitcoin:** [does-bitcoins-fee-market-price-permanence-or-just-congestion/2750](https://reddit.com/r/BitcoinEngineering)
- **BIP-110:** [Reduced Data Temporary Softfork](https://github.com/bitcoin/bips/blob/master/bip-0110.mediawiki) — temporary 1-year soft fork banning inscriptions at consensus level. Shares our diagnosis, different prescription.
- **LinkedIn:** [Post with charts](https://www.linkedin.com/)

## Community Discussion

BIP-110 was proposed after our research began. It validates that the problem is real and being discussed at the protocol level. Our cost model provides the economic data BIP-110's rationale lacks — a shared factual basis for the debate.

## License

MIT
