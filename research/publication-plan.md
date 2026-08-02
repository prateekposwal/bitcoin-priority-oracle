# Phase I Publication Plan — "Storage Cost Internalization in Bitcoin's Fee Market" (Working Paper v2.1.0)

**Status:** DRAFT (2026-08-02) — greenlit at roadmap adoption (Prateek, "continue :)")
**Scope:** submit `research/working-paper.md` v2.1.0 (SCCR storage paper, now titled
**"Storage Cost Internalization in Bitcoin's Fee Market"**, keeping "The Bitcoin Block
Space Problem" as the program subtitle) with the archival-vs-pruned companion note
(`research/archival-vs-pruned-note.md`).
**Renamed 2026-08-02:** from "The Bitcoin Block Space Problem: Does the Fee Market
Internalize Long-Term Storage Costs?" — the new title is the economics-native phrasing
(see §8.3 Cost Internalization Ratio) and avoids the protocol-critique reading a Core
reviewer flagged (reviewer-simulation.md Reviewer A objection 3).
**Paper-series framing (roadmap):** this is **Paper 1** (storage). The roadmap's
Resource Internalization Framework continues as **Paper 2 (UTXO leg, UCIR)**, **Paper 3
(validation leg, VCIR as bounded study)**, **Paper 4 (unified Resource Coverage Matrix)** —
each builds on Paper 1's reproducible-metric template. Do NOT mix Paper 2–4 content into
Paper 1 (roadmap §6 amendment 1).
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

1. **Author list & account.** **RECOMMENDATION (Prateek to ratify):** author line
   = **Prateek Poswal, Independent Researcher** (Bitcoin Sahi Research Council
   acknowledged in the paper body, not the byline). Full three-option analysis,
   ORCID rationale, and exact signup steps in `research/author-identity.md`.
   arXiv accounts are free; a new submitter may need endorsement — first
   submissions to cs.* often require endorsement by an existing arXiv author.
   Check `arxiv.org` endorsement rules before submitting. *(ACTION — needs
   Prateek: arXiv account email + author details + any existing arXiv account +
   ORCID iD. Default if no response: Independent Researcher, no affiliation.)*
2. **License.** **RECOMMENDATION (Prateek to ratify):** **MIT** for code +
   **CC BY 4.0** for the paper, matched by the CC BY 4.0 license field on arXiv.
   Exact draft texts (LICENSE file replacement + paper notice + arXiv field) in
   `research/license-draft.md`. The repo LICENSE file is currently a stub
   ("All Rights Reserved") — do NOT change it until Prateek ratifies the pair.
3. **Abstract.** Rewrite to arXiv constraints (~1 paragraph, ≤ ~1500 chars):
   state the question, the SCCR definition, the primary-source census (≥32K), the
   banded result (~22–29%, ~99–100% below 1×), and the reproducibility claim.
   The current abstract (working-paper §1) is close; trim to venue style.
   Banded claims only — never the strong form (100% below 1×).
4. **Source format.** **DONE (2026-08-02):** full LaTeX source exists at
   `research/working-paper.tex` (compilable skeleton — abstract verbatim, all
   10 sections, 8 tables, references; conversion status noted in the file
   header). LaTeX toolchain NOT present on the dev machine (no pdflatex) —
   compile `pdflatex working-paper.tex` on any TeX installation before
   submission, and diff content against working-paper.md. Fallback remains the
   PDF export of working-paper.html.
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

- [ ] **Author list confirmed** (Prateek: ratify Independent Researcher + ORCID iD + arXiv account) — *needed from Prateek (see research/author-identity.md)*
- [ ] **License chosen** (recommend MIT code + CC BY 4.0 paper; drafts in research/license-draft.md; LICENSE file untouched until Prateek ratifies)
- [ ] **Abstract rewritten** to venue constraints, banded claims only
- [ ] **Units consistency pass** (every quantity tagged; no undated headline numbers)
- [ ] **Claims-within-evidence pass** (banded ~22–29% / ~99–100%; ≥32K lower bound; T=10 assumption stated)
- [ ] **Companion note final** (`archival-vs-pruned-note.md` — Prateek review pending)
- [ ] **Source format decided** — LaTeX source EXISTS (`research/working-paper.tex`); needs a compile pass on a machine with pdflatex (toolchain absent locally)
- [ ] **Reproducibility line intact**: model-spec v2.0.1 + three independent implementations (JS/Python/C) named
- [ ] **Prior-work honesty intact**: Liu et al. 2021 (arXiv:2103.05866) acknowledged as closest prior work; contribution = measurement, not the observation (working-paper §8.2)
- [ ] **Dead-claims audit**: no reference to v1/v2 oracle framing (refuted); no BIP-110 claim beyond documented DOA status

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
- [ ] Prateek: arXiv account + author list (name/affiliation/ORCID) + license preference
- [ ] Prateek: review `archival-vs-pruned-note.md` (data-gap framing sign-off)
- [ ] Abstract rewrite + LaTeX-or-PDF decision (mechanical once author/license known)
- [ ] Actual submission (arXiv upload + Optech pitch) — after Prateek's inputs land
- [ ] Post-publication: update TODO-bitcoin-oracle.md R5 item + site surfaces with the preprint URL

---

*Bitcoin Sahi Research Council — Publication plan for "Storage Cost Internalization in Bitcoin's Fee Market" (working-paper v2.1.0, Phase I), 2026-08-02*
