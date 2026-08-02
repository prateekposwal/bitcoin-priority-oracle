# Storage Cost Internalization in Bitcoin's Fee Market

**The Bitcoin Block Space Problem** — BSAHI Working Paper v2.1.0 (model-spec.json v2.0.1)
*Prepared by Prateek Poswal (Independent Researcher) within the Bitcoin Sahi Research Council program · 2026-08-02*

---

## Abstract

Bitcoin has a market price for block space, but no explicit market price for long-lived resource consumption. This paper measures one of those resources — replicated storage — and asks how much of its modeled cost is covered by transaction fees. We define a **Storage Cost Coverage Ratio (SCCR)** — the ratio of transaction fees paid (USD) to the estimated lifetime storage cost borne by full nodes (USD) — and measure it against live fee-history data using a **primary-source node census (≥32,000 known addresses from a live Bitcoin Core node)**. Across 156 sampled blocks, the average ratio is **~0.29 (dimensionless)**: fees cover roughly **29%** of the estimated 10-year replicated storage cost of an average block, and **~99% of sampled blocks fall below the 1× threshold** (a small number of high-fee blocks exceed it). A live re-measure on 2026-08-02 gives **~0.225 (dimensionless)** (168 blocks, model-spec v2.0.1); a re-read of the same capture at time of writing (167 blocks) gave 0.2228 with 100% of blocks below 1× — the ratio moves with the fee market. We reconcile two cost models that previously disagreed by 16.4× (dimensionless), document the correction transparently (model-spec.json v2.0.0), and bound the result against parameter uncertainty (joint Monte Carlo: 99.8% of draws below 1× under the old N band; ~99% at the real census). We present the framework as reproducible, falsifiable research — not a claim that Bitcoin is broken.

**Hypothesis:** Bitcoin's fee market efficiently allocates scarce block space, but may not fully internalize every long-lived resource cost created by confirmed transactions.

---

## 1. Introduction: Congestion Pricing vs. Permanence Cost

The one-sentence frame (full treatment in `problem_statement.md`):

> **Bitcoin's fee market prices competition for inclusion in the next block, but it does not explicitly price the long-term resource costs of permanently recorded blockchain data.**

The fee market solves a short-term optimization problem extremely well: during congestion, higher fees win block space. This is **congestion pricing**, with a horizon of roughly one block (~10 min). Storage cost is structurally different:

- **One-time payment** (the fee, USD/block) vs. **recurring cost** (long-term replicated storage across the network, USD/(node·yr))
- **Payer chooses** to pay vs. **node operators bear** the cost involuntarily
- **~10-min horizon** (next block) vs. **indefinite horizon** (data persists in blockchain history)

**Scope:** this paper measures the **storage leg** of a broader resource-pricing question. Bandwidth, validation, and UTXO-maintenance legs are future work (see §7).

**Why storage? It is not the "most important" resource — it is simply the first measurable one.** The program's discipline is: take the resource with a reproducible cost estimate and a live fee attribution, measure it, and leave the rest to the roadmap (RIR family, §7 and `roadmap.md` Phase II). Storage qualified first because its cost leg (`C`, `N`, `T`) and its fee leg (block fees, USD) are both estimable from primary sources. Every other resource is a named research hypothesis, not a measured result.

**Storage ≠ state.** SCCR measures the cost of replicated **history** — the permanent record of confirmed blocks retained by full nodes. It does *not* measure the **UTXO set**, the live ledger state every node maintains in RAM and index structures. State permanence is a separate resource with its own accounting leg (UCIR, §7 / `roadmap.md` Phase II); this paper's storage leg must not be read as a state-cost measurement.

**1× is a descriptive calibration point, not a normative target.** Stated at the outset so no reader mistakes the paper for a claim that fees *should* cover 100% of modeled storage cost. The paper measures whether they do; it prescribes nothing. The thresholds in §5.4 are reference points on that measurement, not policy targets.

## 2. What We're NOT Saying

- ❌ Not proposing a fix
- ❌ Not claiming the externality is economically significant at current volumes (it may not be)
- ❌ Not claiming the SegWit discount was a mistake (it solved transaction malleability)
- ❌ **Not arguing that Bitcoin is 'broken'** — the fee market solves block-space allocation well; whether it internalizes long-lived resource costs is an empirical question
- ❌ **Not claiming fees *should* cover 100% of storage cost** — the 1× threshold is a descriptive calibration point, not a normative target (§1, §5.4)
- ✅ Just framing the question clearly and measurably

## 3. The SegWit Pricing Structure

SegWit (BIP 141, activated August 2017) introduced block weight: witness data counts **1 weight unit (WU) per byte**, non-witness data **4 WU per byte**. This **4:1 (dimensionless) discount** reduces the marginal block-space cost of witness-resident data relative to non-witness data. Years later, inscription protocols (Ordinals, BRC-20, Runes) took advantage of that pricing structure.

Two precise caveats (full treatment in `bip141_analysis.md`):
1. The discount applies to **all** witness data — SegWit financial transactions benefit identically. The "accident" is that it also subsidizes data-bearing constructions, not that SegWit was designed for them.
2. Whether the discount appropriately reflects the long-term resource costs of the data it makes cheaper is **part of the research question**, not a foregone conclusion.

## 4. The Model

### 4.1 Canonical specification

All quantities, units, and formulas live in **`research/model-spec.json` (v2.0.1)** — a single canonical source that every script imports. No script redefines a model constant.

| Quantity | Symbol | Units | Value | Source |
|---|---|---|---|---|
| Annual node cost | C | USD/yr | 925 | `utxo_cost_model` component sum (924.35) rounded |
| Replication factor | N | nodes | 32,000 | primary-source census (agent-25, getnodeaddresses, ≥32K) |
| Storage horizon | T | yr | 10 | assumption (archival retention) |
| Average block size | B_block | bytes | 1,500,000 | block_stats / fee_history |
| Blocks per year | R_blocks | blocks/yr | 52,596 | 365.25 × 24 × 6 |
| Total block bytes/yr | B_all_yr | bytes/yr | 7.8894e10 | B_block × R_blocks |
| **Cost per byte per year** | **cb** | USD/(byte·yr) | **1.17246e-8** | C / B_all_yr (block-average) |
| Lifetime storage cost/node/block | L | USD/block | 0.175869 | cb × B_block × T |
| Network lifetime cost/block | L_net | USD/block | 5,628 | L × N (=32K) |
| **Storage Cost Coverage Ratio** | **SCCR** | dimensionless | **~0.29** (156 blocks, N=32K, dated 2026-08-01); **0.2228** (167 blocks, live 2026-08-02) | fee_USD / L_net |

```
                    Fees Paid (USD / block)
   SCCR  =  ─────────────────────────────────────────────
            Modeled Lifetime Storage Cost (USD / block)
            = L_network = C × T × N / R_blocks
```

**Design principle:** `cb` is **horizon-free** (C / annual bytes). The horizon `T` enters **only** through `L = cb × B × T`. This corrects the v1.0.0 implementation, which applied `T` twice (see §6).

**Explicit notation (hidden assumptions made visible).** The canonical quantities above bundle four assumptions that the model treats as scalars. Each is stated explicitly here so readers can see exactly what is and is not modeled; none changes the arithmetic of §5:

1. **C is a bundled cost, not pure storage.** `C = C_storage + C_bandwidth + C_misc` — the $925/yr annual node cost bundles the disk/SSD component, the bandwidth bill, and electricity/hardware depreciation (component sum 166.67 + 600 + 157.68; `utxo_cost_model.py`). The current model treats C as a single bundled scalar, so the headline ratio is strictly a **storage-and-hosting coverage ratio**, not a pure storage ratio. The bandwidth-vs-storage decomposition is a documented future refinement — exactly the RCIR and BCIR legs (§7 / `roadmap.md` Phase II/III).
2. **`cb` is time-dependent, not stationary.** The canonical `cb` is a point-in-time ratio `cb(t) = C(t) / B_year(t)` — the node's annual cost at time t divided by the network's byte production in that year. `B_year(t)` itself depends on block fullness: 95%-full blocks produce ~7.5×10¹⁰ bytes/yr vs ~5.5×10¹⁰ at 70%-full blocks, moving `cb` (and SCCR) even with C, N, and T fixed. SCCR as measured is therefore a **point-in-time estimate over its capture window**, consistent with the paper's dated-snapshot discipline (§5.1); the live tracker accumulates the time series (§5.1).
3. **N is a heterogeneous vector, not a scalar.** The model writes `L_network = L·N`; the explicit forward notation is `L_network = Σᵢ Lᵢ`, where each node class i (archival full node, pruned node, exchange node, research/indexer node) carries different storage behavior and hence a different per-node lifetime cost Lᵢ. This is precisely the archival-vs-pruned measurement gap documented in the companion note (`research/archival-vs-pruned-note.md`): the census measures reachable count N (≥32K, a lower bound), not the retention distribution. SCCR-as-computed is an upper bound on the burden borne by any single node class; a measured pruned/archival split is Phase I follow-on.
4. **Storage ≠ state (UTXO).** SCCR prices replicated *history* — the permanent record of confirmed blocks — not the UTXO set, the live ledger *state* nodes maintain in RAM and index structures. State permanence is a separate resource with its own accounting leg (UCIR, §7 / `roadmap.md` Phase II). A reader must not read the storage leg as a state-cost measurement; the two resources have different cost drivers (bytes retained vs. live-set size).

### 4.2 The marginal-inscription attribution (secondary)

The inscription-externality branch uses a **marginal attribution**: `cb_insc = C / (inscription bytes/yr) = 1.92573e-6` USD/(byte·yr). This differs from `cb` by a factor of **164.4× (dimensionless)** — not an error, but two different denominators (all block bytes vs. inscription-only bytes). The paper headline uses the block-average `cb`; the marginal figure appears only in the inscription-externality analysis. The 16.4× (dimensionless) figure reported in earlier versions was this 164× (dimensionless) denominator gap **divided by** the 10× (dimensionless) bug — see §6.

**Why average, not marginal?** `cb` is an *average* (accounting) attribution: total node cost divided by total bytes. The 164× (dimensionless) marginal branch (`cb_insc`) attributes the same cost to inscription bytes only — a *marginal* (optimization) view. Both are valid; they answer different questions. Average cost is the right tool for **accounting** — "what share of the network's modeled hosting bill does the fee market cover?" — which is this paper's question. Marginal cost is the right tool for **optimization** — "what does one more byte cost the network?" — which is the inscription-externality branch's question. The paper uses the average for its headline (accounting) and documents the marginal variant explicitly (the 164× marginal-inscription branch above), rather than burying the choice. A future marginal-attribution study would be a legitimate companion, not a correction.

## 5. Findings

### 5.1 The Storage Cost Coverage Ratio

Measured from live `fee_history` captures, node count N=32,000 (real census). Two snapshots, dated explicitly:

| Metric | Dated capture (2026-08-01) | Live capture (2026-08-02) |
|---|---|---|
| Blocks sampled | 156 | 167 |
| Average SCCR (dimensionless) | **~0.293** | **0.2228** |
| Min / Max (dimensionless) | ~0.058 / ~1.537 | ~0.058 / ~0.832 |
| Blocks below 1× | **98.7%** (154/156) | **100.0%** |

**Live re-measure (canonical, 2026-08-02):** the ratio moves with the fee market. The canonical re-measure recorded in `research/model-spec.json` v2.0.1 is **0.2252** (168 blocks, 2026-08-02); the 0.2228 above is the same capture window re-read at the time of writing (167 blocks). The 0.293 figure is the dated 2026-08-01 snapshot. The single source of truth is `research/model-spec.json` (v2.0.1, canonical); all surfaces must read the live value from `node tools/research/storage-ratio.js`, never a hardcoded figure. The v2.0.0 N=60K-era values (0.1719 / 0.1535) are superseded.

**Fee-regime + node-count dependence:** the ratio tracks both the fee market and the replication factor. Under the earlier N=60K assumption the average was 0.156–0.172 (dimensionless) with 100% below 1×; at the real census N=32K it rises to ~0.22–0.29 with ~99–100% below 1× (a few high-fee blocks exceed coverage in the dated capture). The headline is a *distribution over time and parameters*, not a point.

**Interpretation:** transaction fees cover, on average, roughly **22–29%** of the estimated 10-year replicated storage cost of an average block across the ≥32K observed nodes. Most sampled blocks' fees remain below their estimated storage cost. **Point-in-time discipline:** every figure in this section is a dated, capture-specific measurement — the time-series is live and growing (daily SCCR tracker, `com.bsahi.sccr-tracker.plist`), and the paper deliberately reports snapshots rather than a stationary number. This is not a convenience but a consequence of the model: `cb(t) = C(t)/B_year(t)` is itself time-dependent (§4.1), so the ratio is a snapshot over its capture window by construction — block fullness, node costs, and fee levels all move between captures.

### 5.2 The inscription externality (marginal branch)

At 100,000 inscriptions/month (~400 bytes each, in witness):

| Metric | Value |
|---|---|
| Cost per byte per year (marginal) | 1.92573e-6 USD/(byte·yr) |
| Lifetime storage cost per inscription (10 yr) | $0.00770 USD/inscription |
| New 10-yr storage liabilities created per year at 100K/mo | ~$9,240 USD/yr spread across all nodes |
| Steady-state annual externality (amortized) | ~$924 USD/yr spread across all nodes |

**Unit note (corrected):** $9,240 is the *undiscounted 10-year liability of one year's inscriptions* (USD/yr), not an annual cost. Amortized over the 10-yr horizon it is ~$924/yr. This was previously labeled "annual unpriced externality" — a T/1 conflation of the same shape as the fixed 10× bug, in label only. The per-node figure (~$0.015 USD/(node·yr)) is unchanged under either reading.

**Pruning-consistency note:** this externality is structurally real but **not economically significant at current volumes** — per-node it is well under $1/yr. The contribution of this paper is the reproducible ratio framework, not the magnitude. A future fee regime (sustained congestion, larger data-bearing volume) would change the magnitude while keeping the framework intact.

### 5.3 Sensitivity

Recomputed at the live capture (2026-08-02, 167 blocks; baseline SCCR = 0.2228 (dimensionless) at N=32K, C=$925/yr, T=10 yr) with `node tools/research/storage-ratio.js` and the canonical spec. The table's parameter ranges bracket the canonical values:

| Parameter | Value | Avg SCCR (dimensionless) |
|---|---|---|
| Node cost, C (USD/yr) | 600 / 925 / 1400 | 0.343 / 0.223 / 0.147 |
| Node count, N (nodes) | 16,000 / 32,000 / 100,000 | 0.446 / 0.223 / 0.071 |
| Storage horizon, T (yr) | 5 / 10 / 15 | 0.446 / 0.223 / 0.149 |
| Avg block size, B (MB) | 1.0 / 1.5 / 2.0 | 0.223 (invariant) |

**BTC price (the dominant omitted driver — verified in independent implementation):** the ratio is linear in price. At the live N=32K baseline (capture price ≈ $63,018 USD/BTC):

| BTC price (USD/BTC) | Avg SCCR (dimensionless, N=32K) |
|---|---|
| $30,000 | 0.106 |
| $45,000 | 0.159 |
| $62,900 | 0.222 |
| $100,000 | 0.354 |
| $200,000 | 0.707 |
| $500,000 | 1.768 |

**Structural property:** SCCR is **invariant to block size** — `cb ∝ 1/B` while `L ∝ B`, so `B` cancels. Caveat: this invariance follows from attributing *all* node cost per byte then multiplying back by bytes — it reflects that the model is size-agnostic (contains no size-dependent economics), not that size is economically irrelevant.

### 5.4 The knife-edge: node count and the strong claim

The SCCR is homogeneous of degree 1 in its scale parameters: `SCCR ∝ (fee × price) / (C × T × N)`. Two thresholds matter (derived and verified in the independent C implementation):

- **The average SCCR crosses 1.0 at N ≈ 10,300 nodes** (or BTC ≈ $366,000 USD/BTC) — dated v2.0.0-era reference values (baseline 0.1719 at N=60K)
- **The "100% of sampled blocks below 1×" claim breaks at N ≈ 49,200 nodes** (or BTC ≈ $76,700) — the highest-fee sampled block (13.75M sats, height 960469) sits at 0.82× coverage (dimensionless) under the old N=60K

**Live recompute (2026-08-02 baseline, SCCR = 0.2228 at N=32K):** because the baseline ratio itself rose, the average now inverts at **N ≈ 7,130 nodes** or **BTC ≈ $283,000**; the "100% below 1×" break on the dated capture is unchanged at N ≈ 49,200 (the max block is 0.832× at N=32K on the live capture, still below 1×). Both the dated and live thresholds are reported; the model-spec v2.0.1 note retains the v2.0.0-era values (10.3K / $366K).

**The real census (primary source).** We replaced the 60K assumption with data from a live Bitcoin Core node (`getnodeaddresses`, agent-25/node-census): **32,000 known addresses** — the RPC maximum, meaning the node's address manager is saturated at the cap and the true reachable set is *at least* 32K. At census time the node also reported **8 live outbound P2P connections** (agent-25, 2026-08-02) — the observed live reachable set is small relative to the 32K known-address lower bound, which is exactly why we report the addrman saturation as the primary figure. Independent estimates span ~10K–100K; BSAHI's own earlier marketing data used ~27.8K.

**Consequence of the real N=32,000 (recomputed, dated 156-block capture):**

| Metric | At N=60K (old assumption) | At N=32K (real census) |
|---|---|---|
| Average SCCR (dimensionless) | 0.156–0.172 | **~0.293** |
| Max per-block ratio (dimensionless) | 0.820 | **1.537** |
| Blocks below 1× | 100.0% | **98.7%** (154/156) |

**This is a substantive finding, not a cosmetic one.** Note: 1× is a **descriptive calibration point, not a normative target** — the paper measures whether fees cover modeled storage cost; it does not claim 1× is the "right" level of coverage. With a defensible node count, fees cover *more* of the modeled storage cost than the 60K assumption implied (~29% vs ~17%), and a handful of high-fee blocks now *exceed* 1× coverage. The direction of the headline is unchanged — most blocks are still below 1× — but the strong form ("100% below 1×") does **not** survive the real census on the dated capture. **The defensible claim is: ~22–29% average coverage, ~99–100% of sampled blocks below 1×, at the real observed node count (≥32K).**

**Joint Monte Carlo on the headline** (`research/sccr_monte_carlo.py`, 10,000 samples, N ~ Tri(10K,150K,mode 60K), C ~ Tri($500,$2000,mode $925), T ~ Tri(5,30,mode 10), P ~ Tri($30K,$120K,mode $62.9K)):

| Quantile | SCCR (dimensionless) |
|---|---|
| P5 | 0.034 |
| P25 | 0.062 |
| P50 | 0.099 |
| P75 | 0.163 |
| P95 | 0.338 |
| Share below 1× | **99.8%** |

The median is below the deterministic point estimate because the node-count distribution's right tail (median N ≈ 86K) dominates. The result is robust in distribution: under joint uncertainty about every scale parameter, the ratio remains below 1 in 99.8% of draws — the *direction* of the finding is not sensitive to the audited parameter uncertainty, though the magnitude spans ~10× (P5–P95).

## 6. Internal Validation, Correction, and Reconciliation (v2.0.0)

Internal validation identified an inconsistency in the SCCR implementation, traced it to a **duplicated time-horizon term**, corrected the implementation, regenerated all reported values, and confirmed the qualitative conclusions unchanged. We present the correction in four labeled steps: **Bug → Fix → Results → Reconciliation**.

### 6.1 The bug

methodology.json v1.0.0 and `storage-ratio.js` applied the horizon `T` twice — once dividing the denominator of `costPerBytePerYear` (`C / (B_all_yr / T)`) and again in the lifetime-cost product (`bytes × cb × T`). This inflated modeled storage cost (USD/block) — and deflated the ratio (dimensionless) — by exactly **10×**.

**The error affected the magnitude of the reported ratio, not the logical structure of the model or the interpretation of the hypothesis.** The formula's shape (fee vs. replicated lifetime storage cost) was correct; the bug was a dimensional slip in one derived quantity (`cb`), not a conceptual change to what the ratio measures.

### 6.2 The fix

`cb` is defined horizon-free (`C / bytes-per-year`); `T` enters only through `L = cb × B × T`. This is the canonical v2.0.0 definition and is pinned in `research/model-spec.json`; no script may reintroduce `T` into `cb`.

### 6.3 Results

| Quantity | Before (v1.0.0 formula, N=60K) | After (v2.0.0, N=60K) |
|---|---|---|
| Cost per byte per year (USD/(byte·yr)) | 1.17247e-7 | **1.17247e-8** |
| Lifetime storage cost/node/block (USD/block) | $1.759 | **$0.176** |
| Network lifetime cost/block (USD/block) | $105,522 | **$10,552** |
| **Average SCCR (dimensionless)** | 0.0172 | **0.1719** |
| Blocks below 1× | 100% | **100% (unchanged)** |

**Why the conclusion survived the correction.** Although the correction increased the estimated SCCR by ~10× on a same-capture basis (0.0172 → 0.1719 (dimensionless) at the then-assumed N=60K) — and by ~11.5× across the as-reported headlines (v1.0.0 **0.0149** → v2.0.0 **0.1719**, a change that also spans different capture windows) — every sampled block still remained below the modeled full-cost threshold (1×) under the then-assumed node count (N=60K). At the real N=32K census the average rose further to **~0.225 (22.5%)** on the 2026-08-02 live re-measure (168 blocks), with ~99% of sampled blocks still below the 1× threshold. The magnitude of the measurement moved by an order of magnitude; the *direction* of the finding did not.

*Note: the table above documents the 10× time-horizon correction at the then-assumed N=60K. A separate, subsequent correction replaced the node count with the primary-source census (N=32K), which moves the average to ~0.22–0.29 and the below-1× share to ~99–100% (see §5.4). The two corrections are independent and both are documented.*

### 6.4 Reconciliation

The two cost models (`storage-ratio.js` and `utxo_cost_model.py`) disagreed by 16.4× (dimensionless). This decomposed as **164× (dimensionless) denominator gap ÷ 10× (dimensionless) bug = 16.4× (dimensionless)**. The models measure different quantities (block-average vs. marginal-inscription attribution); the gap is documented, not erased. See `verification_appendix.md → Model Reconciliation (v2.0.0)`.

### 6.5 Reproducibility

The correction increased the estimated SCCR by an order of magnitude but did not reverse the paper's qualitative conclusion. This distinction is important: the implementation error affected the estimated magnitude of the measurement, whereas the underlying hypothesis was evaluated against the corrected model and remained supported under the paper's assumptions. Every quantity in this paper is regenerated from `research/model-spec.json` (v2.0.1) by three independent implementations (JS, Python, standalone C); no script redefines a model constant, and the full capture log is retained in `captured-data/bsahi.db`.

**Independent reproduction (status).** The frozen capture and the three implementations agree (avg SCCR 0.2186, min 0.0584, max 0.8320, 171/171 blocks below 1×), and the one-command reproduction path has been verified from a fresh clone of the public repository. This is internal consistency. The paper's reproducibility claim will be stated, once external runs land, as: *"Independently reproduced by external participants following the published reproduction protocol"* — not "externally verified." One independent success is good; three is excellent. An external run is the only outstanding submission gate (D5; `research/reproduce/external-reproduction.md`).

## 7. Limitations and Future Work

**Limitations:**
1. **The node count (≥32K from the live census) is a lower bound**, not a complete enumeration — the addrman caps at 32,000 addresses, so the true reachable set is at least 32K, and independent estimates span ~10K–100K reachable nodes (pruned vs. archival). The SCCR is inversely proportional to node count: at the live baseline the average inverts above 1× only below ~7.1K nodes, and the "100% below 1×" claim breaks below ~49K nodes at the dated capture (see §5.4).
2. **Node costs are homogeneous — and bundled.** Hardware/bandwidth/electricity vary by geography and operator; the model treats them as one scalar C = $925/yr. Because C is bundled (C = C_storage + C_bandwidth + C_misc, §4.1), the headline ratio is strictly a **storage-and-hosting coverage ratio**, not a pure-storage ratio, and the bandwidth-vs-storage decomposition is a documented future refinement — the RCIR and BCIR legs (§7 future work / `roadmap.md` Phase II/III).
3. **10-year horizon is an assumption**; pruning shortens actual retention, permanent storage extends it.
4. **No discounting; constant-cost assumption.** A one-time fee (USD/block) is compared against an undiscounted 10-yr storage-cost sum (USD/block); discounting the liability at r=5%/yr (8%/yr) reduces the present value by ~27% (45%). A declining $/GB storage-cost trend would likewise lower the future liability (the T=10 constant-cost figure is conservative in the same direction as the discounting caveat). Both effects mean the ratio overstates the liability as commonly valued.
5. **Bandwidth is included in the fixed node cost (C) yet marginal bandwidth-propagation cost is excluded from the storage leg.** This is the fixed-vs-marginal distinction, not a double count: C prices the node's *average* bandwidth bill; the excluded term is the *marginal* cost of propagating one more block to one more node.
6. **Marginal vs. average attribution** changes the per-byte cost by 164× (dimensionless) — the choice is explicit and documented, not hidden.

7. **Why storage at all?** The paper does not claim storage is Bitcoin's most important resource — **it is simply the first measurable one**: the first long-lived resource with a reproducible cost estimate and a live fee attribution. Bandwidth, validation, UTXO, relay, and indexer serving are named research hypotheses with their own metrics (`roadmap.md` §4), none yet measured. Storage led because it could be measured, not because it ranks first in economic importance.

**Future work (the resource-pricing program):**
- **UTXO leg:** capture `getblockstats → utxo_size_inc` (already produced by agent-06, currently dropped at DB write)
- **Bandwidth leg:** analytical bounds from block size × replication × $/GB
- **Validation leg:** Core benchmarks + node-cost literature with explicit uncertainty
- **Node distribution:** expand `node_geo` (currently 224 rows) for per-region cost distributions
- **BIP-110 pre/post measurement protocol** if activation is ever signaled
- **v3.0 economic-dynamics program:** the eight-question agenda in §10

### 7.1 What would falsify this framework?

*(Added 2026-08-03, post-advisor review — see `docs/decisions/2026-08-02-publication-decisions.md`.)* A framework that cannot specify its own failure conditions is not a framework; it is a posture. We therefore state, in advance, the observations that would force us to retract or substantially revise the claims in this paper. They operate at two levels — the **measurement** (SCCR, this paper) and the **framework** (the RIR family and the "no single resource market" thesis; outline in `research/framework-paper-outline.md`).

**Falsifiers of the SCCR measurement:**

1. **Independent implementations cannot reproduce the ratio.** The framework ships a frozen capture plus three independent implementations (JS/Python/C, verified agreeing per-block). If an uninvolved party running the protocol on the same inputs cannot reproduce SCCR ≈ 0.22 (or the discrepancy cannot be reconciled), the measurement is not trustworthy and the paper's headline falls. This is the D5 critical path (external reproduction; `research/reproduce/external-reproduction.md`).
2. **A better storage-cost model reverses the conclusion.** The denominator (`C·T·N / R_blocks`) rests on a homogeneous node-cost model, an assumed T=10 horizon, and the ≥32K census. If a defensible refinement — measured pruned-vs-archival retention, regional cost heterogeneity, or corrected discounting — moves the banded result (~22–29% coverage, most blocks below 1×) to a qualitatively different conclusion, the paper's central claim is falsified in its current form.
3. **Fees consistently exceed modeled long-term costs.** If sustained fee regimes (or re-measured 2017–2024 fee-peak years) show fees *covering* modeled costs in a stationary way, the partial-internalization reading collapses into "the market internalizes storage when it matters" — a different result, and the banded headline (§5) would be wrong.

**Falsifiers of the framework (the RIR family and the "no single resource market" thesis):**

4. **Resource-cost attribution is shown economically inappropriate.** If the planned attribute-pricing regression (§11 Q2) shows the single fee price carries *no* persistence signal, then per-resource internalization ratios are category errors, not measurements — the RIR family premise fails even though SCCR-as-computed may stand.
5. **The pruned-vs-archival census shows the storage burden is avoidable at scale.** The T=10 replicated-storage denominator assumes archival retention across the network. A measured pruning distribution showing most nodes avoid most of the burden (companion note `archival-vs-pruned-note.md`) would reframe SCCR as an upper bound on an avoidable cost — a genuine falsification of the externality reading, though not of the measurement.
6. **Measured response functions close the dynamic loop at or above 1×.** If node-entry/exit and fee-demand response functions (§11 Q1) are measured and exhibit a stable fixed point at or above 1×, the persistent-partial-internalization equilibrium hypothesis is falsified.

We do not believe any of these falsifiers currently obtain; we list them so the reader can check, and so the framework is never mistaken for an unfalsifiable claim.

## 8. Economics and Related Work

### 8.1 Is this an externality?

Following standard environmental-economics usage (Pigou, 1920; Coase, 1960), a **negative externality** arises when a transaction's cost is borne by parties who did not consent to the transaction. Applied to Bitcoin: an inscription's fee is paid by its creator; the long-term storage cost is borne by node operators who neither created the transaction nor were compensated for it. In mechanism terms this is a **two-sided** structure — the payer (transaction creator) and the bearer (node operator) are different agents, and the fee is a one-time congestion payment while the cost recurs over the storage horizon. Two qualifications are stated honestly:

1. **Voluntary participation.** Node operators choose to run nodes (and may prune). The Pigouvian case is therefore weaker than for a physical externality (e.g. pollution) — the correct framing is an *unpriced but avoidable* cost, not an imposed one. Our problem statement's "arguments for no" (node operators choose; storage is cheap; pruned nodes avoid ~70–97% of the cost) are engaged directly in §5. **Voluntary participation weakens the welfare interpretation, but not the measurement** — the ratio still quantifies what the fee market covers of a real, recurring cost borne by the storage-bearing class, whatever the operator's freedom to exit.
2. **Measurement, not pricing.** This paper *measures* a ratio; it contains no price mechanism and proposes no policy. Whether the measured gap constitutes a welfare-relevant externality is left to the reader and the literature.

### 8.2 Related work and novelty

- **Aronoff, Praizner, Sabouri (2026), arXiv:2604.17183** — *"A Model and Estimation of the Bitcoin Transaction Fee."* Structural VCG fee model; treats the mempool as a market for scarce block space; does not model storage externalities. Our fee-market framing builds on this.
- **Liu, Fang, Cheung, Cai, Huang (2021), arXiv:2103.05866** — *"An Incentive Mechanism for Sustainable Blockchain Storage."* Argues storage costs have "in general not been properly compensated by the users' transaction fees" and identifies two types of negative externalities, including an "insufficient fee issue." **This is the closest prior work** and we acknowledge it directly: our contribution is not the observation that fees may under-price storage (already argued in 2021), but a *measured, reproducible, Bitcoin-live-data quantification* (the SCCR) with (i) a reconciliation of cost models, (ii) knife-edge sensitivity bounds, (iii) regime dynamics (the ratio moves with the fee market), and (iv) a multi-resource framework for the broader class of long-lived resource costs (roadmap.md, RIR program). **We do not claim the observation is novel; we claim the measurement is.**
- **Ethereum state-rent / gas-as-state-pricing literature** and **Sompolinsky–Zohar** (qualitative storage/bandwidth incentive analysis) are adjacent threads we build toward but do not model.

### 8.3 The efficient-markets objection (named rebuttal)

**Objection:** if block space is priced at the margin by a market that clears, then marginal cost is internalized by definition — the fee IS the price, so there is no externality to measure.

**Rebuttal:** this conflates two different horizons. The fee market prices *inclusion in the next block* — a static, congestion-clearing price with a ~10-min horizon. The storage cost the SCCR measures is a *recurring* cost over an indefinite horizon (the data persists in every full node's history). A market can clear for the short-horizon good (block space now) while not pricing the long-horizon good (permanent replicated storage). The paper's measurement question is precisely whether the one-time congestion price also covers the recurring storage cost; §5 shows the empirical answer (banded ~22–29% coverage at N=32K). The efficient-markets framing is therefore not contradicted — it is *scoped*: it describes the short-horizon market, and the paper measures the long-horizon gap.

### 8.4 Terminology

"Storage Cost Coverage Ratio" may read as a solvency/insurance term. The economics-native phrasing is **Cost Internalization Ratio** (the share of a long-lived resource cost internalized by the one-time fee). We keep SCCR as the operationalized estimator throughout for continuity, but note it is *not* a coverage ratio in the insurance sense — it is a fee-to-marginal-social-cost comparison.

---

## 9. Conclusion

The fee market solves block-space allocation well — that is not in question. Whether it internalizes long-lived resource costs is an **open empirical question**, and this paper contributes the first reproducible measurement using a primary-source node census: a storage-cost-internalization ratio averaging **~0.22–0.29 (dimensionless)** (167–156 blocks, N=32K real census, dated captures), with **~99–100% of sampled blocks below the 1× threshold**.

The strong form of the claim ("100% below 1×") does **not** survive the real node census on the dated capture — a small set of high-fee blocks exceed 1× coverage at N=32K. The defensible statement is a **banded estimate**: fees currently cover roughly **one-fifth to one-third** of the modeled 10-year replicated storage cost depending on the node-count assumption and capture window, with the *direction* (most blocks below 1×) robust to every correction made in this paper's review.

We invite the community to reproduce, challenge, and extend this framework. All quantities derive from `research/model-spec.json` (v2.0.1); no script redefines a model constant. The data is live-captured, the measurement is continuous, and the arithmetic has been reproduced in three independent implementations (JS, Python, standalone C). The framework is presented as exactly what it is: a reproducible first measurement of a genuinely open question — not a verdict.

## 10. Next Evolution (v3.0): When Would the Fee Market Naturally Internalize These Costs?

**Trajectory.** v2.0 asked and answered a *measurement* question: **"Can we measure whether the fee market internalizes long-term storage costs?"** — the SCCR is that measurement. The next evolution of this program (v3.0) moves from measurement to *economic dynamics*: **"Under what economic conditions would the fee market naturally internalize these costs?"** Instead of asking how large today's gap is, v3.0 asks which parameter paths — BTC price, fee levels, node counts, storage costs, payment-layer substitution — close the gap on their own, and whether any endogenous mechanism does so.

**The v3.0 research agenda is the following eight questions.** Preliminary computations at the live fee level (canonical model-spec v2.0.1 quantities; live `fee_history` capture, 2026-08-02; baseline SCCR = 0.2228 (dimensionless) at N=32K, T=10 yr, C=$925/yr) are reported as previews; full derivations, assumptions, and sensitivity detail are in the accompanying analysis report.

| # | Question | Headline model output (live baseline) |
|---|---|---|
| 1 | Storage horizon: SCCR at T = 5, 10, 20, 30, 50 yr | 0.446 / 0.223 / 0.111 / 0.074 / 0.045 (inverse-linear in T) |
| 2 | Storage 10× cheaper: C = $92.5/yr (SSD cost collapse) | SCCR = 2.228 — the gap flips sign; fees would over-cover storage |
| 3 | BTC = $500,000 | SCCR = 1.768; average crosses 1× at ~$283K (live baseline) |
| 4 | Fees sustained at 100 sat/vB for 5 yr | fee_USD ≈ $63,018/block (1M vB) vs L_net ≈ $5,628 (T=10) → SCCR ≈ 11.2 (22.4 at T=5); crosses 1× at ~9 sat/vB (T=10) |
| 5 | Lightning moves 90% of payments off-chain | Two-sided: lower on-chain fee demand ↓SCCR; higher-value residual traffic ↑SCCR — net effect is an open empirical question |
| 6 | Nodes double / triple: N = 32K → 64K → 128K | 0.223 → 0.111 → 0.056 (inverse-linear in N) |
| 7 | Can SCCR reach 1 without protocol changes? | Historically yes: SCCR averaged **above 1×** in 2017–2024 fee-peak years (2017 avg ~10.0, 2021 ~8.0, 2023 ~5.0, 2024 ~4.8, era-adjusted node counts); 2025–2026 is the first sustained sub-1× regime |
| 8 | What is the equilibrium? Does price, fees, or demand close the loop? | **Open.** The model measures a ratio; it does not close the dynamic loop (N ↔ fees ↔ price). Framed as a dynamic system in the report |

**Method notes for the agenda.** Q1–Q4, Q6, and Q7 are directly computable from the canonical model because SCCR is a simple homogeneous function of its drivers: `SCCR = fee_USD / L_net = fee_BTC × P × R_blocks / (C × T × N)` (dimensionless). Q5 requires a demand-side model of what moves off-chain and at what value per byte — outside the current model, and therefore flagged as reasoning-plus-assumption rather than computation. Q8 is the deep question: whether Bitcoin's fee market has a self-correcting mechanism (e.g., node attrition raising the per-node burden, or scarcity rents raising fees) that internalizes storage costs endogenously. That is the v3.0 centerpiece, and we state honestly that the current framework cannot settle it — it can only bound the parameter space in which the answer would flip.

**First answers (2026-08-02 addendum):** five deeper questions extending this
agenda — the equilibrium force (Q1), attribute pricing (Q2), the RIR family with
DCIR (Q3), the price-only internalization path (Q4), and the 2040 scenarios
(Q5) — are answered in **§11** with exact model output from
`tools/research/sccr_dynamics.py`. The cross-chain generalization of the
framework (Phase V) is sketched in **§12**.

**Open-question honesty.** Nothing in this section claims the fee market *will* internalize these costs, nor that it *should*. The claim is narrower: the question is now well-posed, the drivers are identified, and each driver's lever on the ratio is measured. Whether any economic force actually pulls the system toward internalization is the v3.0 research question.

## 11. Deep Questions (v3.0 Agenda — First Answers)

*Addendum 2026-08-02, within the **Bitcoin Resource Accounting** program (see
`research/roadmap.md`; SCCR is Metric #1 of the RIR family). This section answers
the five deeper questions extending the §10 agenda. All computations use the
canonical model-spec v2.0.1 quantities and the §10 live baseline
(SCCR = 0.2228 at N=32K, C=$925/yr, T=10 yr, P≈$63K, ~2 sat/vB), are regenerated
by `tools/research/sccr_dynamics.py` (JSON: `tools/research/sccr_dynamics_output.json`),
and are cross-checked against the frozen-capture reproduction (SCCR = 0.2186,
171 blocks, `tools/research/reproduce.py`). Where a result is judgment rather
than model output, it is labeled **JUDGMENT**.*

### Q1 — What economic force pushes SCCR toward equilibrium?

**Model output (the static map).** SCCR is homogeneous in its drivers, so each
lever's direction is exact:

| Scenario (one lever at a time) | P (USD) | Fee level | N (nodes) | C (USD/yr) | fee_USD/block | L_net USD | **SCCR** |
|---|---|---|---|---|---|---|---|
| Baseline (today) | 63,000 | ~2 sat/vB | 32,000 | 925 | $1,253.87 | $5,627.80 | **0.2228** |
| Price only: BTC = $1M | 1,000,000 | ~2 sat/vB | 32,000 | 925 | $19,902.77 | $5,627.80 | **3.5365** |
| Fees only: 5 sat/vB | 63,000 | 5 sat/vB | 32,000 | 925 | $3,150.44 | $5,627.80 | **0.5598** |
| Nodes only: N = 64K | 63,000 | ~2 sat/vB | 64,000 | 925 | $1,253.87 | $11,255.61 | **0.1114** |
| Storage only: C ÷ 2 | 63,000 | ~2 sat/vB | 32,000 | 462.50 | $1,253.87 | $2,813.90 | **0.4456** |

**Model output (the joint 4-way scenario: BTC $1M, fees up, nodes up, storage
cheaper):**

| Scenario | P (USD) | Fee level | N | C | fee_USD/block | L_net USD | **SCCR** |
|---|---|---|---|---|---|---|---|
| 4-WAY: $1M, 5 sat/vB, N=64K, C/2 | 1,000,000 | 5 sat/vB | 64,000 | 462.50 | $50,006.97 | $5,627.80 | **8.8857** |
| 4-WAY alt: $1M, 10 sat/vB, N=64K, C/2 | 1,000,000 | 10 sat/vB | 64,000 | 462.50 | $100,013.94 | $5,627.80 | **17.7714** |
| 3-way (no N): $1M, 5 sat/vB, C/2 | 1,000,000 | 5 sat/vB | 32,000 | 462.50 | $50,006.97 | $2,813.90 | **17.7714** |

**Verdict (model output):** the stated 4-way scenario **overshoots** — SCCR ≈
**8.9** (coverage, not gap), i.e. fees would over-cover modeled storage cost by
~8.9× at 5 sat/vB, ~17.8× at 10 sat/vB. The price lever alone ($1M, everything
else fixed) gives **3.54×** — it crosses 1× by itself. It does **not** converge
toward 1 in any of the computed paths; every path that includes the price move
overshoots.

**Why the directions are what they are (model output + one honest correction to
the naive intuition):** three of the four levers push SCCR **up** (price, fee
level, cheaper storage — the last because `L_net ∝ C`, so a smaller cost
denominator is over-covered by the same fees; the *absolute* externality
shrinks even as the ratio rises). **Only node growth pushes SCCR down**
(`L_net ∝ N`). So "cheap storage" is *not* a counter-force to internalization in
ratio terms — it is a *co-force*; the true counter-force is node growth. This
matters for the dynamic reading: the ratio and the absolute externality can move
in opposite directions under C.

**The dynamic-system framing (JUDGMENT — not computable from the static model).**
The only *endogenous* negative feedback in the model's structure is at the N
margin: under-pricing → node operators prune or exit → N↓ → L_net↓ → SCCR↑ →
under-pricing eases. With a linear-response assumption `dN/dt = α·(SCCR − 1)`
(node exit proportional to under-pricing) and `SCCR = K/N`, this loop is locally
stabilizing at SCCR = 1. But two forces break it: (i) exogenous node entry
(cost-deflation + hobbyist adoption) adds a positive `γ` to `dN/dt`, which moves
the fixed point to `SCCR* = 1 − γ/α` — **structurally below 1**, a persistent
partial-internalization equilibrium, not full coverage; (ii) the model contains
**no measured response functions** for N(·) or for fee-demand as a function of
price, so whether a stable fixed point exists in reality is **not settled by
this model** — the model can only show the conditions under which one would
exist. **Honest answer: no stable fixed point is established in the model**; the
4-way overshoot shows the price lever alone would blow past 1× long before the
slow N-margin loop could equilibrate it.

### Q2 — Is Bitcoin optimizing one resource, or many, with one price?

**Framing (no new computation — the paper's central mechanism question).** The
fee market sells **one bundled good** — a ledger slot in the next block — at
**one price** (sat/vbyte, modulated by SegWit weight). The question is whether
that single price is informative about **one attribute** (congestion) or whether
it carries signal about **many** (persistence, state, validation). This is the
attribute-pricing question: a price can clear a market for a composite good
while being informative about only the dominant marginal attribute.

The **planned empirical answer** is the attribute-pricing regression (the "ONE
experiment"): regress per-block fee density (USD/byte, sat/vbyte) on attribute
descriptors — data-bearing vs financial payloads, witness vs non-witness
residency, script class, output/UTXO contribution — over the captured block
history. If attribute descriptors load significantly, the single price carries
multi-attribute signal; if only congestion loads, it is single-attribute. This
regression is a Phase IV deliverable (working-paper §10 Q8 companion), not yet
run.

The **SegWit natural experiment** is the discriminator: BIP 141 (Aug 2017)
imposed a *protocol-level attribute price* — witness data at 1 weight unit per
byte vs 4 for non-witness. The market's response (the inscription regime from
2023, and SegWit financial adoption before it) demonstrates the price is *not*
single-attribute: the protocol itself priced an attribute, and demand moved
along it. SegWit therefore validates that attribute pricing is both feasible and
behaviorally real in Bitcoin's fee market — which is precisely why the SCCR
family (Q3) is well-posed: if the fee price can carry attribute signal, then
per-resource internalization ratios are measurable objects, not category errors.

### Q3 — Can every Bitcoin resource have its own internalization ratio?

**Yes, by construction — the RIR family.** The unified family formalizes §8.3's
Cost Internalization Ratio into a per-resource family:

> **RIR_i = fee_contribution_toward_resource_i / estimated_lifetime_cost_of_resource_i**

| # | Metric | Resource | Cost leg (denominator) | Fee leg (numerator) | Status |
|---|---|---|---|---|---|
| **1** | **SCCR** | Storage (permanent replication) | `C·T·N / R_blocks` (USD/block) | block fee (USD) | **MEASURED — this paper** (0.2228 live baseline; §5) |
| 2 | **UCIR** | UTXO set / state permanence | RAM/lookup per lifetime UTXO | per-tx fee allocation | Phase II — cost side exists (`utxo_cost_model.py`); fee-side attribution open |
| 3 | **VCIR** | Validation (script-class CPU) | CPU per tx class (pinned-benchmark bound only) | per-tx fee | Phase II — demoted to bounded analytical sub-study (4-question gate, roadmap §4) |
| 4 | **RCIR** | Relay (marginal bandwidth) | tx size × replication × $/GB | per-tx fee | Phase III fill-in (analytical bounds) |
| 5 | **BCIR** | Propagation (witness size vs delay) | topology-dependent delay cost | per-tx fee | Phase III/IV — research-hard |
| 6 | **DCIR** | Indexer / API serving | index storage + serving cost (commercial) | indexer/API fees (off-chain) | Phase III — fee-market numerator structurally near-zero; likely persistent-negative row |

**DCIR (the indexer leg, added in the prior review — verified absent from
`roadmap.md` as of 2026-08-02 and now added):** indexers (block explorers, API
providers) maintain searchable copies of the same ledger. Their cost is real and
commercial, but their revenue is **off-chain** (subscriptions, API pricing) — the
on-chain fee-market numerator is structurally near-zero. DCIR is therefore the
family's likely *persistent-negative* row: near-zero internalization **by
design**, not by accident. It is still a legitimate RIR — the framework's value
is making the "the fee market does not pay indexers" fact *measured*, not
asserted.

**SCCR is Metric #1** — the only measured member of the family, and the
template (canonical spec → live capture → three implementations → cross-check)
every other metric inherits. Roadmap updated: DCIR added to Phase III + the
coverage matrix.

### Q4 — Could Bitcoin eventually price everything without protocol changes?

**Model output (storage leg):** SCCR crosses 1× at **P* ≈ $282,765 ≈ $283K**
at the live baseline (frozen-capture cross-check: **$288,296 ≈ $288K**). If BTC
reaches that price with today's fee level, storage is **fully internalized with
zero protocol change** — a pure price effect, because the storage-cost
denominator is USD-denominated and price-invariant while the fee numerator
scales linearly with price. Target table: 0.5× at $141K, 1.0× at $283K, 2.0× at
$566K, 3.5× at $990K.

**Extension method (JUDGMENT — the numerator/denominator structure, not a
computed number; sharpened 2026-08-03 post-advisor review):** formally, the same
price lever applies to any RIR whose denominator is a price-invariant cost and
whose numerator is a USD fee (`P*_i = P₀ × target/RIR_i,₀`). For every resource
except storage that lever is **economically hollow**, and the reason must be
stated precisely. The common shorthand — "storage is USD-denominated;
validation/UTXO are CPU/RAM-denominated; so price solves one and not the other"
— is only half right: validation hardware and operator time have USD opportunity
costs, so in the *aggregate* a price rise would mechanically lift any resource
ratio, storage or not. The sharper distinction is that **the fee's charging
attribute does not match the other cost drivers**:

- **Storage — matched in attribute, mismatched in time.** Storage cost is a
  homogeneous per-byte USD liability (`cb` USD/(byte·yr)) incurred *after* the
  fee; the fee is charged per (v)byte. The per-byte attribute matches, so a
  price rise raises USD fee revenue against a fixed USD cost stream — price
  genuinely closes the per-byte intertemporal gap (P* ≈ $283K).
- **Validation — mismatched in attribute.** The fee is per-transaction (sat/vB);
  the validation cost is per-transaction-*class* (script complexity, signature
  count). One price cannot distinguish classes, so price appreciation inflates
  every transaction's fee uniformly without reallocating toward — or signaling
  anything about — the costly classes. The ratio would move; the move is a unit
  effect, not internalization.
- **UTXO — mismatched in stock vs. flow.** The UTXO cost is a *stock*
  (RAM/lookup driven by live-set size, per lifetime UTXO); fees are a *flow*
  (per transaction). Price appreciation inflates the flow without touching the
  stock driver.
- **Relay/bandwidth — mismatched in payer/receiver structure.** Marginal
  propagation cost is incurred per recipient node; the fee is paid once by the
  sender. Price does not change the replication topology that sets the burden.

**Honest answer, sharpened:** price can lift the aggregate ratio for *any*
USD-priced resource — that is arithmetic. What it cannot do is repair a mismatch
between the fee's charging attribute and the resource's cost driver. Storage's
per-byte attribute matches, so price genuinely internalizes it; validation
(per-class), UTXO (stock), and relay (per-recipient) do not match, so for them
the price lever is a unit effect. **There is no single "resource market":** there
is one block-space market (congestion) whose single price carries a genuine
per-byte signal and only accidental signal about the other resources. Those need
state-management or fee-structure levers — which is why UCIR's data path and
VCIR's benchmark path are the actual Phase II work.

### Q5 — What happens in 2040?

**Model output** (all 2040 rows at P = $63K unless noted; C ÷ 10 = SSD
deflation, N × 2 = 32K → 64K):

| 2040 scenario | P (USD) | Fee level | N | C | fee_USD/block | L_net USD | **SCCR** |
|---|---|---|---|---|---|---|---|
| Cost collapse + node growth, fees flat | 63,000 | ~2 sat/vB | 64,000 | 92.50 | $1,253.87 | $1,125.56 | **1.1140** |
| Cost collapse + node growth, fees 10 sat/vB | 63,000 | 10 sat/vB | 64,000 | 92.50 | $6,300.88 | $1,125.56 | **5.5980** |
| Fees 10 sat/vB, C & N today | 63,000 | 10 sat/vB | 32,000 | 925 | $6,300.88 | $5,627.80 | **1.1196** |
| Node growth dominant: N ×4 (128K), C flat, fees flat | 63,000 | ~2 sat/vB | 128,000 | 925 | $1,253.87 | $22,511.22 | **0.0557** |
| Moderate: C ÷ 2, N × 2, fees flat | 63,000 | ~2 sat/vB | 64,000 | 462.50 | $1,253.87 | $5,627.80 | **0.2228** |

**Two honest corrections to the common intuition.** (i) **SSD deflation does NOT
push SCCR down — it pushes it up.** `L_net ∝ C`, so C ÷ 10 shrinks the cost
denominator 10× and the same fees over-cover it: SCCR = 1.114 even at today's
flat fee level, and 5.6 at 10 sat/vB. The *absolute* externality collapses
toward ~free, but the *ratio* explodes. (ii) The **0.056 anchor belongs to the
node-growth-only branch** (N × 4 → 128K, C flat, fees flat), reproduced exactly
(0.0557 — same as working-paper §10 Q6). Node growth is the only lever that
deepens the ratio gap; deflation and fees both close it.

**The two genuinely divergent futures are therefore:** (a) *cost-deflation
world* — storage approaches free, SCCR ≥ 1.11, the externality evaporates by
deflation of the denominator (nothing to internalize); (b) *node-growth-dominant
world* — replication spreads the same cost over 2–4× more nodes, SCCR falls to
0.056–0.11, the gap deepens. A sustained 10 sat/vB regime pushes SCCR past 1 in
either world (1.12 at today's C/N; 5.6 with deflation).

**Honest tension, not a prediction:** the 2040 question is really *which lever
dominates over a decade* — C-deflation (ratio ↑) vs N-growth (ratio ↓) vs
fee/price demand (ratio ↑). The model maps every lever's direction and magnitude
exactly; it **cannot** predict their relative rates, and no claim is made about
which future obtains. If BTC price also appreciates (Q4), the price lever
dominates both branches and SCCR crosses 1 regardless.

## 12. Cross-Chain: Distributed-Systems Economics (Phase V horizon)

**Framing (no new computation — research horizon, not a near-term
deliverable).** The framework's core structure — **one-time payment → long-lived
shared resource** — is not Bitcoin-specific. Any distributed system with a
one-time fee and a persistent replicated resource admits an RIR question. The
generalization turns this paper into *distributed-systems economics*. Full
treatment in `roadmap.md` §Phase V; the honest fit map:

| System | Long-lived shared resource | One-time payment | RIR well-defined? | Fit |
|---|---|---|---|---|
| **Bitcoin** | permanent replicated history | tx fee | ✅ | This paper (SCCR = Metric #1) |
| **Celestia** | data-availability (blob space, sampled) | blob fee | ✅ **clean** | High — DA is exactly a long-lived shared resource paid per blob |
| **Arweave** | permanent storage (endowment) | one-time permaweb fee | ✅ **clean** | High — native one-time-payment→permanent-storage structure |
| **Solana** | state + history (high per-slot growth) | tx fee + **rent** | ⚠️ partial | Medium-high — rent already prices state, so the RIR measures whether rent *internalizes* |
| **Ethereum** | state (accounts/contracts) + history | gas (incl. SSTORE state-cost) | ⚠️ partial | Medium — gas has state-cost components; state rent historically failed (EIP-3521 etc.) |
| **Filecoin** | storage deals (time-bound) | deal payments | ⚠️ different | Medium — fee and cost live in the *same* storage market, so internalization is near-total by construction; the real question is replication/retrieval coverage |
| **IPFS** | content-addressed storage (voluntary replication) | storage payments (Filecoin) | ⚠️ weak | Low-medium — no consensus-level fee market for storage; RIR degenerates |

**Honest caution (unchanged from roadmap §Phase V):** compare **METHODOLOGY**,
never rankings; do **not** compare BTC-ETH early — different cost structures
(rent vs no-rent, history size, node economics) make raw ratio comparisons
meaningless before the method is cross-validated. Some systems (Arweave,
Celestia) are cleaner fits than others (Ethereum state rent is a different
mechanism; IPFS has no fee market to measure). This is the research horizon for
Phase V, explicitly not a near-term deliverable.


---

*Bitcoin Sahi Research Council — The Bitcoin Block Space Problem (Working Paper v2.1.0)*

*Component docs: problem_statement · bip141_analysis · pruning_externality_analysis · utxo_cost_note · verification_appendix · history-of-bitcoin*

## References

1. Pigou, A. C. *The Economics of Welfare.* Macmillan, 1920.
2. Coase, R. H. "The Problem of Social Cost." *Journal of Law and Economics* 3 (1960): 1–44.
3. Aronoff, D., Praizner, J., Sabouri, S. "A Model and Estimation of the Bitcoin Transaction Fee." arXiv:2604.17183, 2026.
4. Liu, Y., Fang, Z., Cheung, M. H., Cai, W., Huang, J. "An Incentive Mechanism for Sustainable Blockchain Storage." arXiv:2103.05866, 2021.
5. BIP 141: Segregated Witness. Bitcoin Improvement Proposal, 2015–2017.
6. Sompolinsky, Y., Zohar, A. "Secure High-Rate Transaction Processing in Bitcoin." *FC 2015.*
