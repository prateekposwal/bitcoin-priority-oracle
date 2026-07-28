# Bitcoin Can't Price Its Own Memory

**Or: What the SegWit discount accidentally taught us about state economics.**

Bitcoin's UTXO set is the network's memory. Every full node stores every UTXO from every transaction ever made. This is ~7,000 UTXOs today, growing at an accelerating rate thanks to inscriptions.

Here's the thing: **nobody pays for this storage.**

When you send a Bitcoin transaction, you pay a fee. That fee buys you **space in the next block** — about 10 minutes of congestion pricing. It does NOT buy you **space in every full node's UTXO set for the next decade**.

These are different products. The market prices one but not the other.

## By the numbers

- Running a full Bitcoin node costs ~$925/year (hardware, bandwidth, electricity)
- The average inscription adds ~400 bytes of data that every node must store forever
- The lifetime storage cost of a single inscription: less than one cent ($0.008)
- At 100,000 inscriptions per month, that's ~$9,200/year in uncompensated infrastructure

## The SegWit Discount

BIP-141 created a 4× weight discount for witness data. This was designed to fix transaction malleability — **not** to create differential pricing for state growth. It was an accident that the discount made inscriptions viable, and nobody has seriously asked whether the weight formula appropriately prices the cost of adding permanent state to the network.

## What this is NOT

This is not a call to change Bitcoin. It's not a proposal. It's not claiming the problem is urgent or even real.

It's just a question: **does the fee market price permanence, or only congestion?**

The answer determines whether there's a gap worth discussing. If the answer is "congestion only," then the externality exists — but whether it's economically significant is a judgment call the community needs to make.

## What's next

I've published the cost model and all source data. The next step is sharing the framing with the Bitcoin research community — Delving Bitcoin, bitcoin-dev, Optech — and seeing whether there's genuine interest in the question.

If you run a node, you're already paying this cost. How much does it bother you?

---

*Research repo: bitcoinsahi.com*
