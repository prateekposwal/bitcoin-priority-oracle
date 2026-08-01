# Bitcoin Block Space: A Survey of Open Problems

## What We Thought We Knew

We started with a hypothesis: Bitcoin blocks have ~4 MWU. Financial transactions (payments, Lightning, DeFi) and data inscriptions (Ordinals, BRC-20, Runes) compete for the same space. The market treats them identically — highest fee-rate wins — despite fundamentally different time-value curves.

We proposed two solutions. Both were wrong.

| Version | Approach | Why It Failed |
|---------|----------|---------------|
| v1 | Priority Oracle — classify tx as financial/data, allocate 30% floor | Miners won't leave fees on the table. Voluntary classification with no economic consequence is a signaling game with zero equilibrium. |
| v2 | Externality fee — price the "true storage cost" of data permanence | Any formula-based fee is an arbitrary tax, not a market price. No mechanism exists to discover the "true cost" of a transaction to the network. |

---

## What the Community Taught Us


1. **"Everyone pays more to send info that can only make their transaction confirm slower"** — The logical contradiction in any priority scheme that doesn't change the underlying incentive structure.

2. **"Why would miners accept financial tx with lower fees over data ones with higher fees?"** — Miners are profit-maximizers. Any design requiring them to act otherwise is economically unsound.

3. **"If miners can audit, why declare anything?"** — Classification is pointless without trust. Bitcoin's security model eliminates trust — you can't reintroduce it at the classification layer.

4. **"Isn't this just how fees work already?"** — When the "solution" is indistinguishable from the existing mechanism, the problem wasn't properly identified.

---



## The Actual Problem

The feedback surfaced a deeper question that we hadn't properly articulated:

> **Does Bitcoin's fee market price the lifetime cost of permanent data storage?**

The SegWit discount (BIP-141) was designed to fix transaction malleability — not to price state. It accidentally created a 4× discount for witness data, which inscription protocols later took advantage of. But nobody designed this as a state-pricing mechanism. It was a side effect of a different design goal.

The question of whether Bitcoin's block weight formula appropriately prices state growth is **open**. No BIP, no soft fork, no academic paper has settled it. The question touches on:

- **UTXO set growth** — every inscription adds data that every full node must store forever
- **Block weight pricing** — the current weight formula was designed for malleability, not state economics
- **State expiry** — proposals to expire old UTXOs discussed since ~2020, no consensus
- **Covenants** — some covenant proposals could reduce UTXO churn but don't solve pricing

---

## Existing Research

### BIPs

| BIP | Title | Relevance |
|-----|-------|-----------|
| [BIP-141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki) | Segregated Witness | The only differential pricing mechanism Bitcoin has. Witness discount of 4× was designed for malleability, not state. |
| [BIP-110](https://github.com/bitcoin/bips/blob/master/bip-0110.mediawiki) | Reduced Data Temporary Softfork | Temporary 1-year soft fork banning inscriptions at consensus level. Limits witness data to 256 bytes, bans OP_IF/OP_NOTIF in Tapscripts. Uses 55% threshold. Same problem diagnosis, different prescription from our relay-pricing approach. |
| [BIP-119](https://github.com/bitcoin/bips/blob/master/bip-0119.mediawiki) | OP_CHECKTEMPLATEVERIFY | Covenant proposal enabling output-constrained spending. Most mature covenant BIP. |
| [BIP-347](https://github.com/bitcoin/bips/pull/1525) | OP_CAT | Re-enables concatenation. Combined with Schnorr, enables covenant constructions relevant to state management. |

### Research Papers

- **Enhancing Bitcoin Transactions with Covenants** — M. Moser, I. Eyal, E. Gün Sirer (Financial Cryptography 2017)
- **CAT and Schnorr Tricks** — Andrew Poelstra (blog, Blockstream Research)
- **SoK: Bitcoin Layer Two** — various (survey of L2 protocols)

### Discussion Forums

| Resource | URL |
|----------|-----|
| Bitcoin Optech Newsletter | https://bitcoinops.org/ |
| r/BitcoinEngineering | https://reddit.com/r/BitcoinEngineering |
| bitcoin-dev Mailing List | https://lists.linuxfoundation.org/pipermail/bitcoin-dev/ |
| Bitcoin Stack Exchange | https://bitcoin.stackexchange.com/ |

### Reference Architecture: CashTokens (Bitcoin Cash)

Bitcoin Cash's **CashTokens** (CHIP-2022-02, deployed May 2023) is worth studying as an alternative approach to on-chain tokens.

**How it differs from Ordinals:**
- Native token primitives at the consensus level — not an envelope hack
- NFT commitment limited to **40 bytes** per output
- No SegWit → no 4× witness discount artificially subsidizing data
- Token categories are known to the protocol — no classification needed

**What it validates:** The SegWit 4× witness discount is a significant enabler of inscription-related state growth. BCH has neither the discount nor the congestion — even with 32 MB blocks, usage is ~0.5% of capacity. The absence of an artificial data subsidy removes the economic incentive to spam.

**Limitations for Bitcoin:**
- CashTokens required a hard fork (not applicable to Bitcoin without consensus)
- BCH's 32 MB blocks mask whether token activity would create congestion under Bitcoin's block space constraints
- The 40-byte commitment limit is a protocol choice, not a technical necessity

### Key People to Follow

| Name | Work |
|------|------|
| Rusty Russell | State expiry, covenant design, Bitcoin Core |
| Gregory Maxwell | Original SegWit design, UTXO growth analysis |
| Pieter Wuille | SegWit, Taproot, UTXO commitments |
| Andrew Poelstra | Covenant math, script cryptography |
| Anthony Towns | Covenant design, BIP review |

### Search Terms

- State expiry
- UTXO commitment
- Block weight reform / SegWit discount adjustment
- Covenants (CTV, APO, OP_VAULT, OP_CAT, OP_TXHASH)
- UTXO fee market
- Inscription-related state growth

---

## What We're Doing Now

We're pivoting from "solution building" to **open research**. The repo now contains:

1. This survey of existing work — no new proposals, just documentation
2. A bibliography of relevant BIPs, papers, and discussions
3. An interactive visualization of the block weight / UTXO growth problem

No more premature solutions. Just honest research, documented publicly.

---

## Exploratory Directions

The research above identifies the problem but doesn't solve it. Below are three directions being explored. These are **sketches, not proposals** — they may fail the same way v1 and v2 did.

### Direction A: UTXO-Aware Relay Minimum Fee

**Mechanism:** Extend Bitcoin Core's existing `minrelaytxfee` so relay nodes can apply a **fee multiplier** for transactions that exceed a "state footprint" threshold. The multiplier is per-node and voluntary.

- Define `state_density = (witness_size + output_script_size) / vsize`
- Relay nodes set a threshold (e.g., `state_density > 0.5`) and a multiplier (e.g., 2× or 3×)
- Transactions above threshold need a higher fee rate to propagate through that node
- No consensus change — purely relay policy
- Miners unaffected — they mine whatever reaches them

**Why it could work:** Relay nodes bear storage costs → they can rationally price them. Existing practice (`minrelaytxfee`, ordinal filtering nodes) proves the mechanism. Avoids v1 mistake (no classification oracle — structural metrics, not semantic labels). Avoids v2 mistake (no formula tax — each node sets their own multiplier).

**Key risk:** Low adoption by relay node operators. Without critical mass, friction is too low.

### Direction B: BIP for State-Conscious Relay Policy

**Mechanism:** A BIP that standardizes what Direction A implements. Defines the metrics, recommends fee multipliers, and provides wallet-side fee estimation.

- BIP defines: `state_impact_score = f(witness_ratio, utxo_delta, output_script_complexity)`
- Recommends a tiered relay fee schedule
- Wallet authors implement fee estimation referencing the BIP
- Node operators implement relay policy referencing the BIP

**Why it could work:** BIPs are the standard Bitcoin improvement mechanism. A BIP provides a single reference point for wallet authors, node operators, and exchanges. Creates ecosystem alignment without requiring anyone to adopt. Documents existing practice (ordinal filtering nodes) and formalizes it.

**Key risk:** BIPs face high scrutiny and take time. But that scrutiny also ensures the mechanism survives incentive analysis.

### Direction C: Multi-Tier Relay Fee Market (Speculative)

**Mechanism:** Relay nodes advertise **tiered fee schedules** for different transaction classes during peer handshake. Wallets discover the cheapest relay path.

- New P2P message type for fee schedule advertisement
- Wallets query multiple relay nodes and select best price for their tx class
- Creates a genuine market for relay services

**Why speculative:** Requires P2P protocol changes and wallet routing logic. Higher complexity. Only worth exploring if A/B prove insufficient.

---

## Consensus Change Feasibility

This research does not propose any consensus change. However, if the problem it documents is significant enough, various levels of protocol change could be considered. This section maps what would be required for each potential approach, for reference only.

| Approach | Fork Type | Feasibility | Community Readiness |
|----------|-----------|-------------|---------------------|
| SegWit weight formula re-parameterization | **Soft fork** | Low (requires economic majority) | Not ready — problem not widely recognized |
| State expiry (UTXO pruning) | **Hard or soft fork** | Very low (complex, contentious) | Discussed since 2020, no consensus |
| Native token primitives (CashTokens-style) | **Hard fork** | Near-zero | Bitcoin explicitly rejects hard forks |
| Relay-level fee policy | **No fork** | High | Already exists informally (ordinal filtering nodes) |
| Fee estimator API / wallet-side heuristics | **No fork** | Very high | Works today, zero coordination needed |

**Constraint adopted by this research:** No document produced by this project shall propose a consensus change. All deliverables are problem framings, simulations, and open questions. Solutions belong to the community, not to this project.

---

## The Key Distinction: Congestion vs Permanence

The most productive criticism of this research came from a community member who argued:

> *"The fee market is frustratingly simple. You want to jump the queue, you pay. That's why it's so damn powerful."*
>
> *"I think you're trying to solve a problem that's already been solved."*

This critique forced a critical distinction that the research had been conflating:

| | **Congestion pricing** (the fee market) | **Permanence cost** (the externality) |
|---|---|---|
| What it prices | Entry into the next block (~10 min) | Lifetime storage in every full node (forever) |
| Who pays | Transaction sender (once) | All future node operators (distributed, unpriced) |
| Market failure | None — works as designed | **Tragedy of the commons** — no price signal for the externality |
| Handled by fee market? | ✅ Yes — "you want in, you pay" | ❌ No — the fee doesn't cover 20 years of node storage |

The fee market handles congestion. A $100/tx fee makes inscriptions uneconomical at scale. But the fee market does not price the lifetime cost of permanently storing that transaction's data in every future node's UTXO set. These are two separate market failures.

The open question, which this research has not settled: **is the permanence externality economically significant?** If most node operators run pruned nodes and don't maintain historical UTXO data, then the externality is theoretical and the fee market is sufficient. If UTXO growth from inscriptions creates material costs that push people off full nodes, there's a genuine market failure that the fee market doesn't address.

This research does not have a definitive answer. It documents the question.

---

## License

MIT
