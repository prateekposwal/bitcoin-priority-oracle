# Bitcoin Block Space — Research TODO

## Phase R1: Reading

- [ ] Read BIP-141 rationale for witness discount (malleability vs state economics)
- [ ] Read Moser, Eyal, Gün Sirer — covenant paper (FC 2017)
- [ ] Read Poelstra — CAT and Schnorr Tricks series
- [ ] Search Delving Bitcoin for "state expiry" threads
- [ ] Search bitcoin-dev mailing list for UTXO growth discussions

## Phase R2: Understanding

- [ ] Formalize: what would a "state pricing mechanism" for Bitcoin look like?
- [ ] Understand: why can't existing fee market handle data permanence costs?
- [ ] Map: which existing proposals touch on state pricing (even indirectly)
- [ ] Document: the design constraints any solution must satisfy

## Phase R3: Problem Statement

- [ ] Write a clear, concise problem statement (1 page max)
- [ ] Publish as a research note (no solution, just the framing)
- [ ] Share on Delving Bitcoin for feedback

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

## Open Questions

1. Does the SegWit weight formula need to be parameterized differently for data vs financial transactions?
2. Is state expiry viable for Bitcoin without soft fork?
3. Can covenant proposals reduce UTXO churn from inscriptions?
4. What would a "storage cost oracle" look like — and is it even possible without trust?
5. Is the "externality of data permanence" actually a problem with economic significance, or is the existing fee market sufficient?
