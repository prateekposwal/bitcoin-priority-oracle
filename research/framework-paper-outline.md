# Bitcoin Resource Accounting: A General Framework — Paper 4 Outline (synthesis)

*(Created 2026-08-03, post-advisor review. This is the OUTLINE/PLAN for the
foundational synthesis paper — NOT the paper itself. Nothing here is a result;
results live in Paper 1 and future Papers 2–3. Evidence status is labeled per
the roadmap §4 discipline separation.)*

**Status:** DRAFT OUTLINE — adopted as the Paper-4 plan (2026-08-03). Adviser's
recommendation: the program's foundational paper should be a **general framework**
— "Bitcoin Resource Accounting: A General Framework" — with the 6-part structure
below; the current storage paper becomes Paper 1 of the series. This outline
matches the roadmap's Paper 1/2/3/4 framing (publication-plan §intro): **Paper 1**
= storage/SCCR (written), **Paper 2** = UTXO/UCIR, **Paper 3** = validation/VCIR
(bounded), **Paper 4** = this unified framework + Resource Coverage Matrix (incl.
DCIR).

**Evidence-status key (used throughout):**
- 🟢 **ESTABLISHED** — measured + reproduced (SCCR only)
- 🟡 **HYPOTHESIS** — named, not yet modeled/measured/reproduced (UCIR/RCIR/DCIR)
- 🔴 **HYPOTHESIS (research-hard)** — named, gate-failed or data-blocked (VCIR/BCIR)
- ⚪ **FRAMING** — conceptual/economic argument, not a measurement (no evidence claim)

---

## Paper title (working)

**Bitcoin Resource Accounting: A General Framework for Measuring Fee-Market
Internalization of Long-Lived Shared Resources**

## The paper's one-paragraph thesis (draft for the outline)

Bitcoin's fee market prices one good — inclusion in the next block — at one price.
But confirmed transactions create costs in *multiple* long-lived shared resources
(storage, UTXO state, validation CPU, relay bandwidth, propagation, indexer
serving), each with a different cost driver. The framework generalizes the
storage Cost Internalization Ratio (SCCR, Paper 1) into a per-resource family —
**RIR_i = fee contribution toward resource i / estimated lifetime cost of
resource i** — states which resources price can internalize and why, and provides
a reproducible construction template for each new metric. **Claimed scope: a
measurement framework, not a verdict; one established metric, six named
hypotheses.**

---

## Outline

### §1 Introduction — why multiple shared resources (⚪ FRAMING)

- **What this section contains:** the structural observation that a single
  one-time payment (tx fee) creates long-lived costs across many resources;
  the reframe from "storage measurement" to "complete accounting" (roadmap §1);
  scope discipline: this paper is the framework + coverage matrix, not new
  measurements.
- **Evidence status:** ⚪ framing — the observation that fees under-price storage
  is already in the literature (Liu et al. 2021, arXiv:2103.05866 — acknowledged
  as closest prior work in Paper 1 §8.2); the framework's novelty is the
  *measurement template*, not the observation.
- **Key claims to avoid overstating:** no claim that any resource *is*
  externalized at economically significant scale; no claim about what *should*
  be priced.

### §2 Which resources are priced directly (🟢 ESTABLISHED + ⚪ FRAMING)

- **What this section contains:** the taxonomy of cost drivers and their match to
  the fee's charging attribute:
  - **Storage** — homogeneous per-byte USD liability, incurred *after* the fee;
    fee charged per (v)byte → attribute matched, time mismatched → price can
    genuinely internalize it (Paper 1 §5, §11 Q4: P* ≈ $283K). 🟢 established.
  - **Congestion/block-space** — the one good the fee market *does* price
    directly (short-horizon, ~10 min). ⚪ framing.
  - Everything else is NOT priced directly — see §3.
- **Evidence status:** storage leg 🟢 (SCCR measured); the "directly priced"
  list is ⚪ framing plus Paper 1's measurement.

### §3 Which resources are only partially internalized — and why (🟡 HYPOTHESIS)

- **What this section contains:** the "**no single resource market**" thesis,
  sharpened: every resource's cost is ultimately USD-denominated (hardware/time
  carry USD opportunity cost) — the real mismatch is that **the fee's charging
  attribute does not match the cost driver**:
  - **Validation (VCIR)** — fee per-transaction (sat/vB) vs. cost
    per-transaction-*class* (script complexity) → attribute mismatch. 🔴
    gate-failed for measurement; bounded analytical sub-study only.
  - **UTXO state (UCIR)** — fee is a *flow*, cost is a *stock* (live-set
    RAM/lookup) → stock/flow mismatch. 🟡
  - **Relay/propagation (RCIR/BCIR)** — fee paid once by sender vs. cost per
    recipient node (replication topology) → payer/receiver mismatch. 🟡/🔴.
  - **Indexer serving (DCIR)** — cost is commercial, revenue is off-chain → the
    fee-market numerator is structurally near-zero (persistent-negative row). 🟡.
  - Consequence: price can lift any aggregate ratio as a *unit effect*, but that
    is not internalization; only storage's matched attribute makes the price
    lever genuine. This is the paper's central economic claim (sharpened
    2026-08-03 per advisor review; working-paper §11 Q4).
- **Evidence status:** 🟡 hypothesis — the mismatch taxonomy is an economic
  argument; no VCIR/UCIR/RCIR/DCIR measurement exists yet. Must NOT be presented
  as established result.

### §4 How to construct a Resource Internalization Ratio (🟢 template + 🟡 discipline)

- **What this section contains:** the reproducible template every metric inherits
  (roadmap §3): **canonical spec (model-spec.json) → live capture → independent
  implementations → cross-check**, plus the **4-question gate** (roadmap §4: is
  the resource real? is the cost estimable reproducibly? is the fee contribution
  comparable? is the answer interesting?) and the Q2 rule (a metric that fails
  Q2 may appear as a "bounded analytical estimate" row, never a headline ratio).
- **Evidence status:** 🟢 the template is validated by SCCR (three independent
  implementations agreeing per-block, Paper 1 §6.5); the *application* to each
  new resource is 🟡 discipline, not a result.
- **Deliverable in the paper:** the general formula
  `RIR_i = fee_contribution_toward_resource_i / estimated_lifetime_cost_of_resource_i`
  with units discipline (dimensionless ratios, every quantity tagged, dated
  captures only).

### §5 SCCR as the first example (🟢 ESTABLISHED — summarized, not re-derived)

- **What this section contains:** Paper 1's storage account as the worked
  template: definition, census, banded result (~22–29% coverage, ~99–100% of
  blocks below 1× at ≥32K nodes), knife-edge thresholds (N ≈ 7.1K / P* ≈ $283K),
  the v2.0.0 10× correction as an example of the framework self-correcting, and
  the reproduction kit (3 implementations + frozen capture).
- **Evidence status:** 🟢 ESTABLISHED METRIC (validated). Point to Paper 1 for
  full derivation; do not re-derive.

### §6 Roadmap for UTXO / validation / relay / bandwidth (🟡 HYPOTHESES with gate verdicts)

- **What this section contains:** the research program for each remaining
  resource, with the roadmap §4 gate verdict and what evidence would promote each
  from hypothesis to metric:
  - **UCIR (Paper 2):** cost side exists (`utxo_cost_model.py`); fee-side
    attribution open; data path R5-gated (deferred until Phase I ships).
  - **VCIR (Paper 3):** demoted to bounded analytical sub-study (Q2 fail);
    pinned-benchmark bounds only, never a headline ratio.
  - **RCIR:** analytical bounds (tx size × replication × $/GB); low priority.
  - **BCIR:** research-hard (no public topology data).
  - **DCIR:** structural argument for the persistent-negative row; measurement
    open (commercial cost data).
- **Evidence status:** all 🟡/🔴 hypotheses. This section is the honest
  "what we will measure, not what we have measured" statement.

### §7 Cross-chain: methodology, not rankings (⚪ FRAMING, Phase V horizon)

- **What this section contains:** the generalization to any system with
  one-time payment → long-lived shared resource (Arweave, Celestia, Solana,
  Ethereum, Filecoin, IPFS — roadmap §9 fit map); **compare METHODOLOGY never
  rankings; no early ETH-vs-BTC comparison**; each new system must pass the
  4-question gate before a metric is named.
- **Evidence status:** ⚪ framing + research horizon (explicitly not a
  deliverable of Paper 4 beyond the methodology statement).

### §8 What would falsify this framework (⚪ FRAMING — required before submission)

- **What this section contains:** the framework-level falsifiers, expanded from
  working-paper §7.1: (1) independent implementations cannot reproduce SCCR;
  (2) a better storage-cost model reverses the conclusion; (3) fees consistently
  exceed modeled long-term costs; (4) resource-cost attribution shown
  economically inappropriate (attribute-pricing regression finds no persistence
  signal); (5) pruning census shows the storage burden is avoidable at scale;
  (6) measured response functions close the dynamic loop at or above 1×.
- **Evidence status:** ⚪ framing — this section states failure conditions; it
  is what makes the framework scientific rather than rhetorical.

### §9 Conclusion + Resource Coverage Matrix (🟢 + 🟡 consolidated)

- **What this section contains:** the consolidated matrix
  (resource × cost-exists × fee-prices × measurable × metric × evidence-status)
  from roadmap §3/§8 Q3; the one-sentence honest summary: *one established
  metric, six named hypotheses, one reproducible template, zero unfalsifiable
  claims.*

---

## Appendix A — Evidence-status master table (for the paper)

| Metric | Resource | Evidence status | Gate verdict | Phase |
|---|---|---|---|---|
| **SCCR** | Storage | 🟢 **ESTABLISHED METRIC (validated)** — measured, 3 implementations agree, MC-bounded | PASS 4/4 | Paper 1 (done) |
| **UCIR** | UTXO state | 🟡 **HYPOTHESIS** — cost leg exists, fee leg open | PASS w/ carve-out (validation leg scoped out) | Paper 2 |
| **VCIR** | Validation | 🔴 **HYPOTHESIS (demoted)** — Q2 fail | FAIL Q2 → bounded sub-study | Paper 3 |
| **RCIR** | Relay | 🟡 **HYPOTHESIS** — analytical bounds only | PASS (Phase III fill-in) | Paper 3/4 |
| **BCIR** | Propagation | 🔴 **HYPOTHESIS (research-hard)** — no topology data | FAIL Q2/Q3 | Phase III/IV |
| **DCIR** | Indexer serving | 🟡 **HYPOTHESIS** — structural argument only | PASS (persistent-negative by design) | Paper 4 |

## Appendix B — What is NOT in this paper (anti-scope)

- No new measurements beyond SCCR (Paper 1 owns those).
- No UCIR/VCIR/RCIR/BCIR/DCIR numbers — they do not exist yet; presenting them
  would be the exact overclaim the advisor flagged.
- No policy proposals, no normative claims about what should be priced.
- No cross-chain rankings.

---

## DONE vs LEFT

**DONE (verified):** outline created (this file); advisor's 6-part structure
mapped to §1–§6; evidence-status labels applied throughout; falsifiability
section required (§8) matching working-paper §7.1; cross-chain methodology kept
as framing (§7); positioned as Paper 4 per roadmap/publication-plan framing.
Working-paper.md/.html/.tex updated with the falsifiability section; roadmap §4
evidence-status table added; Q4 sharpened in working-paper §11 + roadmap §8;
publication-plan evidence discipline + checklist items added; decision tracker
addendum recorded.

**LEFT / TODO (verified):** write the paper itself (this is the outline, not the
paper — do NOT start the prose before Phase I publishes, roadmap §6 amendment 1);
Paper 2 (UCIR) data-path decision (R5-gated, deferred until Phase I ships);
Paper 3 (VCIR) pinned-benchmark study; Phase III RCIR fill-in; Phase V
cross-chain methodology note (research horizon). All metric promotions require
the roadmap §4 gate + evidence template.

---

*Bitcoin Sahi Research Council — Paper 4 outline (Bitcoin Resource Accounting:
A General Framework), 2026-08-03. Companion: roadmap.md §3/§4/§8, publication-plan.md,
working-paper.md §7.1/§11, docs/decisions/2026-08-02-publication-decisions.md.*
