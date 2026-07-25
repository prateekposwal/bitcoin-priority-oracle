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

That's it. Your wallet declares: "I'm financial" or "I'm data." Pools read it. Pools allocate.

**No consensus change. No soft fork. No hard fork. No oracle. No judge. No jury. No execution.**

Just 4 bytes of honesty.

> [Wait, that's actually clever. Explain how it works.](bitcoin-oracle-arch.md)

---

## What Happens Next

Pools split block space into two virtual pools:

| Pool | Minimum Floor | What Goes There |
|------|:------------:|-----------------|
| **Financial** | **30%** | Payments, Lightning, DeFi, settlements — stuff that needs *this block* |
| **Data** | 0% | Inscriptions, mints, cat JPEGs — stuff that can wait |

Each pool fills by fee-rate within its own class. Financial transactions compete with *financial* transactions. Data transactions compete with *data* transactions.

**The market finally differentiates between "I need this block" and "I'll be in the next one."**

> [See it in action — interactive demo](https://bitcoin-priority-oracle.vercel.app)
>
> [Read the full architecture (zero jokes, 100% technical)](bitcoin-oracle-arch.md)
>
> [What's left to build](TODO-bitcoin-oracle.md)

---

## What About Cheaters?

The pool doesn't blindly trust your 4 bytes. Every declared-"financial" transaction passes a **lightweight structural backcheck**:

- Witness size too large? Suspicious.
- Ordinal envelope detected? Override to DATA.
- Inscription-specific opcodes in outputs? Override to DATA.
- Input from a known inscriber address? You know the drill.

**First offense:** warning, tx downgraded to DATA allocation.
**Repeat offender:** rate-limited or blacklisted.

Honest wallets never hit the checks. Liars get caught by simple heuristics that cost nearly nothing to run.

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

- **4-byte OP_RETURN format:** Magic `0x7072` ("pr" = priority), version `0x01`, flags byte (bit 0: 0 = financial, 1 = data). Total overhead: ~10 vB with the output.
- **Allocation algorithm:** `min_financial = min(4M x 0.30, F_total)`. Remaining space split proportional to fee ratio. Math is in the [architecture doc](bitcoin-oracle-arch.md).
- **No consensus change required.** Pools opt in. Wallets opt in. The protocol stays exactly as Satoshi designed it.
- **Stratum v2 compatibility:** 3 new optional messages over the Template Distribution Protocol: `SetClassificationRules`, `ClassifiedTemplate`, `PriorityPreference`.

The README is funny. The idea is serious.

---

## License

MIT — because making Bitcoin better should be free.

*Built with coffee and a lot of staring at mempool.space*
