# Resource Internalization Framework — Research Roadmap

**Status:** **ADOPTED (2026-08-02)** — Prateek adopted the roadmap WITH the §6
amendments on 2026-08-02 ("continue :)" ratification). Phase I publication path
greenlit; UCIR data-path decision deferred until Phase I ships. Recorded by TELOS
(as Aviku). Consistent with ratified Decision 1 (research-first scope, see
`docs/decisions/2026-08-02-project-decisions.md`). Companion to `working-paper.md`
v2.1.0 and `model-spec.json` v2.0.1.

---

## 1. The reframe

The working paper (v2.1.0) is currently framed as *the storage paper*. The roadmap
reframes the program from **"storage measurement"** to a broader thesis:

> **Can all long-lived resource costs (storage, UTXO maintenance, validation,
> bandwidth, relay, propagation) be expressed in ONE reproducible accounting
> framework, each with its own measurable Cost Internalization Ratio — and which
> resources are efficiently priced, partially internalized, or largely
> externalized under different network conditions?**

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
  already exist — JS/Python/C), SCCR over time (automated tracking; manual only now),
  sensitivity (exists), limitations (exists).
- **Phase II — Resource Accounting Framework, one new metric per resource:**
  - **UCIR** (UTXO Growth): RAM/lookup/validation cost per lifetime UTXO
  - **VCIR** (Validation): CPU per script class (P2PKH / P2WPKH / Taproot / multisig)
  - **RCIR** (Relay): marginal bandwidth per tx
  - **BCIR** (Propagation): witness size vs block propagation delay
- **Phase III — Unified framework:** Resource Coverage Matrix
  (resource × cost-exists × fee-prices × measurable × metric) consolidating all
  ratios under one formula:
  `ResourceInternalizationRatio_i = fee_contribution_toward_i / estimated_lifetime_cost_of_i`
- **Phase IV — Dynamic questions:** SCCR over time (2015 / 2017 SegWit / 2021 /
  2023 Ordinals / today); network-evolution equilibrium (does SCCR move toward 1 as
  nodes/price/fees/L2 grow?). Overlaps working-paper §10 (see §4).
- **Phase V — Cross-chain:** apply the framework to Ethereum / Litecoin / Monero;
  compare METHODOLOGY not rankings; NO early ETH-vs-BTC comparison.

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

## 5. Mapping to existing repo state (DONE vs LEFT)

**DONE (verified) — already in the repo and load-bearing for the roadmap:**

- **Storage leg (SCCR) is complete and canonical** — `model-spec.json` v2.0.1;
  `tools/research/storage-ratio.js`; three independent implementations (JS/Python/C);
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

**Phase I deliverables produced at adoption:** `research/archival-vs-pruned-note.md`
(companion note, honest data-gap framing — the census captures reachable node
count N but NOT the pruned-vs-archival split) and `research/publication-plan.md`
(arXiv/Optech submission checklist).

---

*Bitcoin Sahi Research Council — Resource Internalization Framework Roadmap (2026-08-02)*
