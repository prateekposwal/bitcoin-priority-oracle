Bitcoin's SegWit discount was designed to fix transaction malleability — not to create a pricing advantage for permanent data storage. But that's what it did.

Here's an uncomfortable question that came out of a research project I've been working on:

Does Bitcoin's fee market actually price what it costs to store data forever?

The answer appears to be: no. The fee market prices congestion (getting into the next block), not permanence (living in every full node's UTXO set for a decade).

I built a cost model using public data about node operation costs, inscription sizes, and the SegWit weight formula. The numbers:

→ Running a full node costs ~$925/year
→ The average inscription adds ~400 bytes that every node stores forever
→ The lifetime storage cost of a single inscription: less than one cent ($0.008)
→ The unpriced externality at current inscription volumes: ~$9,200/year spread across the network

Now here's the part I'm uncertain about: is this actually a problem?

The fee market works brilliantly for its designed purpose. $0.008 per inscription is tiny. ~$9K/yr across 50K+ reachable nodes is $0.18/node/year. Storage gets cheaper every year.

But the SegWit discount was never designed to price state. It was a malleability fix. The fact that it makes data inscriptions cheaper than financial transactions is an accident of history — not intentional protocol design.

I'm not proposing a fix. I don't know if one is needed. But I think the question itself — whether Bitcoin's fee market prices permanence or just congestion — is genuinely open and worth discussing.

I posted the full framing on Delving Bitcoin and the discussion is already surfacing exactly the right critiques (pruned node ratio, UTXO lifetime assumptions, whether the externality is actually priced in via opportunity cost). Come join the thread.

**Delving Bitcoin discussion:** https://delvingbitcoin.org/t/does-bitcoins-fee-market-price-permanence-or-just-congestion/2750

**Delving Bitcoin discussion:** https://delvingbitcoin.org/t/does-bitcoins-fee-market-price-permanence-or-just-congestion/2750\
**Full research and model:** bitcoinsahi.com

#Bitcoin #BitcoinResearch #BlockSpace #UTXO #SegWit
