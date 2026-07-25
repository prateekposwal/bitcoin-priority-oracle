# Bitcoin Priority Oracle — Grant Applications

---

## 1. OpenSats

**Apply:** https://opensats.org/apply (page open)
**Criteria:** Good for Bitcoin, FOSS, Transparency & Education
**Amount to ask:** $10,000–$20,000 in BTC

### Application Draft

**Project Name:** Bitcoin Priority Oracle
**Website:** https://bitcoin-priority-oracle.vercel.app
**Source Code:** https://github.com/prateekposwal/bitcoin-priority-oracle
**License:** MIT

**One-line description:**
Wallet self-declaration protocol for a two-tier fee market on Bitcoin — no consensus change needed.

**Detailed description:**
Bitcoin blocks have 4 MWU of space. Financial transactions (payments, Lightning, DEX) and data inscriptions (Ordinals, BRC-20, Runes) compete for the same space with no way to signal urgency. A settlement is time-sensitive. An inscription is not — but the market treats them identically.

The Bitcoin Priority Oracle solves this by letting wallets self-declare their transaction type (financial/data) via a 4-byte OP_RETURN output. Mining pools optionally read this declaration at the template assembly layer and apply a minimum 30% allocation floor for financial transactions, with the remainder split by fee ratio between the two pools.

Key properties:
- No soft fork, hard fork, BIP, or consensus change of any kind
- Works with Stratum v1 today (no protocol change — pool-internal only)
- Zero false positives (wallet knows its own intent, no classifier oracle)
- Structural backcheck catches malicious declarations
- Data fee premium (~25%) gives pools a direct revenue incentive to adopt
- Live interactive demo deployed at bitcoin-priority-oracle.vercel.app

The project currently has a complete architecture specification (bitcoin-oracle-arch.md), an interactive block allocation simulator (interactive-block.html), and is ready for Phase 1 implementation (Rust SDK for wallet declaration).

**How it benefits Bitcoin:**
Creates a healthier fee market where time-sensitive financial transactions aren't crowded out by data inscriptions. This keeps Bitcoin useful for payments and Lightning while still allowing inscriptions — just with market-appropriate pricing. No censorship, no blocksize change, no fork.

**Budget request: $20,000 in BTC**

| Item | Amount | Details |
|------|--------|---------|
| Rust wallet SDK | $8,000 | Declaration library (OP_RETURN + annex methods), CI, tests |
| Pool adapter | $7,000 | Template assembly hook for Stratum v1 + v2 |
| Integration with 1 wallet | $3,000 | Reference integration (Sparrow/Electrum plugin) |
| Documentation + audit | $2,000 | Deployment guide, architecture docs, security review |

**Timeline:** 10 weeks

**Past work:**
- TELOS Cognitive Operating System: 20-axiom reasoning pipeline, 360/360 tests passing (github.com/prateekposwal/TELOS-CogOS)
- Interactive demo already deployed and functional

**Why me:**
I'm a protocol engineer who builds at the infrastructure layer. The Priority Oracle is my second major open-source project (after TELOS CogOS), and both demonstrate the ability to design, document, and ship working systems with formal reasoning.

---

## 2. Brink

**Website:** https://brink.dev (page open)
**Focus:** Engineering fellowships for Bitcoin Core and ecosystem contributors

### Notes
Brink is more focused on individuals contributing to Bitcoin Core itself (C++, consensus, p2p). The Priority Oracle is a higher-layer tool. You might be a better fit for their **Grant Program** (separate from fellowship) which funds ecosystem projects, or apply as a **Fellow** proposing work on Bitcoin Core's fee estimation, mempool policy, or Stratum v2 integration.

**Alternative angle for Brink:** Propose implementing the self-declaration protocol as a Bitcoin Core PR (BIP proposal + Core implementation of declaration reading). This would get you into Core-level work which is what Brink funds.

---

## 3. Spiral

**Website:** https://spiral.xyz (page open)
**Focus:** Funding Bitcoin open-source development (Jack Dorsey's fund)
**How to apply:** Typically via Twitter/X DM or email to grants@spiral.xyz

### Application Draft (Email)

**To:** grants@spiral.xyz
**Subject:** Grant application: Bitcoin Priority Oracle — wallet-driven fee market protocol

**Body:**

I'm building the Bitcoin Priority Oracle, an open-source protocol for a two-tier fee market on Bitcoin. Wallets self-declare transaction type (financial/data) via a 4-byte OP_RETURN. Mining pools optionally apply a minimum 30% financial floor at the template assembly layer. No consensus change needed.

The project is architecturally complete and partially implemented:
- Live interactive demo: bitcoin-priority-oracle.vercel.app
- Full architecture doc + code: github.com/prateekposwal/bitcoin-priority-oracle
- Next phase: Rust SDK, pool adapter, wallet integration
- Timeline: 10 weeks, budget: $20,000 in BTC

I also built TELOS, a 20-axiom Cognitive Operating System (360/360 tests passing).

Would love to discuss. Happy to provide more details.

---

> *Bitcoin Has a 4 MWU Apartment. Your Inscription Is the Roommate Who Won't Pay Rent.*
