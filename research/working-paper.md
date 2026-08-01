# The Bitcoin Block Space Problem: Does the Fee Market Internalize Long-Term Storage Costs?

**BSAHI Working Paper — v2.0.0** (model-spec.json v2.0.0)
*Bitcoin Sahi Research Council · 2026-08-02*

---

## Abstract

Bitcoin's fee market allocates scarce block space among competing transactions. This paper asks a distinct empirical question: does the fee market *also* internalize the long-term resource costs imposed by permanently recorded blockchain data? We define a **Storage Cost Coverage Ratio (SCCR)** — the ratio of transaction fees paid to the estimated lifetime storage cost borne by full nodes — and measure it against live fee-history data. Across 158 sampled blocks, the average ratio is **0.1719**: fees cover roughly **17%** of the estimated 10-year replicated storage cost of an average block, and **100% of sampled blocks fall below the 1× threshold**. We reconcile two cost models that previously disagreed by 16.4×, document the correction transparently (model-spec.json v2.0.0), and present the framework as reproducible, falsifiable research — not a claim that Bitcoin is broken.

**Hypothesis:** Bitcoin's fee market efficiently allocates scarce block space, but may not fully internalize every long-lived resource cost created by confirmed transactions.

---

## 1. Introduction: Congestion Pricing vs. Permanence Cost

The one-sentence frame (full treatment in `problem_statement.md`):

> **Bitcoin's fee market prices competition for inclusion in the next block, but it does not explicitly price the long-term resource costs of permanently recorded blockchain data.**

The fee market solves a short-term optimization problem extremely well: during congestion, higher fees win block space. This is **congestion pricing**, with a horizon of roughly one block (~10 minutes). Storage cost is structurally different:

- **One-time payment** (the fee) vs. **recurring cost** (long-term replicated storage across the network)
- **Payer chooses** to pay vs. **node operators bear** the cost involuntarily
- **~10-min horizon** (next block) vs. **indefinite horizon** (data persists in blockchain history)

**Scope:** this paper measures the **storage leg** of a broader resource-pricing question. Bandwidth, validation, and UTXO-maintenance legs are future work (see §7).

## 2. What We're NOT Saying

- ❌ Not proposing a fix
- ❌ Not claiming the externality is economically significant at current volumes (it may not be)
- ❌ Not claiming the SegWit discount was a mistake (it solved transaction malleability)
- ❌ **Not arguing that Bitcoin is 'broken'** — the fee market solves block-space allocation well; whether it internalizes long-lived resource costs is an empirical question
- ✅ Just framing the question clearly and measurably

## 3. The SegWit Pricing Structure

SegWit (BIP 141, activated August 2017) introduced block weight: witness data counts **1 weight unit per byte**, non-witness data **4 weight units per byte**. This **4:1 discount** reduces the marginal block-space cost of witness-resident data relative to non-witness data. Years later, inscription protocols (Ordinals, BRC-20, Runes) took advantage of that pricing structure.

Two precise caveats (full treatment in `bip141_analysis.md`):
1. The discount applies to **all** witness data — SegWit financial transactions benefit identically. The "accident" is that it also subsidizes data-bearing constructions, not that SegWit was designed for them.
2. Whether the discount appropriately reflects the long-term resource costs of the data it makes cheaper is **part of the research question**, not a foregone conclusion.

## 4. The Model

### 4.1 Canonical specification

All quantities, units, and formulas live in **`research/model-spec.json` (v2.0.0)** — a single canonical source that every script imports. No script redefines a model constant.

| Quantity | Symbol | Units | Value | Source |
|---|---|---|---|---|
| Annual node cost | C | USD/year | 925 | `utxo_cost_model` component sum (924.35) rounded |
| Replication factor | N | nodes | 60,000 | estimate (TODO-bitcoin-oracle R2) |
| Storage horizon | T | years | 10 | assumption (archival retention) |
| Average block size | B_block | bytes | 1,500,000 | block_stats / fee_history |
| Blocks per year | R_blocks | blocks/yr | 52,596 | 365.25 × 24 × 6 |
| Total block bytes/yr | B_all_yr | bytes/yr | 7.8894e10 | B_block × R_blocks |
| **Cost per byte per year** | **cb** | USD/(byte·yr) | **1.17246e-8** | C / B_all_yr (block-average) |
| Lifetime storage cost/node/block | L | USD | 0.175869 | cb × B_block × T |
| Network lifetime cost/block | L_net | USD | 10,552 | L × N |
| **Storage Cost Coverage Ratio** | **SCCR** | dimensionless | **avg 0.1719** | fee_USD / L_net |

**Design principle:** `cb` is **horizon-free** (C / annual bytes). The horizon `T` enters **only** through `L = cb × B × T`. This corrects the v1.0.0 implementation, which applied `T` twice (see §6).

### 4.2 The marginal-inscription attribution (secondary)

The inscription-externality branch uses a **marginal attribution**: `cb_insc = C / (inscription bytes/yr) = 1.92573e-6` USD/(byte·yr). This differs from `cb` by a factor of **164.4×** — not an error, but two different denominators (all block bytes vs. inscription-only bytes). The paper headline uses the block-average `cb`; the marginal figure appears only in the inscription-externality analysis. The 16.4× figure reported in earlier versions was this 164× denominator gap **divided by** the 10× bug — see §6.

## 5. Findings

### 5.1 The Storage Cost Coverage Ratio

Measured from live `fee_history` captures (2026-08-01):

| Metric | Value (2026-08-01, 158 blocks) |
|---|---|
| Average SCCR | **0.1719** |
| Min / Max | ~0.031 / ~0.820 |
| Blocks below 1× | **100.0%** |

**Fee-regime dependence:** the ratio tracks the fee market. Re-measurements across the following days give average ratios in the **0.15–0.17 range** as fees move (e.g. 0.1559 on a lower-fee sample), always with **100% of blocks below 1×**. The headline is a *distribution over time*, not a point — see §7 (limitations).

**Interpretation:** transaction fees cover, on average, roughly **15–17%** of the estimated 10-year replicated storage cost of an average block across an assumed 60,000 full nodes. Every sampled block had fees below its estimated storage cost.

### 5.2 The inscription externality (marginal branch)

At 100,000 inscriptions/month (~400 bytes each, in witness):

| Metric | Value |
|---|---|
| Cost per byte per year (marginal) | 1.92573e-6 USD/(byte·yr) |
| Lifetime storage cost per inscription (10 yr) | $0.00770 |
| Annual unpriced externality at 100K/mo | ~$9,240 spread across all nodes |

**Pruning-consistency note:** this externality is structurally real but **not economically significant at current volumes** — per-node it is well under $1/year. The contribution of this paper is the reproducible ratio framework, not the magnitude. A future fee regime (sustained congestion, larger data-bearing volume) would change the magnitude while keeping the framework intact.

### 5.3 Sensitivity

`node tools/research/storage-ratio.js --sensitivity` (model-spec v2.0.0, fee sample avg 0.1559):

| Parameter | Value | Avg SCCR |
|---|---|---|
| Node cost | 600 / 925 / 1400 | 0.240 / 0.156 / 0.103 |
| Node count | 30K / 60K / 100K | 0.312 / 0.156 / 0.094 |
| Storage horizon | 5 / 10 / 15 yr | 0.312 / 0.156 / 0.104 |
| Avg block size | 1.0 / 1.5 / 2.0 MB | 0.156 (invariant) |

**Structural property:** SCCR is **invariant to block size** — `cb ∝ 1/B` while `L ∝ B`, so `B` cancels. This is not a bug; it reflects that fees and storage cost both scale with bytes.

## 6. Internal Validation and Reconciliation (v2.0.0)

Internal validation identified an inconsistency in the SCCR implementation, traced it to a **duplicated time-horizon term**, corrected the implementation, regenerated all reported values, and confirmed the qualitative conclusions unchanged.

**The bug:** methodology.json v1.0.0 and `storage-ratio.js` applied the horizon `T` twice — once dividing the denominator of `costPerBytePerYear` (`C / (B_all_yr / T)`) and again in the lifetime-cost product (`bytes × cb × T`). This inflated modeled storage cost — and deflated the ratio — by exactly **10×**.

**The correction:** `cb` is defined horizon-free (`C / bytes-per-year`); `T` enters only through `L = cb × B × T`. After correction:

| Quantity | Before (v1.0.0) | After (v2.0.0) |
|---|---|---|
| Cost per byte per year | 1.17247e-7 | **1.17247e-8** |
| Lifetime storage cost/node/block | $1.759 | **$0.176** |
| Network lifetime cost/block | $105,522 | **$10,552** |
| **Average SCCR** | 0.0172 | **0.1719** |
| Blocks below 1× | 100% | **100% (unchanged)** |

**The reconciliation:** the two cost models (`storage-ratio.js` and `utxo_cost_model.py`) disagreed by 16.4×. This decomposed as **164× denominator gap ÷ 10× bug = 16.4×**. The models measure different quantities (block-average vs. marginal-inscription attribution); the gap is documented, not erased. See `verification_appendix.md → Model Reconciliation (v2.0.0)`.

## 7. Limitations and Future Work

**Limitations:**
1. **Node count (60K) is an estimate**, not a census — actual full-node count varies widely (pruned vs. archival).
2. **Node costs are homogeneous** in the model; hardware/bandwidth/electricity vary by geography and operator.
3. **10-year horizon is an assumption**; pruning shortens actual retention, permanent storage extends it.
4. **Bandwidth cost of block propagation is excluded** from this leg.
5. **Marginal vs. average attribution** changes the headline by 164× — the choice is explicit and documented, not hidden.

**Future work (the resource-pricing program):**
- **UTXO leg:** capture `getblockstats → utxo_size_inc` (already produced by agent-06, currently dropped at DB write)
- **Bandwidth leg:** analytical bounds from block size × replication × $/GB
- **Validation leg:** Core benchmarks + node-cost literature with explicit uncertainty
- **Node distribution:** expand `node_geo` (currently 224 rows) for per-region cost distributions
- **BIP-110 pre/post measurement protocol** if activation is ever signaled

## 8. Conclusion

The fee market solves block-space allocation well — that is not in question. Whether it internalizes long-lived resource costs is an **open empirical question**, and this paper contributes the first reproducible measurement: a coverage ratio of **0.1719**, robust to a 10× implementation correction and a 16.4× attribution reconciliation, with 100% of sampled blocks below the 1× threshold.

We invite the community to reproduce, challenge, and extend this framework. All quantities derive from `research/model-spec.json` (v2.0.0); no script redefines a model constant. The data is live-captured and the measurement is continuous.

---

*Bitcoin Sahi Research Council — The Bitcoin Block Space Problem (Working Paper v2.0.0)*
*Component docs: problem_statement · bip141_analysis · pruning_externality_analysis · utxo_cost_note · verification_appendix · history-of-bitcoin*
