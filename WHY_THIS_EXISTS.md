# Why This Exists

*A one-page, plain-language introduction to Bitcoin Resource Accounting — the
questions behind the research. No equations. No jargon. Just the puzzle.*

---

Bitcoin has a market for its scarcest resource. Block space — the room in each
new block — is sold to the highest bidder, and the market works. When demand is
high, fees rise, and the people who value the space most get it. That is not the
problem. This is.

## The market that works

Block space is one scarce resource, and Bitcoin prices it well. That is a
remarkable thing — and it is the starting point, not the complaint.

But a confirmed transaction does not just occupy space in a block. It also gets
stored forever, on every node. It joins a ledger of who-owns-what that every
node must keep and check. It has to be validated, relayed, and backed up —
again and again, for as long as Bitcoin runs.

Those are real resources. They have real costs. And they are paid for by the
people who run Bitcoin, not by the transaction that created them.

## The question

Here is the whole question, in one sentence:

> **When someone pays a fee to put a transaction in a block, how much of the
> long-lived cost that transaction creates is actually covered by that fee?**

Everything in this program is an attempt to answer that question honestly — one
resource at a time. Storage first. State next. Validation, relay, and bandwidth
after that. Measured, not assumed.

## What this is not

- It is not an argument that Bitcoin is broken. Bitcoin works; the fee market
  allocates block space exceptionally well.
- It is not a proposal to change the protocol. No new rules, no new fees, no
  consensus changes — nothing here asks Bitcoin to be different.
- It is not a claim that anything is wrong. It is a proposal to measure.

## An invitation

If the measurements are wrong, help us improve them.
If the assumptions are wrong, show us why.
If the framework is useful, build on it.

This research is public, reproducible, and meant to be checked by anyone —
including the people who disagree with it. The questions are open. So is the work.
