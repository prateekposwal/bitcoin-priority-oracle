# The Bitcoin Block Space Problem: A Frame

## One Sentence

**Bitcoin's fee market prices congestion (space in the next block) but not permanence (space in every full node's UTXO set for the lifetime of the output).**

## The Question

Does Bitcoin's fee market correctly price the lifetime cost of permanent data storage?

BIP-141 (SegWit) created a 4× weight discount for witness data. This was designed to fix transaction malleability — not to price state growth. The discount made inscriptions (Ordinals, Runes, BRC-20) economically viable at scale. An unintended side effect of a different design goal.

## What We Know

| Metric | Value |
|--------|-------|
| Annual node operation cost | ~$925 (HW + bandwidth + electricity) |
| Average inscription data | ~400 bytes (in witness, ~100 vbytes block weight) |
| Cost to store 1 byte for 1 year | ~$0.0000019 |
| Lifetime storage cost per inscription | ~$0.008 (10yr assumed UTXO life) |
| Unpriced externality at 100K/mo | ~$9,200/yr spread across all nodes |
| Current fee range | $0.06–$0.13 (low activity) to $5–50 (peak) |

## The Gap

The fee market works well for its designed purpose: allocating block space among competing transactions during congestion. A high-fee transaction gets confirmed faster. This is **congestion pricing**.

But storage cost is fundamentally different:
- **One-time payment** (fee) vs **recurring cost** (storage forever)
- **Payer chooses** to pay vs **node operators bear** the cost involuntarily
- **~10 min horizon** (next block) vs **indefinite horizon** (UTXO lives until spent)

The SegWit discount amplifies this: inscription data in witness pays 1/4 the weight of non-witness data, making it cheaper to add permanent state than to send a financial transaction.

## What We're NOT Saying

- ❌ Not proposing a fix
- ❌ Not claiming the externality is economically significant (it might not be)
- ❌ Not claiming the SegWit discount was a mistake (it wasn't — it solved malleability)
- ✅ Just framing the question clearly so it can be debated

## The Open Question

**Is the "data permanence externality" economically significant enough to warrant a protocol-level response?**

Arguments for "yes": Unpriced externalities lead to overconsumption. At scale, UTXO growth increases node operation costs. The SegWit discount was never designed as a state-pricing mechanism.

Arguments for "no": Most nodes are pruned. Storage is cheap and getting cheaper. The fee market already caps inscription volume during congestion. Node operators choose to run nodes.

This research provides the cost data. The community decides whether it matters.

## Next Step

Shared on Delving Bitcoin: https://delvingbitcoin.org/t/does-bitcoins-fee-market-price-permanence-or-just-congestion/2750

If the response suggests a genuine gap exists, explore relay-level policy responses (no consensus changes required).
