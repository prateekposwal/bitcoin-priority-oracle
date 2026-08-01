# History of Bitcoin — Research Note

A block-space-economics reading of Bitcoin's history. Every episode below is
selected for what it teaches about the pricing of block space, congestion, and
permanence — the axes BSAHI studies.

## Origins: the cypherpunk prehistory

- **David Chaum, DigiCash/ecash (1989)** — issuer-based blind-signature cash; anonymous but centralized. Failed commercially ("no banks wanted to sign on"). Lesson: centralized issuance killed ecash; Bitcoin's permissionless replicated state is what created the storage commons.
- **Dwork & Naor, "Pricing via Processing" (1992)** — computational puzzles as a price on resource use; the seed of proof-of-work.
- **Adam Back, Hashcash (1997)** — practical PoW for anti-spam; Satoshi cites it directly in §4.
- **Wei Dai, b-money (1998)** — first distributed digital cash; anonymous, PoW-issued.
- **Nick Szabo, bit gold (1998/2005)** — chained PoW as collectible scarcity; closest direct ancestor.
- **Hal Finney, RPOW (2004)** — reusable PoW tokens.

## Launch (2008-2009)

- **Oct 31 2008** — whitepaper posted to the cryptography mailing list.
- **Jan 3 2009** — genesis block (50 BTC) embeds the Times headline: "Chancellor on brink of second bailout for banks."
- **Jan 12 2009** — Hal Finney receives the first transaction (10 BTC).

## Early market (2010-2012)

- **May 22 2010 — Pizza Day**: 10,000 BTC ≈ $41 for two pizzas; first price ~$0.004.
- **Nov 28 2012 — Halving #1** (block 210,000): subsidy 50 → 25.

## The scaling debate → the forks (2015-2017) — the battle over block space

The single most important episode for BSAHI: the 1 MB block-size cap (a 2010
anti-DoS guardrail) became the first political economy of block space.

- **Big-block camp** (XT 8MB, Classic 2MB, Unlimited no-limit): block space isn't scarce; raise the cap and the fee market vanishes.
- **Small-block camp** (Core): block space stays scarce; the fee market funds security; scale on layer 2 (Lightning) and via SegWit.
- **Feb 2017 Hong Kong Agreement** (SegWit + 2MB) collapses within months.
- **May 2017 New York Agreement (SegWit2x)** — ~80% hash power signs; the 2MB half **canceled Nov 8 2017** — consensus, not hash power, decides.
- **SegWit (BIP 141) activates Aug 24 2017 (block 481,824)** — witness data at 1/4 weight → effective capacity 1→~4 MB without a hard fork. Designed for malleability (enabling Lightning); capacity was the real purpose; **state pricing was explicitly not** (BSAHI's bip141_analysis.md).
- **Aug 1 2017 — Bitcoin Cash splits** (8 MB blocks, later 32 MB) at block 478,558.
- **Nov 15 2018 — Bitcoin SV splits** BCH (128 MB blocks) — the fork of a fork.

Three chains, three answers to "how big should a block be."

## The halvings (subsidy → fee transition)

| Halving | Block | Date | Subsidy |
|---------|-------|------|---------|
| #1 | 210,000 | Nov 28 2012 | 50 → 25 |
| #2 | 420,000 | Jul 9 2016 | 25 → 12.5 |
| #3 | 630,000 | May 11 2020 | 12.5 → 6.25 |
| #4 | 840,000 | Apr 20 2024 | 6.25 → 3.125 |
| #5 (est) | 1,050,000 | ~2028 | 3.125 → 1.5625 |

#4 is the first halving where fees (inscriptions/Runes-driven) are a material
share of miner revenue — the subsidy→fee transition becomes visible in real time.

## 2021: Taproot, El Salvador, the $69K bull run

- **Taproot activates Nov 14 2021 (block 709,632)** — BIP 340 Schnorr, BIP 341 Taproot (MAST), BIP 342 Tapscript. Lowered per-input cost; enabled complex contracts; made future data-bearing outputs cheaper — which mattered once Ordinals arrived.
- **El Salvador: BTC legal tender Sept 7 2021** — the first national test.
- Cycle ATH ~$69K (Nov 2021); 2022 crash via Terra/3AC/FTX.

## 2023-2025: Ordinals, ETFs, Halving #4, six figures

- **Jan 2023 — Ordinals go live** (Casey Rodarmor): inscriptions embed data via `OP_FALSE OP_IF ... OP_ENDIF` in witness data, exploiting the 4× SegWit weight discount. BRC-20 (Mar 2023), Runes at the halving (Apr 2024). The storage externality becomes measurable in the fee market.
- **Jan 10 2024 — SEC approves 11 spot ETFs.** Demand-side institutional gateway that does not touch on-chain fees.
- **Apr 20 2024 — Halving #4** at block 840,000.
- **Dec 5 2024 — price crosses $100,000.**

## New research angles for BSAHI

1. **SegWit discount as history (F2)** — a dated narrative: 2017 malleability decision → 2023 inscriptions. The history IS the argument.
2. **Block-size limits as political economy** — a "who said what" timeline (XT/Classic/Unlimited/NYA/UASF) framed as competing claims about whether block space is priced resource or free utility.
3. **Subsidy vs fee share per halving era** — chart from block_stats (subsidy_btc, avg_fee_sats) across 2012/2016/2020/2024 windows. Testable prediction: inscriptions pushed fee share to a historical high post-2024.
4. **Permanence vs congestion historically** — Mt. Gox-era blocks (~1.5 KB, nearly empty) vs today's inscription-heavy blocks. Block composition over time (payments vs data vs settlement).
5. **Lightning's effect on the externality — refuted naïvely** — L2 increases per-payment on-chain cost ratio (channel opens/closes) while decreasing fee revenue; channel churn can worsen the externality.
6. **Fork economics as controlled experiment** — run the storage-ratio model against BCH (8-32 MB) and BSV (128 MB) data: their per-byte cost falls on fewer nodes, fee-per-byte collapses. Three-way comparison.
7. **The causal chain** — malleability fix → 4× weight discount → witness-as-data → Ordinals → fee pressure → storage externality materializes. The history explains why BSAHI's ratio (0.0149) exists.

_Research note — compiled from the History of Bitcoin (Wikipedia) and linked sub-articles, read in full._
