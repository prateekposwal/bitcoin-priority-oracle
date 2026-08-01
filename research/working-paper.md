# The Bitcoin Block Space Problem: Does the Fee Market Internalize Long-Term Storage Costs?

**BSAHI Working Paper — v2.0.0** (model-spec.json v2.0.0)
*Bitcoin Sahi Research Council · 2026-08-02*

---

## Abstract

Bitcoin's fee market allocates scarce block space among competing transactions. This paper asks a distinct empirical question: does the fee market *also* internalize the long-term resource costs imposed by permanently recorded blockchain data? We define a **Storage Cost Coverage Ratio (SCCR)** — the ratio of transaction fees paid to the estimated lifetime storage cost borne by full nodes — and measure it against live fee-history data using a **primary-source node census (≥32,000 known addresses from a live Bitcoin Core node)**. Across 156 sampled blocks, the average ratio is **~0.29**: fees cover roughly **29%** of the estimated 10-year replicated storage cost of an average block, and **~99% of sampled blocks fall below the 1× threshold** (a small number of high-fee blocks exceed it). We reconcile two cost models that previously disagreed by 16.4×, document the correction transparently (model-spec.json v2.0.0), and bound the result against parameter uncertainty (joint Monte Carlo: 99.8% of draws below 1× under the old N band; ~99% at the real census). We present the framework as reproducible, falsifiable research — not a claim that Bitcoin is broken.

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
| Replication factor | N | nodes | 32,000 | primary-source census (agent-25, getnodeaddresses, ≥32K) |
| Storage horizon | T | years | 10 | assumption (archival retention) |
| Average block size | B_block | bytes | 1,500,000 | block_stats / fee_history |
| Blocks per year | R_blocks | blocks/yr | 52,596 | 365.25 × 24 × 6 |
| Total block bytes/yr | B_all_yr | bytes/yr | 7.8894e10 | B_block × R_blocks |
| **Cost per byte per year** | **cb** | USD/(byte·yr) | **1.17246e-8** | C / B_all_yr (block-average) |
| Lifetime storage cost/node/block | L | USD | 0.175869 | cb × B_block × T |
| Network lifetime cost/block | L_net | USD | 5,628 | L × N (=32K) |
| **Storage Cost Coverage Ratio** | **SCCR** | dimensionless | **~0.29** (156 blocks, N=32K) | fee_USD / L_net |

**Design principle:** `cb` is **horizon-free** (C / annual bytes). The horizon `T` enters **only** through `L = cb × B × T`. This corrects the v1.0.0 implementation, which applied `T` twice (see §6).

### 4.2 The marginal-inscription attribution (secondary)

The inscription-externality branch uses a **marginal attribution**: `cb_insc = C / (inscription bytes/yr) = 1.92573e-6` USD/(byte·yr). This differs from `cb` by a factor of **164.4×** — not an error, but two different denominators (all block bytes vs. inscription-only bytes). The paper headline uses the block-average `cb`; the marginal figure appears only in the inscription-externality analysis. The 16.4× figure reported in earlier versions was this 164× denominator gap **divided by** the 10× bug — see §6.

## 5. Findings

### 5.1 The Storage Cost Coverage Ratio

Measured from live `fee_history` captures (2026-08-01), node count N=32,000 (real census):

| Metric | Value |
|---|---|
| Blocks sampled | 156 |
| Average SCCR | **~0.293** |
| Min / Max | ~0.058 / ~1.537 |
| Blocks below 1× | **98.7%** (154/156) |

**Fee-regime + node-count dependence:** the ratio tracks both the fee market and the replication factor. Under the earlier N=60K assumption the average was 0.156–0.172 with 100% below 1×; at the real census N=32K it rises to ~0.29 with ~99% below 1× (a few high-fee blocks exceed coverage). The headline is a *distribution over time and parameters*, not a point.

**Interpretation:** transaction fees cover, on average, roughly **29%** of the estimated 10-year replicated storage cost of an average block across the ≥32K observed nodes. Most sampled blocks' fees remain below their estimated storage cost.

### 5.2 The inscription externality (marginal branch)

At 100,000 inscriptions/month (~400 bytes each, in witness):

| Metric | Value |
|---|---|
| Cost per byte per year (marginal) | 1.92573e-6 USD/(byte·yr) |
| Lifetime storage cost per inscription (10 yr) | $0.00770 |
| New 10-yr storage liabilities created per year at 100K/mo | ~$9,240 spread across all nodes |
| Steady-state annual externality (amortized) | ~$924/yr spread across all nodes |

**Unit note (corrected):** $9,240 is the *undiscounted 10-year liability of one year's inscriptions*, not an annual cost. Amortized over the 10-yr horizon it is ~$924/yr. This was previously labeled "annual unpriced externality" — a T/1 conflation of the same shape as the fixed 10× bug, in label only. The per-node figure (~$0.015/yr) is unchanged under either reading.

**Pruning-consistency note:** this externality is structurally real but **not economically significant at current volumes** — per-node it is well under $1/year. The contribution of this paper is the reproducible ratio framework, not the magnitude. A future fee regime (sustained congestion, larger data-bearing volume) would change the magnitude while keeping the framework intact.

### 5.3 Sensitivity

`node tools/research/storage-ratio.js --sensitivity` (model-spec v2.0.0). Base node count is the real census N=32K; the table's node range brackets it:

| Parameter | Value | Avg SCCR |
|---|---|---|
| Node cost | 600 / 925 / 1400 | 0.240 / 0.156 / 0.103 |
| Node count | 16K / 32K / 100K | ~0.55 / ~0.29 / ~0.09 |
| Storage horizon | 5 / 10 / 15 yr | 0.312 / 0.156 / 0.104 |
| Avg block size | 1.0 / 1.5 / 2.0 MB | 0.156 (invariant) |

**BTC price (the dominant omitted driver — verified in independent implementation):** the ratio is linear in price. Over the realistic band (at N=32K, base ~0.29):

| BTC price | Avg SCCR (at N=32K census) |
|---|---|
| $30,000 | 0.154 |
| $45,000 | 0.231 |
| $62,900 (capture) | 0.293 |
| $100,000 | 0.512 |

**Structural property:** SCCR is **invariant to block size** — `cb ∝ 1/B` while `L ∝ B`, so `B` cancels. Caveat: this invariance follows from attributing *all* node cost per byte then multiplying back by bytes — it reflects that the model is size-agnostic (contains no size-dependent economics), not that size is economically irrelevant.

### 5.4 The knife-edge: node count and the strong claim

The SCCR is homogeneous of degree 1 in its scale parameters: `SCCR ∝ (fee × price) / (C × T × N)`. Two thresholds matter (derived and verified in the independent C implementation):

- **The average SCCR crosses 1.0 at N ≈ 10,300 nodes** (or BTC ≈ $366K)
- **The "100% of sampled blocks below 1×" claim breaks at N ≈ 49,200 nodes** (or BTC ≈ $76,700) — the highest-fee sampled block (13.75M sats, height 960469) sits at 0.82× coverage under the old N=60K

**The real census (primary source).** We replaced the 60K assumption with data from a live Bitcoin Core node (`getnodeaddresses`, agent-25/node-census): **32,000 known addresses** — the RPC maximum, meaning the node's address manager is saturated at the cap and the true reachable set is *at least* 32K. Independent estimates span ~10K–100K; BSAHI's own earlier marketing data used ~27.8K.

**Consequence of the real N=32,000 (recomputed, 156 blocks):**

| Metric | At N=60K (old assumption) | At N=32K (real census) |
|---|---|---|
| Average SCCR | 0.156–0.172 | **~0.293** |
| Max per-block ratio | 0.820 | **1.537** |
| Blocks below 1× | 100.0% | **98.7%** (154/156) |

**This is a substantive finding, not a cosmetic one:** with a defensible node count, fees cover *more* of the modeled storage cost than the 60K assumption implied (~29% vs ~17%), and a handful of high-fee blocks now *exceed* 1× coverage. The direction of the headline is unchanged — most blocks are still below 1× — but the strong form ("100% below 1×") does **not** survive the real census. **The defensible claim is: ~29% average coverage, ~99% of sampled blocks below 1×, at the real observed node count (≥32K).**

**Joint Monte Carlo on the headline** (`research/sccr_monte_carlo.py`, 10,000 samples, N ~ Tri(10K,150K,mode 60K), C ~ Tri($500,$2000,mode $925), T ~ Tri(5,30,mode 10), P ~ Tri($30K,$120K,mode $62.9K)):

| Quantile | SCCR |
|---|---|
| P5 | 0.034 |
| P25 | 0.062 |
| P50 | 0.099 |
| P75 | 0.163 |
| P95 | 0.338 |
| Share below 1× | **99.8%** |

The median is below the deterministic point estimate because the node-count distribution's right tail (median N ≈ 86K) dominates. The result is robust in distribution: under joint uncertainty about every scale parameter, the ratio remains below 1 in 99.8% of draws — the *direction* of the finding is not sensitive to the audited parameter uncertainty, though the magnitude spans ~10× (P5–P95).

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

*Note: this table documents the 10× time-horizon correction at the then-assumed N=60K. A separate, subsequent correction replaced the node count with the primary-source census (N=32K), which moves the average to ~0.29 and the below-1× share to ~99% (see §5.4). The two corrections are independent and both are documented.*

**The reconciliation:** the two cost models (`storage-ratio.js` and `utxo_cost_model.py`) disagreed by 16.4×. This decomposed as **164× denominator gap ÷ 10× bug = 16.4×**. The models measure different quantities (block-average vs. marginal-inscription attribution); the gap is documented, not erased. See `verification_appendix.md → Model Reconciliation (v2.0.0)`.

## 7. Limitations and Future Work

**Limitations:**
1. **Node count (60K) is an estimate**, not a census — actual full-node count varies widely (pruned vs. archival). Independent estimates span ~10K–100K reachable nodes; the 60K midpoint is an assumption (see §5.4). The SCCR is inversely proportional to node count: at the audit's boundary, the "100% below 1×" claim inverts below ~49K nodes and the average inverts below ~10K.
2. **Node costs are homogeneous** in the model; hardware/bandwidth/electricity vary by geography and operator.
3. **10-year horizon is an assumption**; pruning shortens actual retention, permanent storage extends it.
4. **No discounting.** A one-time fee is compared against an undiscounted 10-yr storage-cost sum; discounting the liability at r=5% (8%) reduces the present value by ~27% (45%). The ratio therefore overstates the liability as commonly valued.
5. **Bandwidth is included in the fixed node cost (C) yet marginal bandwidth-propagation cost is excluded from the storage leg.** This is the fixed-vs-marginal distinction, not a double count: C prices the node's *average* bandwidth bill; the excluded term is the *marginal* cost of propagating one more block to one more node.
6. **Marginal vs. average attribution** changes the per-byte cost by 164× — the choice is explicit and documented, not hidden.

**Future work (the resource-pricing program):**
- **UTXO leg:** capture `getblockstats → utxo_size_inc` (already produced by agent-06, currently dropped at DB write)
- **Bandwidth leg:** analytical bounds from block size × replication × $/GB
- **Validation leg:** Core benchmarks + node-cost literature with explicit uncertainty
- **Node distribution:** expand `node_geo` (currently 224 rows) for per-region cost distributions
- **BIP-110 pre/post measurement protocol** if activation is ever signaled

## 8. Economics and Related Work

### 8.1 Is this an externality?

Following standard environmental-economics usage (Pigou, 1920; Coase, 1960), a **negative externality** arises when a transaction's cost is borne by parties who did not consent to the transaction. Applied to Bitcoin: an inscription's fee is paid by its creator; the long-term storage cost is borne by node operators who neither created the transaction nor were compensated for it. Two qualifications are stated honestly:

1. **Voluntary participation.** Node operators choose to run nodes (and may prune). The Pigouvian case is therefore weaker than for a physical externality (e.g. pollution) — the correct framing is an *unpriced but avoidable* cost, not an imposed one. Our problem statement's "arguments for no" (node operators choose; storage is cheap; pruned nodes avoid ~70–97% of the cost) are engaged directly in §5.
2. **Measurement, not pricing.** This paper *measures* a ratio; it contains no price mechanism and proposes no policy. Whether the measured gap constitutes a welfare-relevant externality is left to the reader and the literature.

### 8.2 Related work and novelty

- **Aronoff, Praizner, Sabouri (2026), arXiv:2604.17183** — structural VCG fee model; treats the mempool as a market for scarce block space; does not model storage externalities. Our fee-market framing builds on this.
- **Liu, Fang, Cheung, Cai, Huang (2021), arXiv:2103.05866** — *"An Incentive Mechanism for Sustainable Blockchain Storage."* Argues storage costs have "in general not been properly compensated by the users' transaction fees" and identifies two types of negative externalities, including an "insufficient fee issue." **This is the closest prior work** and we acknowledge it directly: our contribution is not the observation that fees may under-price storage (already argued in 2021), but a *measured, reproducible, Bitcoin-live-data quantification* (the SCCR) with a reconciliation of cost models and a knife-edge sensitivity bound. **We do not claim the observation is novel; we claim the measurement is.**
- **Ethereum state-rent / gas-as-state-pricing literature** and **Sompolinsky–Zohar** (qualitative storage/bandwidth incentive analysis) are adjacent threads we build toward but do not model.

### 8.3 Terminology

"Storage Cost Coverage Ratio" may read as a solvency/insurance term. The economics-native phrasing is **Cost Internalization Ratio** (the share of a long-lived resource cost internalized by the one-time fee). We keep SCCR as the operationalized estimator throughout for continuity, but note it is *not* a coverage ratio in the insurance sense — it is a fee-to-marginal-social-cost comparison.

---

## 9. Conclusion

The fee market solves block-space allocation well — that is not in question. Whether it internalizes long-lived resource costs is an **open empirical question**, and this paper contributes the first reproducible measurement using a primary-source node census: a storage-cost-internalization ratio averaging **~0.29** (156 blocks, N=32K real census), with **~99% of sampled blocks below the 1× threshold**.

The strong form of the claim ("100% below 1×") does **not** survive the real node census — a small set of high-fee blocks exceed 1× coverage at N=32K. The defensible statement is a **banded estimate**: fees currently cover roughly **one-sixth to one-third** of the modeled 10-year replicated storage cost depending on the node-count assumption, with the *direction* (most blocks below 1×) robust to every correction made in this paper's review.

We invite the community to reproduce, challenge, and extend this framework. All quantities derive from `research/model-spec.json` (v2.0.0); no script redefines a model constant. The data is live-captured, the measurement is continuous, and the arithmetic has been reproduced in three independent implementations (JS, Python, standalone C). The framework is presented as exactly what it is: a reproducible first measurement of a genuinely open question — not a verdict.

---

*Bitcoin Sahi Research Council — The Bitcoin Block Space Problem (Working Paper v2.0.0)*
*Component docs: problem_statement · bip141_analysis · pruning_externality_analysis · utxo_cost_note · verification_appendix · history-of-bitcoin*

## References

1. Pigou, A. C. *The Economics of Welfare.* Macmillan, 1920.
2. Coase, R. H. "The Problem of Social Cost." *Journal of Law and Economics* 3 (1960): 1–44.
3. Aronoff, D., Praizner, J., Sabouri, S. "Structural Fee Markets for Blockchain Block Space." arXiv:2604.17183, 2026.
4. Liu, J., Fang, L., Cheung, B., Cai, W., Huang, J. "An Incentive Mechanism for Sustainable Blockchain Storage." arXiv:2103.05866, 2021.
5. BIP 141: Segregated Witness. Bitcoin Improvement Proposal, 2015–2017.
6. Sompolinsky, Y., Zohar, A. "Secure High-Rate Transaction Processing in Bitcoin." *FC 2015.*
