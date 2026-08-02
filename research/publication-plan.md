# Phase I Publication Plan — "Storage Cost Internalization in Bitcoin's Fee Market" (Working Paper v2.1.0)

*Paper 1 of the **Bitcoin Resource Accounting** program (renamed 2026-08-02; the
program name is the framework identity — SCCR is Metric #1 — while this paper
keeps its descriptive title).*

**Status:** DRAFT (2026-08-02) — greenlit at roadmap adoption (Prateek, "continue :)");
publication decisions recorded 2026-08-02 (Prateek's directive) — see §7 + `docs/decisions/2026-08-02-publication-decisions.md`.
**Scope:** submit `research/working-paper.md` v2.1.0 (SCCR storage paper, now titled
**"Storage Cost Internalization in Bitcoin's Fee Market"**, keeping "The Bitcoin Block
Space Problem" as the program subtitle) with the archival-vs-pruned companion note
(`research/archival-vs-pruned-note.md`), **published simultaneously** (Prateek's
decision).
**Renamed 2026-08-02:** from "The Bitcoin Block Space Problem: Does the Fee Market
Internalize Long-Term Storage Costs?" — the new title is the economics-native phrasing
(see §8.3 Cost Internalization Ratio) and avoids the protocol-critique reading a Core
reviewer flagged (reviewer-simulation.md Reviewer A objection 3).
**Paper-series framing (roadmap):** this is **Paper 1** (storage). The **Bitcoin
Resource Accounting** program continues as **Paper 2 (UTXO leg, UCIR)**, **Paper 3
(validation leg, VCIR as bounded study)**, **Paper 4 (unified Resource Coverage
Matrix, incl. the DCIR indexer leg)** — each builds on Paper 1's reproducible-metric
template. Do NOT mix Paper 2–4 content into Paper 1 (roadmap §6 amendment 1).
**Evidence discipline (post-advisor review, 2026-08-03):** SCCR is the ONLY
**ESTABLISHED METRIC (validated)**; UCIR/VCIR/RCIR/BCIR/DCIR are **RESEARCH
HYPOTHESES (not yet modeled/measured/reproduced)** and must be labeled as such in
every surface — the framework never overclaims (roadmap §4 evidence-status table;
Paper 4 synthesis outline in `research/framework-paper-outline.md`).
**Target:** arXiv (cs.CR / econ.GN) + Bitcoin Optech newsletter; r/BitcoinEngineering
already engaged (v1/v2 history).

---

## 1. Target venues

| Venue | Where | What goes in | Notes |
|---|---|---|---|
| **arXiv** | arxiv.org, submit via account | Working paper v2.1.0 (+ companion note as appendix or separate posting) | Category: **cs.CR** (cryptography & security — Bitcoin/blockchain work is routinely filed here) or **econ.GN** (general economics — the framing is an externality/economics paper). Recommend cs.CR primary with the economics framing kept prominent in the abstract. arXiv is not peer-reviewed; it is a preprint server — the paper's reproducible-measurement asset maps well to it. |
| **Bitcoin Optech newsletter** | bitcoinops.org — newsletter submission/contact | Short research summary + link to preprint | Optech regularly cites new Bitcoin research. Submission is a summary pitch, not the full paper. Value: reaches node operators and engineers — exactly the "who bears the cost" audience. |
| (follow-on) **r/BitcoinEngineering** | reddit.com/r/BitcoinEngineering | Announcement thread + link | Existing community from v1/v2; post *after* arXiv is live (link-first). |
| (follow-on, optional) **Workshop/venue** | e.g. Bitcoin Research Day / academic workshops | Full paper | Only after community feedback validates the framing. Do NOT pre-commit. |

## 2. Submission steps (arXiv)

1. **Author list & account.** ✅ **DECIDED (Prateek, 2026-08-02):**
   author line = **Prateek Poswal, Independent Researcher** (program line
   "Bitcoin Sahi Research"; Council acknowledged in the paper body, not the
   byline). Full three-option analysis, ORCID rationale, and exact signup steps
   in `research/author-identity.md`. **arXiv = real identity** (Prateek's
   decision — no pseudonym). arXiv accounts are free; a new submitter may need
   endorsement — first submissions to cs.* often require endorsement by an
   existing arXiv author. Check `arxiv.org` endorsement rules before submitting.
   *(ACTION — Prateek: create ORCID **before submission** (D2) and provide the
   16-digit iD; create the arXiv account with his real identity (D3).)*
2. **License.** ✅ **RECOMMENDED (Prateek, 2026-08-02):** **MIT** for code +
   **CC BY 4.0** for the paper, matched by the CC BY 4.0 license field on arXiv.
   Exact draft texts (LICENSE file replacement + paper notice + arXiv field) in
   `research/license-draft.md`. **The repo LICENSE file remains a stub
   ("All Rights Reserved") — do NOT change it until Prateek's final ratification
   (recommended, awaiting final go).**
3. **Abstract.** Rewrite to arXiv constraints (~1 paragraph, ≤ ~1500 chars):
   state the question, the SCCR definition, the primary-source census (≥32K), the
   banded result (~22–29%, ~99–100% below 1×), and the reproducibility claim.
   The current abstract (working-paper §1) is close; trim to venue style.
   Banded claims only — never the strong form (100% below 1×).
4. **Source format.** ✅ **DECIDED (Prateek, 2026-08-02): submit LaTeX, not
   PDF-only.** Full LaTeX source exists at `research/working-paper.tex`
   (compilable skeleton — abstract verbatim, all sections, tables, references;
   conversion status noted in the file header). LaTeX toolchain NOT present on
   the dev machine (no pdflatex) — compile `pdflatex working-paper.tex` on any
   TeX installation before submission, and diff content against
   working-paper.md. Fallback remains the PDF export of working-paper.html.
5. **Units & notation consistency check.** The paper v2.1.0 already added units
   everywhere (dimensionless ratios, USD/block, nodes, yr). Before upload: run a
   final pass confirming (i) every table row carries units, (ii) SCCR is stated
   dimensionless, (iii) no bare "0.29" without a date+capture qualifier, (iv) the
   canonical live value is read from model-spec v2.0.1, never hardcoded
   (working-paper §5.3 discipline).
6. **Claims-within-evidence check.** Confirm every headline is the *banded*
   statement (~22–29%, ~99–100% below 1×, "lower bound ≥32K", "T=10 assumption"),
   not the strong form (100% below 1×). The strong form does not survive the real
   census (working-paper §5.4) — do not resurrect it in the arXiv abstract.
7. **Upload** → arXiv moderation (usually 1–3 business days) → preprint URL.
8. **Register the DOI/preprint URL** in the repo (TODO-bitcoin-oracle.md R5
   publication item + site surfaces).

## 3. Submission steps (Bitcoin Optech)

1. Draft a **2–4 sentence research summary**: what was measured (SCCR, live data,
   ≥32K census), the headline (fees cover ~22–29% of modeled 10-yr storage cost),
   and the reproducible framework. Keep it neutral — Optech is a technical
   newsletter, not an advocacy venue.
2. Submit via the Optech website contact/newsletter-submission path (or the
   publicly listed address), linking the arXiv preprint once live.
3. Follow up with the companion note's data-gap framing as the "what's next"
   line (split measurement, agent-26 probe) — it demonstrates research hygiene.

## 4. Pre-submit checklist (both venues)

- [x] **Author list** — ✅ DECIDED (Prateek 2026-08-02): Prateek Poswal, Independent Researcher (Bitcoin Sahi Research program line); arXiv = real identity. *(LEFT: ORCID iD — create BEFORE submission, D2)*
- [x] **License** — ✅ RECOMMENDED (Prateek 2026-08-02): MIT code + CC BY 4.0 paper. *(LICENSE file still untouched — awaiting Prateek's final go)*
- [ ] **Abstract rewritten** to venue constraints, banded claims only
- [ ] **Units consistency pass** (every quantity tagged; no undated headline numbers)
- [ ] **Claims-within-evidence pass** (banded ~22–29% / ~99–100%; ≥32K lower bound; T=10 assumption stated)
- [ ] **Companion note final** (`archival-vs-pruned-note.md` — Prateek's simultaneous-publication decision recorded; note content review pending)
- [x] **Source format** — ✅ DECIDED (Prateek 2026-08-02): **LaTeX, not PDF-only**; LaTeX source EXISTS (`research/working-paper.tex`); needs a compile pass on a machine with pdflatex (toolchain absent locally)
- [ ] **External reproduction** — 🚨 **CRITICAL PATH** (Prateek 2026-08-02: *the only thing worth delaying submission for*); protocol + log in `research/reproduce/`; do NOT submit until an uninvolved reproducer has run it (or delay waived)
- [ ] **Reproducibility line intact**: model-spec v2.0.1 + three independent implementations (JS/Python/C) named
- [ ] **Prior-work honesty intact**: Liu et al. 2021 (arXiv:2103.05866) acknowledged as closest prior work; contribution = measurement, not the observation (working-paper §8.2)
- [ ] **Dead-claims audit**: no reference to v1/v2 oracle framing (refuted); no BIP-110 claim beyond documented DOA status
- [ ] **Falsifiability section present** — working-paper §7.1 ("What would falsify
      this framework?", added 2026-08-03 post-advisor review); every submission
      surface (abstract, paper, companion note) states the banded claim and never
      the strong form
- [ ] **Evidence/hypothesis separation** — SCCR labeled ESTABLISHED METRIC; all
      other RIRs labeled RESEARCH HYPOTHESES wherever named (abstract, §11 Q3 table,
      roadmap references); no surface implies UCIR/VCIR/RCIR/BCIR/DCIR are results

## 5. What the archival-vs-pruned note adds to the submission

- **Addresses the obvious reviewer question** ("doesn't pruning destroy your
  storage-cost premise?") before it is asked — the note states the T=10/N
  conditioning explicitly.
- **Demonstrates measurement hygiene** — the data gap is *named* (census =
  reachability only) and the closing path is *specified* (agent-26 probing,
  survey, third-party reconciliation), not hand-waved.
- **Bounds the claim** — the note shows SCCR-as-computed is an upper bound on the
  burden borne by typical nodes if the pruned share is large, and that even a 78%
  pruning rate would not flip the headline (N_archival ≈ 7K vs the 7,130 knife
  edge) — turning a limitation into a quantified robustness statement.
- **Sequencing:** ships with or immediately after the paper; the actual split
  measurement is Phase I follow-on, *not* a submission blocker.

## 6. After-arXiv builds (ready now, deploy on publication)

### 6.1 Live SCCR dashboard + static API (built 2026-08-02)

The static site (GitHub Pages) cannot serve a dynamic backend API until the
deferred backend decision (R5-gated, TODO-bitcoin-oracle.md). The honest
interim is **static JSON endpoints shipped with every snapshot**:

| Static file | Serves as | Producer |
|---|---|---|
| `data/sccr.json` | live dashboard widget (learn.html) | `tools/research/sccr_live.py` |
| `data/sccr_latest.json` | `/sccr/latest` | `tools/research/sccr_live.py` |
| `data/sccr_history.json` | `/sccr/history` | `tools/research/sccr_live.py` |

- `python3 tools/research/sccr_live.py` computes the latest SCCR from the live
  capture and writes all three files (history appends, dedup by date).
- The snapshot agent (`tools/agents/19-web-snapshot-agent.js`) invokes it on
  every run, so `sccr*.json` ship with each `data/` publish.
- GH Actions fallback (`tools/generate_snapshot.py`) carries the last committed
  `sccr*.json` (runner has no local DB — it ships committed values, honest).
- `learn.html` now has a live SCCR dashboard section reading `data/sccr.json`.
- `/sccr/block/{height}` is NOT served statically (needs the full history map);
  documented as backend-only once the R5-gated backend lands. Do not claim it.

### 6.2 Interactive paper (Phase-4 goal — spec only, do NOT build now)

**Goal (after publication):** an interactive version of the paper where every
equation traces to data → code → result: "equation → data → code → result".

**Spec (what to build later, not now):**
1. Every model quantity in the paper (C, N, T, B_block, cb, L, L_net, SCCR)
   links to its `model-spec.json` entry and its producing script.
2. Every reported number links to the exact capture it came from (frozen input
   files in `research/reproduce/input/` are the traceable unit).
3. The SCCR chart (`research/reproduce/output/sccr_chart.png`) is regenerated
   live from `data/sccr_history.json` — the dashboard widget is the first
   interactive element already built.
4. Architecture: static HTML + the `data/sccr*.json` endpoints + a small JS
   renderer (same pattern as the learn.html dashboard section). No backend.
5. Content: a `/research/paper/` page with the paper text inline and
   data-links; equations rendered as MathML or KaTeX; each table cell marked
   with its traceability breadcrumb (spec entry → script line → capture file).

**Status:** SPEC ONLY (2026-08-02). Not started. Deferred until after the
preprint is live — building it now would delay submission and duplicate the
learn.html dashboard work already shipped.

## 7. DONE vs LEFT

**DONE (2026-08-03, peer-review execution):** reviewer-prescribed fixes applied to
working-paper.md / .tex / (HTML regenerated): abstract opening rewritten
(reviewer's suggested framing); §1 scope expanded (why-storage "first measurable
resource", storage≠state, 1× descriptive-not-normative stated early); §2 new
non-normative-1× bullet; §4.1 SCCR fraction diagram + explicit-notation block
(bundled C = C_storage+C_bandwidth+C_misc → storage-and-hosting coverage ratio;
cb(t)=C(t)/B_year(t) time-dependence; L_network=ΣL_i heterogeneous nodes ↔
archival-vs-pruned note; storage≠UTXO-state); §4.2 average-vs-marginal
discussion; §5.1 point-in-time discipline tied to cb(t); §7 limitations 2 & 7
strengthened (bundled C, why-storage); §8.1 voluntary-participation line.
Roadmap §10 added: seven reviewer-prescribed directions as RESEARCH HYPOTHESES
(Resource Attribution Theory, Resource Elasticity, Market Efficiency/Price
Discovery, Resource Vector, Cross-layer Accounting/Lightning, Miner Incentive
Accounting, Bitcoin Resource Index) with 4-question-gate promotion criteria.
New deliverable: `research/audience-summaries.md` (developers/researchers/
investors/general public). D5 remains the only submission blocker.

**DONE (2026-08-03, advisor-feedback execution):** working-paper §7.1
falsifiability section (md/html/tex); roadmap §4 evidence-status table +
hypothesis labels; framework-paper outline (`research/framework-paper-outline.md`,
Paper 4 synthesis); §11 Q4 + roadmap §8 Q4 sharpened ("no single resource
market" — attribute/stock-vs-flow mismatch, not USD-vs-CPU denomination);
publication-decisions tracker addendum (falsifiability = pre-submission item,
D5 confirmed critical path). See commit message.

**DONE (verified, 2026-08-02 execution plan):**
- Full LaTeX source (`research/working-paper.tex`) — compilable skeleton; toolchain NOT local (flag for compile pass).
- Author identity + ORCID recommendation (`research/author-identity.md`); license drafts (`research/license-draft.md`).
- Live SCCR dashboard + static API files (`tools/research/sccr_live.py`, `data/sccr*.json`, learn.html section, snapshot-agent wiring).
- Reproduction kit (frozen input, Python + C implementations, cross-check script) — three implementations all agree (0.2186, 171 blocks).
- Literature audit (`research/literature-audit.md`), reviewer simulation (`research/reviewer-simulation.md`), community review plan (`research/community-review-plan.md`).
- Paper renamed + reviewer fixes F1–F8 applied to working-paper.md; HTML regenerated.

**DONE (verified):**
- Venue analysis (arXiv cs.CR/econ.GN, Optech, follow-ons) with rationale.
- Submission steps for both venues, pre-submit checklist (10 items), companion-note contribution.
- Checklist items that do not need new input are all marked actionable in §4.

**LEFT / TODO (verified):**
- [ ] 🚨 **External reproduction** — CRITICAL PATH (Prateek 2026-08-02); the only
      submission-delaying item; protocol + log in `research/reproduce/`
- [ ] Prateek: ORCID iD (create BEFORE submission) + arXiv account (real identity)
- [ ] Prateek: review `archival-vs-pruned-note.md` (data-gap framing sign-off) —
      simultaneous publication decided
- [ ] Abstract rewrite (mechanical once ORCID/endorsement known)
- [ ] LaTeX compile pass (pdflatex on any TeX machine) — format decided: LaTeX
- [ ] Actual submission (arXiv upload + Optech pitch) — after the critical path clears
- [ ] Post-publication: update TODO-bitcoin-oracle.md R5 item + site surfaces with the preprint URL

## 7. Publication decisions — Prateek's directive (2026-08-02)

All seven recorded in `docs/decisions/2026-08-02-publication-decisions.md`:

| # | Decision | Prateek's guidance | Status |
|---|---|---|---|
| D1 | Author | Prateek Poswal, Independent Researcher (Bitcoin Sahi Research) | ✅ RECOMMENDED/RESOLVED |
| D2 | ORCID | Create BEFORE submission | 🟡 ACTION (pre-submission required) |
| D3 | arXiv identity | Real identity (no pseudonym) | ✅ RECOMMENDED/RESOLVED |
| D4 | License | MIT (code) + CC BY 4.0 (paper) | ✅ RECOMMENDED — LICENSE file change awaits final go |
| D5 | External reproducer | The ONLY thing worth delaying submission for | 🚨 CRITICAL PATH |
| D6 | Source format | Submit LaTeX, not PDF-only | ✅ RECOMMENDED/RESOLVED |
| D7 | Companion note | Publish simultaneously | ✅ RECOMMENDED/RESOLVED |

The roadmap rename (2026-08-02) makes this Paper 1 of **Bitcoin Resource
Accounting**; SCCR is Metric #1 of the RIR family (working-paper §11 Q3).

---

*Bitcoin Sahi Research Council — Publication plan for "Storage Cost Internalization in Bitcoin's Fee Market" (working-paper v2.1.0, Phase I), 2026-08-02*
