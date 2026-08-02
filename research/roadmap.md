# Bitcoin Resource Accounting — Research Roadmap

*(program name adopted 2026-08-02; previously "Resource Internalization
Framework" / "the storage paper". The Paper-1 title "Storage Cost Internalization
in Bitcoin's Fee Market" is kept as the paper's descriptive title — the rename is
about the PROGRAM identity, not the paper title.)*

**Status:** **ADOPTED (2026-08-02)** — Prateek adopted the roadmap WITH the §6
amendments on 2026-08-02 ("continue :)" ratification). Phase I publication path
greenlit; UCIR data-path decision deferred until Phase I ships. **Program renamed
to "Bitcoin Resource Accounting" 2026-08-02** (Prateek directive, executed by
TELOS as Aviku): the final assessment reframes the program as
**"Can we build a complete accounting system for every long-lived resource
consumed by Bitcoin, and quantify how much of each cost is internalized by the
fee market?"** — with **SCCR as the first metric (Metric #1) in the family**.
Recorded by TELOS (as Aviku). Consistent with ratified Decision 1 (research-first
scope, see `docs/decisions/2026-08-02-project-decisions.md`). Companion to
`working-paper.md` v2.1.0 (+ §11/§12 addendum 2026-08-02) and `model-spec.json`
v2.0.1.

---

## 1. The reframe

The working paper (v2.1.0) is the **storage paper (Paper 1)**. The program is
named **Bitcoin Resource Accounting** and reframes from **"storage measurement"**
to a complete accounting thesis:

> **Can we build a complete accounting system for every long-lived resource
> consumed by Bitcoin, and quantify how much of each cost is internalized by the
> fee market?** — all long-lived resource costs (storage, UTXO maintenance,
> validation, bandwidth, relay, propagation, indexer serving) expressed in ONE
> reproducible accounting framework, each with its own measurable Cost
> Internalization Ratio; **SCCR is Metric #1** (the storage account).

**Verdict on the reframe:** genuinely valuable, not cosmetic. The observation that
fees may under-price storage is not novel (Liu et al. 2021, arXiv:2103.05866 — the
closest prior work). What IS novel is the reproducible measurement (the SCCR). The
reframe multiplies that asset: instead of one measurement, it offers a *measurement
framework* for the whole class of long-lived resources. Working-paper §8.3 already
names the economics-native phrasing — **Cost Internalization Ratio** — the roadmap
generalizes that into **Resource Internalization Ratio (RIR)**.

## 2. The central question

Stated in §1. The dynamic companion (Phase IV): does any endogenous mechanism move
the ratios toward 1 as nodes, price, fees, and L2 adoption evolve — or is
partial/external pricing the structural equilibrium? (This is working-paper §10 Q8.)

## 3. Phases (faithful capture of the roadmap)

- **Phase I — Complete & publish the storage paper** (focused; do NOT mix
  UTXO/validation in). Remaining items: independent reproduction (3 implementations
  now exist — JS/Python/C; the C implementation was created 2026-08-02 in the
  pre-publication execution plan and all three are verified to agree per-block
  via `research/reproduce/cross_check.sh`), SCCR over time (automated tracking; manual only now),
  sensitivity (exists), limitations (exists).
- **Phase II — Resource Accounting Framework, one new metric per resource**
  (SCCR is **Metric #1**, already measured — every new metric inherits its
  template: canonical spec → live capture → independent implementations → cross-check;
  **evidence status: UCIR/VCIR/RCIR/BCIR/DCIR are RESEARCH HYPOTHESES — not yet
  modeled/measured/reproduced — see the evidence-status table in §4**):
  - **UCIR** (UTXO Growth): RAM/lookup/validation cost per lifetime UTXO
  - **VCIR** (Validation): CPU per script class (P2PKH / P2WPKH / Taproot / multisig)
    — demoted to bounded analytical sub-study (4-question gate, §4)
  - **RCIR** (Relay): marginal bandwidth per tx
  - **BCIR** (Propagation): witness size vs block propagation delay
- **Phase III — Unified framework:** Resource Coverage Matrix
  (resource × cost-exists × fee-prices × measurable × metric) consolidating all
  ratios under one formula:
  `ResourceInternalizationRatio_i = fee_contribution_toward_i / estimated_lifetime_cost_of_i`
  **DCIR (Indexer/API leg — added 2026-08-02, was missing from the roadmap):**
  indexers maintain searchable copies of the same ledger; their cost is commercial
  and their revenue is off-chain (subscriptions/API fees), so the fee-market
  numerator is structurally near-zero — DCIR is the family's likely
  *persistent-negative* row (near-zero internalization by design). See
  working-paper §11 Q3 for the full coverage matrix.
- **Phase IV — Dynamic questions:** SCCR over time (2015 / 2017 SegWit / 2021 /
  2023 Ordinals / today); network-evolution equilibrium (does SCCR move toward 1 as
  nodes/price/fees/L2 grow?). Overlaps working-paper §10 (see §4). **First
  answers 2026-08-02 (working-paper §11 Q1–Q5, computed by
  `tools/research/sccr_dynamics.py`):** Q1 4-way scenario (BTC $1M, fees up, nodes
  up, storage cheaper) **overshoots** — SCCR ≈ 8.9, price lever dominates; Q4
  price-only path: SCCR crosses 1× at **P* ≈ $283K** (storage fully internalized,
  zero protocol change); Q5 2040: C÷10 deflation pushes SCCR **up** (1.11 at flat
  fees — the 0.056 anchor is the N×4 node-growth branch), sustained 10 sat/vB
  pushes past 1 either way — "which lever dominates" is the honest tension, not a
  prediction.
- **Phase V — Cross-chain (expanded 2026-08-02):** apply the framework to any
  system with **one-time payment → long-lived shared resource**: Ethereum,
  Solana, IPFS, Arweave, Filecoin, Celestia (fit map in §9 below). Turns the
  Bitcoin paper into **distributed-systems economics**. Compare METHODOLOGY not
  rankings; NO early ETH-vs-BTC comparison. Research horizon, not a near-term
  deliverable.

## 4. The 4-question gate (apply to every new metric)

> 1. Is the resource real?
> 2. Is the cost estimable reproducibly?
> 3. Is the fee contribution meaningfully comparable?
> 4. Is the answer economically interesting?

**Gate verdicts (TELOS assessment, 2026-08-02):**

| Metric | Q1 real? | Q2 reproducible cost? | Q3 comparable fee? | Q4 interesting? | Verdict |
|---|---|---|---|---|---|
| **UCIR** | ✅ YES — UTXO set growth raises RAM/lookup cost on every node | ✅/⚠️ PASS with carve-out — RAM/lookup leg yes (Core stats public); validation-cost leg inherits VCIR's CPU-measurement problem → scope out or bound | ⚠️ LEAN-PASS — needs explicit per-tx fee allocation + lifetime assumption (same T shape as SCCR) | ✅ YES — "does the fee market price state permanence?" is sharper than raw storage | **PASS (4/4, with validation-cost component carved out and documented)** |
| **VCIR** | ✅ YES — script-class CPU variance is real | ❌ FAIL as headline metric — CPU cycles/tx-class is hardware- and software-version dependent; network-level aggregation is not reproducibly measurable; only a pinned-benchmark bound is possible | ⚠️ MARGINAL — fees are per-tx, not per-script-class; attribution conflates script complexity with input/signature count | ✅ YES — Taproot-discount debate is live | **FAIL on Q2 → demote to bounded analytical sub-study, not a standalone RIR** |
| **RCIR** | ✅ YES | ✅ PASS (analytical bounds: tx size × replication × $/GB) | ⚠️ MARGINAL — bandwidth is already inside C (fixed); marginal leg is the new part | ⚠️ Moderate — the interesting result is likely "small vs. storage" | **PASS for Phase III fill-in, low priority** |
| **BCIR** | ✅ YES | ❌ FAIL — no public network-topology data; would need own measurement/simulation | ⚠️ MARGINAL | ⚠️ Moderate | **Research-hard; defer to Phase III/IV** |

Rule: a metric that fails Q2 may still appear in the Resource Coverage Matrix as a
"bounded analytical estimate" row — never as a headline ratio.

**Evidence status — discipline separation (post-advisor review, 2026-08-03).**
The framework never overclaims: exactly ONE member of the RIR family is an
**ESTABLISHED METRIC (validated)**; every other named ratio is a **RESEARCH
HYPOTHESIS (not yet modeled / measured / reproduced)** and must be labeled as
such in every surface (roadmap, publication plan, paper, talk, site). Naming a
hypothesis is not claiming a result.

| Metric | Evidence status | What would promote it |
|---|---|---|
| **SCCR** | 🟢 **ESTABLISHED METRIC (validated)** — measured on live data; three independent implementations (JS/Python/C) agree per-block; joint Monte Carlo bounded; v2.0.0 correction documented (§5/§6) | — (this is the template every other metric inherits) |
| **UCIR** | 🟡 **RESEARCH HYPOTHESIS** — cost side exists (`utxo_cost_model.py`); fee-side numerator unmodeled; data path undecided (R5-gated) | canonical spec → live capture → independent implementations → cross-check, after the 4-question gate re-pass |
| **VCIR** | 🔴 **RESEARCH HYPOTHESIS (demoted)** — failed Q2 (CPU cycles/tx-class not reproducibly measurable); only a pinned-benchmark bound is possible | bounded analytical sub-study, never a headline ratio |
| **RCIR** | 🟡 **RESEARCH HYPOTHESIS** — analytical bounds sketched; no ratio measured | Phase III fill-in (low priority) |
| **BCIR** | 🔴 **RESEARCH HYPOTHESIS (research-hard)** — no public network-topology data | own measurement/simulation; Phase III/IV |
| **DCIR** | 🟡 **RESEARCH HYPOTHESIS** — structural argument (off-chain revenue ⇒ fee-market numerator ~0); no measurement | Phase III; likely persistent-negative row |

Rule (unchanged): a hypothesis that fails Q2 may appear as a "bounded analytical
estimate" row — never as a headline ratio.

## 5. Mapping to existing repo state (DONE vs LEFT)

**DONE (verified) — already in the repo and load-bearing for the roadmap:**

- **Storage leg (SCCR) is complete and canonical** — `model-spec.json` v2.0.1;
  `tools/research/storage-ratio.js`; three independent implementations (JS/Python/C,
  all verified agreeing per-block via `research/reproduce/cross_check.sh`);
  joint Monte Carlo (`research/sccr_monte_carlo.py`); knife-edge thresholds (N≈7.1K /
  BTC≈$283K live baseline); live value 0.2252 (2026-08-02, 168 blocks), ~100% below 1×.
- **The UTXO leg exists on the cost side** — `research/utxo_cost_model.py`
  (cb_insc marginal branch, L_insc, pruned-vs-archival analysis, unavoidable ~30%
  of ops). It is NOT yet a ratio (no fee-side numerator) — that is exactly Phase II.
- **Working-paper §7 "future work (the resource-pricing program)"** already lists the
  UTXO / bandwidth / validation / node-distribution legs — the roadmap's Phase II is
  this list made concrete with named metrics.
- **Working-paper §10 v3.0 eight-question agenda** already contains much of Phase IV:
  Q7 computes historical SCCR over fee-peak years (2017 ≈ 10.0, 2021 ≈ 8.0, 2023 ≈ 5.0,
  2024 ≈ 4.8, era-adjusted node counts); Q8 is the equilibrium question.
- **Terminology bridge** — working-paper §8.3 names "Cost Internalization Ratio" as the
  economics-native phrasing of SCCR.
- **`knowledge/README.md`** — networking transferable-design notes (congestion
  collapse prevention, buffering, bottleneck-governs) relevant to the RCIR/BCIR legs.

**LEFT — genuinely new in the roadmap:**
- Phase III Resource Coverage Matrix + formalized RIR across resources (nothing in the
  repo formalizes multi-resource accounting).
- Phase V cross-chain methodology comparison (nothing exists).
- The 4-question gate as a standing discipline (new, excellent).
- Named metric definitions (UCIR/VCIR/RCIR/BCIR) with numerators/denominators.

**Overlap verdict:** ~40% of the roadmap overlaps existing plans (§7 future work +
§10 v3.0); ~60% is genuinely new. It is a genuine reframe, not a duplicate: it turns
a single-paper program into a framework program, which is a *more defensible* and
*more novel* publication thesis.

## 6. TELOS amendments to the roadmap (recommended)

1. **Phase I first: AGREE.** Publication is the forcing function; mixing resources in
   would dilute the paper and delay it. The paper is nearly complete — finish it.
2. **Archival-vs-pruned v3.0 study slots into Phase I** as a companion robustness
   study (node-census pruned-vs-archival distribution), feeding the paper's
   limitations framing (T=10 and who bears the cost). It is evidence for the storage
   leg, not a new resource. Publish with or immediately after the paper.
3. **UCIR is the right next metric — but rate it 4/5, not 5/5.** Concept 5/5; the
   data path is blocked: `utxo_size_inc` needs the local Core node, which is ~320K
   blocks behind tip and sync is deferred (R5-gated). Workaround: estimate UTXO-set
   deltas from public per-block data (blockchair/blockstream), accepting measurement
   error — or reopen the R5 gate for node sync, which is weeks of IBD and not worth
   it for one metric. Decide the data path before starting.
4. **VCIR demoted** to a bounded analytical sub-study (per §4 gate). Do not promise
   a reproducible CPU-cycle metric to reviewers.
5. **Sequencing note:** RCIR is the most *model-possible* next leg (analytical
   bounds already sketched in §7), but UCIR is more discussion-relevant. Do UCIR
   first; RCIR can be filled in cheaply at Phase III.

## 7. Ratification record (2026-08-02)

**Adopted:** ✅ — Prateek adopted the roadmap WITH the §6 amendments on
2026-08-02. Ratification language: "continue :)" in response to TELOS's three
requests.

| Item | Status |
|---|---|
| Adopt roadmap with §6 amendments | ✅ ADOPTED — UCIR rated 4/5 with validation-cost carve-out (scoped to RAM/lookup cost per lifetime UTXO); VCIR demoted to a bounded analytical sub-study, never a headline ratio; BCIR research-hard (defer to Phase III/IV); RCIR next model-possible leg (fill in cheaply at Phase III); archival-vs-pruned slots into Phase I as a companion note (evidence for the storage leg; needs the census, not the unsynced node — unblocked) |
| Greenlight Phase I publication path | ✅ GREENLIT — arXiv / Bitcoin Optech submission of working-paper v2.1.0 with the archival-vs-pruned companion note; see `research/publication-plan.md` |
| Decide UCIR data path | ⏸️ DEFERRED — not needed until Phase I ships (public-API approximation vs R5-gate reopen for node sync) |
| **Program rename → "Bitcoin Resource Accounting"** | ✅ **RENAMED 2026-08-02** — Prateek directive; program identity now "Bitcoin Resource Accounting", Paper-1 title unchanged; SCCR = Metric #1; reframe: "Can we build a complete accounting system for every long-lived resource consumed by Bitcoin…?" (see §1) |
| **Deep-question answers (v3.0, Q1–Q5)** | ✅ **COMPUTED 2026-08-02** — `tools/research/sccr_dynamics.py`; answers in working-paper §11; summary in §8 below |
| **Cross-chain Phase V scope** | ✅ **EXPANDED 2026-08-02** — six candidate systems with honest fit map (§9); research horizon only |

**Phase I deliverables produced at adoption:** `research/archival-vs-pruned-note.md`
(companion note, honest data-gap framing — the census captures reachable node
count N but NOT the pruned-vs-archival split) and `research/publication-plan.md`
(arXiv/Optech submission checklist).

---

## 8. Phase IV first answers — the five deep questions (2026-08-02)

Computed with `tools/research/sccr_dynamics.py` (canonical model-spec v2.0.1
quantities; live baseline SCCR = 0.2228 @ N=32K, C=$925, T=10, P≈$63K, ~2 sat/vB;
frozen-capture cross-check 0.2186). Full derivations in working-paper §11.
**Model output vs judgment are separated in the paper**; this section is the
roadmap-level summary.

### Q1 — What force pushes SCCR toward equilibrium? (4-way scenario)

| Lever (single, vs baseline 0.2228) | SCCR | Direction |
|---|---|---|
| Price only: BTC $1M | **3.5365** | ↑ overshoots 1× by itself |
| Fees only: 5 sat/vB | **0.5598** | ↑ toward 1 |
| Nodes only: N=64K | **0.1114** | ↓ away from 1 (the only counter-force) |
| Storage only: C÷2 | **0.4456** | ↑ (cheaper storage raises the ratio; shrinks the absolute gap) |

**4-WAY ($1M, 5 sat/vB, N=64K, C/2): SCCR = 8.886 — OVERSHOOTS** (17.77 at 10
sat/vB). Verdict: no convergence to 1 in any computed path; the price lever
dominates. Dynamic-system reading (JUDGMENT): the only endogenous negative
feedback is the N-margin loop (under-pricing → exit → N↓ → SCCR↑), locally
stabilizing under a linear-response assumption, but exogenous node entry shifts
the fixed point below 1 (`SCCR* = 1 − γ/α`) and the model contains no measured
response functions — **a stable fixed point is not established in the model.**

### Q4 — Price-only internalization

SCCR crosses 1× at **P* ≈ $282,765 ≈ $283K** (frozen-capture cross-check:
$288K) with zero protocol change — storage is a price-invariant per-byte USD
liability and the fee's charging attribute (bytes) matches it, so price
genuinely internalizes it. **BUT (key structural distinction, sharpened 2026-08-03
per advisor review):** every resource's cost is ultimately USD-denominated
(hardware and operator time carry USD opportunity cost) — the real mismatch is
that **the fee's charging attribute does not match the other cost drivers**:
validation cost is per-transaction-*class* (script complexity) while the fee is
per-transaction; UTXO cost is a *stock* (live-set RAM/lookup) while fees are a
*flow*. A price rise inflates the fee numerator as a *unit effect*, not as
internalization, for every resource except storage. **Price can solve storage;
it cannot solve validation, UTXO, or relay the same way — there is no single
"resource market."**

### Q5 — 2040 scenarios

| 2040 scenario | SCCR |
|---|---|
| C÷10 (SSD deflation), N×2, fees flat ~2 sat/vB | **1.114** (↑ past 1 — deflation shrinks the cost denominator) |
| C÷10, N×2, fees 10 sat/vB | **5.598** |
| fees 10 sat/vB, C & N today | **1.120** (↑ past 1) |
| N×4 (128K), C flat, fees flat | **0.0557** (the "0.056" anchor — node-growth-only branch) |
| C÷2, N×2, fees flat | **0.2228** (levers cancel) |

**Honest correction to the common intuition:** SSD deflation does NOT push SCCR
down — it pushes it UP (`L_net ∝ C`); the **0.056 anchor is the node-growth-only
branch** (N×4). The two divergent futures: (a) cost-deflation world → SCCR ≥
1.11, externality evaporates; (b) node-growth-dominant world → SCCR → 0.056–0.11,
gap deepens. Sustained 10 sat/vB pushes past 1 in either world. **Which lever
dominates over a decade is the honest tension — the model maps directions and
magnitudes exactly but cannot predict relative rates.**

### Q2 / Q3 (framing + formalization)

- **Q2 (attribute pricing):** one bundled good (ledger slot) at one price —
  is the price informative about one attribute (congestion) or many
  (persistence, state, validation)? The planned **attribute-pricing regression
  (the ONE experiment)** is the empirical answer; the **SegWit natural
  experiment** (BIP 141's 4:1 witness discount, and the inscription regime that
  followed) is the discriminator — protocol-level attribute pricing demonstrably
  moves demand, so per-resource ratios are measurable objects, not category
  errors. Framing only; no computation needed.
- **Q3 (RIR family):** formalized as
  `RIR_i = fee_contribution_toward_resource_i / estimated_lifetime_cost_of_resource_i`
  with a 6-row coverage matrix (SCCR/UCIR/VCIR/RCIR/BCIR/**DCIR**) in
  working-paper §11 Q3. **SCCR = Metric #1** (the only measured member).
  **DCIR (indexer leg) was verified ABSENT from this roadmap as of 2026-08-02
  and is now added** — Phase III, likely persistent-negative row (indexers
  recover costs off-chain, so the fee-market numerator is structurally near
  zero).

---

## 9. Phase V — Cross-chain: distributed-systems economics (2026-08-02)

The framework's core structure — **one-time payment → long-lived shared
resource** — generalizes to any distributed system. This turns the Bitcoin paper
into *distributed-systems economics* (working-paper §12). **Research horizon,
not a near-term deliverable.**

| System | Long-lived shared resource | One-time payment | RIR well-defined? | Honest fit |
|---|---|---|---|---|
| **Bitcoin** | permanent replicated history | tx fee | ✅ | This paper — SCCR = Metric #1 |
| **Celestia** | data availability (blob space, sampled) | blob fee | ✅ **clean** | **High** — DA is a long-lived shared resource paid per blob |
| **Arweave** | permanent storage (endowment model) | one-time permaweb fee | ✅ **clean** | **High** — native one-time-payment→permanent-storage structure |
| **Solana** | state + history (high per-slot growth) | tx fee + rent | ⚠️ partial | Medium-high — rent already prices state; RIR measures whether rent *internalizes* |
| **Ethereum** | state (accounts/contracts) + history | gas (incl. SSTORE) | ⚠️ partial | Medium — gas has state-cost components; state rent historically failed; do NOT compare BTC-ETH early |
| **Filecoin** | storage deals (time-bound) | deal payments | ⚠️ different | Medium — fee and cost in the *same* storage market → internalization near-total by construction; real question is replication/retrieval coverage |
| **IPFS** | content-addressed storage (voluntary replication) | storage payments (Filecoin) | ⚠️ weak | Low-medium — no consensus-level fee market for storage; RIR degenerates |

**Rules (unchanged):** compare **METHODOLOGY** not rankings; **NO early
ETH-vs-BTC comparison**; some systems (Arweave, Celestia) are cleaner fits than
others (Ethereum state rent is a different mechanism; IPFS has no fee market to
measure). Do not overclaim — Phase V is the research horizon, and each new
system must pass the 4-question gate (§4) before a metric is named.

---

## 10. Reviewer-prescribed research directions (2026-08-03) — seven RESEARCH HYPOTHESES

*Added 2026-08-03 post peer-review of the SCCR paper. Evidence/hypothesis
boundary kept sharp: every direction below is a **RESEARCH HYPOTHESIS** — a
framed question with a defined promotion path — **not** an established result
and not a claim that the result will obtain. Promotion criteria are uniform:
a direction graduates to an ESTABLISHED METRIC only by passing the 4-question
gate (§4) **and** the SCCR evidence ladder (canonical spec → live capture →
independent implementations → cross-check). Until then it may be named on any
surface only as a hypothesis.*

| # | Direction | Research question (hypothesis framing) | Promotion criteria (4-question gate, §4) |
|---|---|---|---|
| 1 | **Resource Attribution Theory** | Which resource actually determines fee formation — not "what resources exist." SCCR establishes storage coverage; the attribution question is whether storage (or validation, or bandwidth, or congestion alone) is the binding attribute in fee formation. | Q1 real? Q2 cost reproducibly estimable? Q3 fee contribution comparable? Q4 economically interesting? → then the attribute-pricing regression (working-paper §11 Q2) as the empirical discriminator |
| 2 | **Resource Elasticity** | Does the fee change when storage doubles / CPU doubles? Elasticity (∂fee/∂resource) may matter more than ratio levels: a resource with high elasticity is priced by the market even when its ratio looks low. | Q1–Q4 gate + a measured response design: historical regime breaks (SegWit 2017, Ordinals 2023, fee-peak years) and cross-sectional fee-density variation |
| 3 | **Market Efficiency / Price Discovery** | Resource → internalization → elasticity → price discovery: is Bitcoin a resource economy in which the fee market *discovers* resource prices over time, or is the single fee price pure congestion clearing? | Q1–Q4 gate + attribute-pricing regression; requires the fee-density dataset across regime breaks (Phase IV data) |
| 4 | **Resource Vector** | Bitcoin as a multi-axis resource space: storage, validation, bandwidth, relay, memory, latency — each an axis with its own cost surface and (potential) internalization ratio. Formalizes the RIR family as a vector **R = (SCCR, UCIR, VCIR, RCIR, BCIR, DCIR, …)**. | Each axis passes the 4-question gate independently before entering the vector; the vector is a representation, not a result |
| 5 | **Cross-layer Accounting (Lightning)** | 1 payment → 1 channel → 1 block → 1000 users: what resources did Lightning actually save? The counterfactual resource bill of on-chain vs. routed payments. | Q1–Q4 gate; needs a payment-routing dataset + channel-close economics; Phase IV scope |
| 6 | **Miner Incentive Accounting** | Miner revenue → security budget → storage burden: the miner-centric complement to the node-cost/user-fee framing. What do miners spend fee revenue on, and does any of it cover the node storage burden? | Q1–Q4 gate; miner revenue/cost data are public; storage-burden attribution is the new leg; Phase IV scope |
| 7 | **Bitcoin Resource Index** | A daily-updated dashboard: **Storage 22% / Validation ? / Relay ? / Bandwidth ? / Security ?** — one index page, updated daily. **The live SCCR dashboard is the first cell** (`/sccr/latest`, `data/sccr*.json`); the index is the aggregation surface for the RIR family as each metric is promoted. | Each cell is a promoted RIR (4-question gate + evidence ladder); unmeasured cells render "?" — the dashboard never fabricates a cell |

**Boundary rule (unchanged, reaffirmed):** naming a direction is not claiming a
result. All seven are framed as questions with defined promotion criteria; none
may appear on any surface as an established finding until it has passed the
4-question gate and the SCCR evidence ladder. The live SCCR dashboard is the
first *cell* of direction 7, not the index itself.

---

*Bitcoin Sahi Research Council — Bitcoin Resource Accounting Roadmap (2026-08-02)*
