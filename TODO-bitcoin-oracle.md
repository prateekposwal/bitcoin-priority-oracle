# Bitcoin Block Space — Research TODO

## Phase R1: Reading ✅

- [x] Read BIP-141 rationale for witness discount (malleability vs state economics) → `research/bip141_analysis.md`
- [x] Read Moser, Eyal, Gün Sirer — covenant paper (FC 2017) → surveyed in bip141_analysis.md
- [x] Read Poelstra — CAT and Schnorr Tricks series → surveyed in bip141_analysis.md
- [x] Search Delving Bitcoin for "state expiry" threads → no active proposals since 2022
- [x] Search bitcoin-dev mailing list for UTXO growth discussions → periodic threads, no consensus

## Phase R2: UTXO Cost Function ✅

- [x] Estimate: what does it cost to run a full Bitcoin node per year? (HW + bandwidth + electricity) → `research/utxo_cost_model.py`, $925/yr
- [x] Calculate: how many bytes of UTXO data does the average inscription add? → ~400 bytes (100 vbytes)
- [x] Model: node cost / byte / year → $0.0000019/byte/yr, $0.008/inscription lifetime
- [x] Document: the SegWit weight formula's impact on inscription economics → `research/bip141_analysis.md`
- [x] Simulate: how UTXO set growth affects node operator costs → model handles 50K-300K/mo scenarios
- [x] Verification appendix with source links → `research/verification_appendix.md`
- [x] Live data fetch scripts → `research/fetch_inscription_stats.py`, `research/verify_inscription_size.py`

## Phase R3: Problem Statement ✅

- [x] Write a clear, concise problem statement (1 page max) → `research/problem_statement.md`
- [x] Publish as a research note (no solution, just the framing) → `research/problem_statement.md`
- [x] Share on Delving Bitcoin for feedback → https://delvingbitcoin.org/t/does-bitcoins-fee-market-price-permanence-or-just-congestion/2750
- [x] Write "Bitcoin can't price its own memory" LinkedIn post → `research/bitcoin_cant_price_its_own_memory.md`

## Monitoring

- [x] Subscribe to Bitcoin Optech newsletter
- [x] Follow Delving Bitcoin for "state expiry" discussions
- [x] Track bitcoin-dev mailing list for UTXO/state threads
- [x] Analyze BIP-110 (Reduced Data Temporary Softfork) — see bitcoin-oracle-arch.md
- [x] Watch covenant proposal discussions (CTV, APO, OP_VAULT, OP_CAT)
- [x] Note: BIP-110 validates our problem diagnosis. Our cost model provides the economic data BIP-110's rationale lacks.

## Phase R4: Contribution (if warranted)

- [ ] Only if feedback suggests a genuine gap exists
- [ ] Only if the problem can be addressed without consensus change (v1 principle)
- [ ] Only if the proposed mechanism survives incentive analysis

## Exploratory Directions

### Direction A: UTXO-Aware Relay Minimum Fee

- [ ] Write a patch for Bitcoin Core's `minrelaytxfee` to support state-density multipliers
- [ ] Define `state_density = (witness_size + output_script_size) / vsize`
- [ ] Write an economic model explaining why relay nodes would adopt this
- [ ] Simulate how the effective fee floor shifts at different adoption rates

### Direction B: BIP for State-Conscious Relay Policy

- [ ] Draft BIP defining `state_impact_score` metrics
- [ ] Engage with Bitcoin Optech, Delving Bitcoin, bitcoin-dev for feedback
- [ ] Provide wallet-side fee estimation guidance
- [ ] Reference implementation in Core fork or alternative node

### Direction C: Multi-Tier Relay Fee Market (Speculative)

- [ ] Explore only if A/B prove insufficient
- [ ] Requires P2P protocol changes and wallet routing logic

## Key Distinction (from Community Feedback)

The research hinges on one question that emerged from community feedback:

> **Is the "data permanence externality" a real, economically significant problem — or is the existing fee market sufficient?**

The fee market prices **congestion** (inclusion in the next block). It does not price **permanence** (lifetime storage in every full node's UTXO set). These are two different market failures.

| | Congestion pricing | Permanence cost |
|---|---|---|
| What it prices | Entry into the next block | Lifetime storage in every node |
| Who pays | Sender (once) | All future node operators (forever) |
| Time horizon | ~10 min (1 block) | Indefinite |
| Market failure | None — works well | Tragedy of the commons — no marginal cost signal |
| Handled by fee market? | ✅ Yes | ❌ No — unpriced externality |

**Open question:** Is the permanence externality significant enough to matter, or do most node operators run pruned nodes and not care about historical data?

## Open Questions

1. Does the SegWit weight formula need to be parameterized differently for data vs financial transactions?
2. Is state expiry viable for Bitcoin without soft fork?
3. Can covenant proposals reduce UTXO churn from inscriptions?
4. What would a "storage cost oracle" look like — and is it even possible without trust?
5. Is the "externality of data permanence" actually a problem with economic significance, or is the existing fee market sufficient?
