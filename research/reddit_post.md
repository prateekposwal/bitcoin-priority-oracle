# Does Bitcoin's fee market price permanence, or just congestion?

I've been researching a question that I think is genuinely open, and I'd love feedback from r/Bitcoin.

**The question:** Does Bitcoin's fee market correctly price the lifetime cost of permanent data storage?

## Background

BIP-141 (SegWit) created a 4× weight discount for witness data. This was designed to fix transaction malleability — not to price state growth. The discount made inscriptions (Ordinals, Runes, BRC-20) economically viable at scale. An unintended side effect of a different design goal.

## The numbers

I built an open-source UTXO cost model. Full code and verification at the link below.

| Metric | Value |
|--------|-------|
| Annual full node operation cost | ~$925 (HW + bandwidth + electricity) |
| Average inscription data | ~400 bytes (~100 vbytes in witness) |
| Cost per byte per year | ~$0.0000019 |
| Lifetime storage cost per inscription | ~$0.008 (10yr assumed) |
| Unpriced externality at 100K/mo | ~$9,200/yr spread across all nodes |
| Current fee range | ~$0.06–$0.13 (low activity) to $5–50 (peak) |

## The distinction

The fee market prices **congestion** — getting into the next block. It does NOT price **permanence** — living in every full node's UTXO set for years.

These are different:
- **Fee**: One-time payment → **Storage**: Recurring annual cost forever
- **Fee**: Payer chooses → **Storage**: All future node operators bear it involuntarily

## The caveats

- Most nodes are pruned (but archival nodes bear the full cost)
- $9K/yr across ~50K reachable nodes is ~$0.18/node/yr — negligible
- Storage gets cheaper every year
- During congestion, inscription fees rise naturally

## What this is NOT

Not a proposal. Not a BIP. Not claiming the problem is urgent. Just asking whether there's a gap worth discussing.

Discussion on Delving Bitcoin is already surfacing good critiques: https://delvingbitcoin.org/t/does-bitcoins-fee-market-price-permanence-or-just-congestion/2750

Full research with code and verification: https://bitcoinsahi.com
