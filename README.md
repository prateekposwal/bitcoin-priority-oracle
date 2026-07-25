# Bitcoin Has a 4 MWU Apartment. Your Inscription Is the Roommate Who Won't Pay Rent.

**And the solution is 4 bytes. Smaller than this sentence.**

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://bitcoin-priority-oracle.vercel.app)
[![Architecture](https://img.shields.io/badge/read-architecture-blue)](bitcoin-oracle-arch.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

---

## The Situation

Every 10 minutes, the entire global Bitcoin economy has a fire drill.

~4 million weight units. That's it. That's the whole block. A four-bedroom apartment for the entire world's settlement layer.

And right now, in that apartment:

- A $50M Lightning channel close is paying 200 sat/vB to get out *this block*
- A pixelated cat JPEG is paying 210 sat/vB because someone really wants you to see it
- A BRC-20 mint with 40,000 inputs is paying 180 sat/vB and taking up half the living room

**The market treats them identically. Highest fee-rate wins.**

A settlement that is worth *nothing* if it misses this block competes with an inscription that is worth the same amount next block, or next hour, or next Tuesday.

This is not a bug. This is a feature request.

---

## The "Someone Should Fix This" Hall of Fame

Since Ordinals dropped, people have proposed:

| Proposal | Problem |
|----------|---------|
| "Ban inscriptions" | Can't. Bitcoin is permissionless. |
| "Build a centralized oracle" | Who died and made you king? |
| "Soft fork OP_CAT" | See you in 2028. |
| "Just raise the block size" | *[50 comments locked, thread deleted]* |
| "Neural net classifier" | Bro it's a mempool not a self-driving car |

None of these require **zero consensus changes**. None of these are **stupidly simple**.

---

## The 4 Bytes That Change Everything

Here's what we did:

1. Spent 10 weeks designing a complex Stratum v2 plugin with classification engines, confidence scoring, and way too many architecture diagrams
2. Realized the wallet already knows what it's doing
3. Gave it **4 bytes** to say so

```
OP_RETURN 0x7072 0x01 0x00
// Magic  Ver   Tag (0=financial, 1=data)
```

That's it. Your wallet declares: "I'm financial" or "I'm data."

**But here's the v2 improvement: the pool doesn't trust you.** Every declaration is checked against structural fingerprints — witness ratio, ordinal envelope, runestone markers. If you declare "financial" but your tx has a 400KB witness with an ordinal envelope, you get reclassified. The liar gets the same outcome as telling the truth. So the game shifts from *"can you lie?"* to *"why would you bother?"*

**No consensus change. No soft fork. No hard fork. No oracle. No trust required.**

> [Wait, that's actually clever. Explain how it works.](bitcoin-oracle-arch.md)

---

## What Happens Next

Pools split block space via a **blind batch auction**:

| Pool | Minimum Floor | What Goes There |
|------|:------------:|-----------------|
| **Financial** | **30%** | Payments, Lightning, DeFi, settlements — stuff that needs *this block* |
| **Data** | 0% | Inscriptions, mints, cat JPEGs — stuff that can wait |

The remaining space is filled by highest-fee tx from either pool. The data premium emerges naturally from mempool pressure — zero during quiet periods, equilibrium during congestion. No hardcoded rates.

**The market finally differentiates between "I need this block" and "I'll be in the next one."**

> [See it in action — interactive demo](https://bitcoin-priority-oracle.vercel.app)
>
> [Read the full architecture (zero jokes, 100% technical)](bitcoin-oracle-arch.md)
>
> [What's left to build](TODO-bitcoin-oracle.md)

---

## What About Cheaters?

The pool doesn't trust your 4 bytes — it *verifies* them. Every declared-"financial" transaction passes a **lightweight structural backcheck** at template assembly time:

| Check | What it detects | Cost |
|-------|----------------|------|
| **Witness ratio** | `witness_size / vsize > 0.3` → data-like | O(1) |
| **Ordinal envelope** | `0x00 0x63 "ord" ... 0x68` in witness → DATA | O(witness size) |
| **Runestone marker** | `0x6a 0x5d` in outputs → DATA (if block ≥ 840K) | O(output count) |
| **Inscriber history** | Input from known inscriber → DATA | O(1) lookup |

**Why this works:** A liar gets reclassified before the template is built — same outcome as telling the truth. The game shifts from "can you lie?" to "why would you bother?" Honest wallets never hit the checks.

Pools can optionally share a lightweight bloom filter of repeat offenders. No central database, no privacy loss.

---

## The State of Things

| Component | Status |
|-----------|--------|
| Wallet OP_RETURN declaration spec | Complete |
| Allocation algorithm (30% floor + fee ratio) | Designed |
| Anti-abuse structural backcheck | Specified |
| Stratum v2 plugin message spec | Drafted |
| Interactive block simulator | [Live on Vercel](https://bitcoin-priority-oracle.vercel.app) |
| Architecture document | [Read it](bitcoin-oracle-arch.md) |
| **Rust wallet SDK** | **Not yet built** |
| **Go pool template assembler** | **Not yet built** |
| **Stratum v2 plugin implementation** | **Not yet built** |

---

## We Need: Rust/Go Devs Who Get Bitcoin

This is not a whitepaper. This is not a thinkpiece. This is a working repo with a spec, a demo, and an architecture doc that needs hands.

**What we need:**

- **Rust dev** — Build the BDK wallet plugin. Add a 4-byte OP_RETURN to every transaction. The spec is done.
- **Go dev** — Build the pool-side template assembler. The allocation algorithm is ~50 lines of math.
- **Anyone** — Think about the game theory. What happens at 30% adoption? 60%? 90%? When does this become a competitive necessity for pools?

**The 4 bytes are the easy part. The network effect is the hard part. That's why we build in public.**

```
# Start here:
gh repo fork prateekposwal/bitcoin-priority-oracle
# Or just:
gh issue create --repo prateekposwal/bitcoin-priority-oracle --title "I want to help"
```

[Fork this repo](https://github.com/prateekposwal/bitcoin-priority-oracle/fork)
[Open an issue](https://github.com/prateekposwal/bitcoin-priority-oracle/issues)
[Try the demo](https://bitcoin-priority-oracle.vercel.app)

---

## Serious Section (No Jokes)

This is a real project.

- **4-byte OP_RETURN format:** Magic `0x7072` ("pr" = priority), version `0x01`, flags byte (bit 0: 0 = financial, 1 = data). Total overhead: ~10 vB with the output. Gets pruned.
- **Structural backcheck:** Pool verifies declaration against witness ratio, ordinal envelopes, and runestone markers. Liars get reclassified at template assembly time — same outcome as telling the truth.
- **Allocation:** Blind batch auction — financial floor (30%) filled first, remaining space filled by highest-fee tx from either pool. Data premium emerges from mempool pressure, not a hardcoded rate.
- **No consensus change required.** Pools opt in. Wallets opt in. Non-adopting pools see zero change.
- **Works with Stratum v1 today.** v2 gets optional transparency tags as a bonus.

The README is funny. The idea is serious.

---

## License

MIT — because making Bitcoin better should be free.

*Built with coffee and a lot of staring at mempool.space*
