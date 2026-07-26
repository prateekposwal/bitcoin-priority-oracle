# Bitcoin Block Space — Open Research

We thought we had a solution. We were wrong. Twice.

## What Happened

We proposed a Priority Oracle (v1). The Bitcoin community on Reddit correctly identified that it doesn't survive contact with miner incentive structures. We pivoted to an Externality Fee concept (v2). Same result.

Both failures taught us something useful: **the question of whether Bitcoin's fee market prices the lifetime cost of permanent data storage is genuinely open.** Nobody has solved it. BIP-141 (SegWit) created a differential pricing mechanism by accident — it was designed for malleability, not state economics.

## Current Status

**This is not a solution. This is a research survey.**

The repo now documents existing BIPs, research papers, discussion forums, and open questions. No new proposals. No architecture. No "disruptive innovation."

## Contents

| File | What It Is |
|------|-----------|
| [Architecture](bitcoin-oracle-arch.md) | Research survey of state expiry, UTXO pricing, and block weight open problems |
| [TODO](TODO-bitcoin-oracle.md) | Research reading list and open questions |

## License

MIT
