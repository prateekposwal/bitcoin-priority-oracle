# Bitcoin Block Priority Oracle

A sidecar oracle + Stratum v2 plugin that classifies Bitcoin transactions as **financial** or **data** before block template assembly, enabling a two-tier priority fee market.

**No consensus change required.**

## Problem

Bitcoin blocks have ~4 MWU. Inscriptions (Ordinals, BRC-20, Runes) compete with financial transactions (payments, Lightning, DeFi) for the same space. The market treats them identically — highest fee-rate wins — despite fundamentally different time-value curves.

## Solution

Three components:

1. **Transaction Classifier** — Rule engine tags each mempool tx as FINANCIAL or DATA with confidence scoring
2. **Priority Fee Market** — Financial tx get minimum 30% block space; remainder split proportional to fee ratio
3. **Stratum v2 Plugin** — 3 new messages (`SetClassificationRules`, `ClassifiedTemplate`, `PriorityPreference`) over the Template Distribution Protocol

## Architecture

```
Mempool → Classifier → Financial Pool / Data Pool → Allocation Engine → Template → Stratum v2 → Miner
```

[Full architecture doc](bitcoin-oracle-arch.md)

## Status

Pre-production — architecture design phase. See [task list](TODO-bitcoin-oracle.md).

## License

MIT
