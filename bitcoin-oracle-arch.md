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

The Bitcoin community on Reddit (r/CryptoTechnology) provided five critiques that fundamentally changed our understanding:

1. **"Everyone pays more to send info that can only make their transaction confirm slower"** — The logical contradiction in any priority scheme that doesn't change the underlying incentive structure.

2. **"Why would miners accept financial tx with lower fees over data ones with higher fees?"** — Miners are profit-maximizers. Any design requiring them to act otherwise is economically unsound.

3. **"If miners can audit, why declare anything?"** — Classification is pointless without trust. Bitcoin's security model eliminates trust — you can't reintroduce it at the classification layer.

4. **"Isn't this just how fees work already?"** — When the "solution" is indistinguishable from the existing mechanism, the problem wasn't properly identified.

5. **"Heavy AI use means you don't understand the fundamentals"** — The most painful and most useful critique. Writing about Bitcoin protocol design requires deep understanding, not plausible-sounding prose.

---

## The Actual Problem

The feedback surfaced a deeper question that we hadn't properly articulated:

> **Does Bitcoin's fee market price the lifetime cost of permanent data storage?**

The SegWit discount (BIP-141) was designed to fix transaction malleability — not to price state. It accidentally created a 4× discount for witness data, which made inscriptions economically viable at scale. But nobody designed this as a state-pricing mechanism. It was a side effect of a different design goal.

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
| Delving Bitcoin | https://delvingbitcoin.org/ |
| bitcoin-dev Mailing List | https://lists.linuxfoundation.org/pipermail/bitcoin-dev/ |
| Bitcoin Stack Exchange | https://bitcoin.stackexchange.com/ |

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

No more premature solutions. No more plausible-sounding architecture that doesn't survive contact with Bitcoin's incentive structure. Just honest research, documented publicly.

---

## License

MIT
