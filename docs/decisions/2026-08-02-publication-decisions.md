# Publication Decisions — Prateek's Directive (2026-08-02)

**Status:** RECORDED 2026-08-02 — Prateek gave recommendations on all seven
publication decisions. Four are RESOLVED/RECOMMENDED, one is a pre-submission
ACTION (ORCID), one is the CRITICAL PATH (external reproducer), one is
RECOMMENDED but awaiting final ratification (LICENSE file change). Recorded by
TELOS (as Aviku). Companion to `docs/decisions/2026-08-02-project-decisions.md`
(the scope/data-source/deployment bundle, ratified 2026-08-02).

---

## The seven decisions

| # | Decision | Prateek's guidance (verbatim intent) | Status | Blocking? |
|---|---|---|---|---|
| **D1** | Author identity | "Author = Prateek Poswal (Independent Researcher, Bitcoin Sahi Research)" | ✅ **RECOMMENDED / RESOLVED** — byline `Prateek Poswal, Independent Researcher`; "Bitcoin Sahi Research" as program line (matches the LaTeX `\author` block already in `research/working-paper.tex`) | No |
| **D2** | ORCID | "create before submission" | 🟡 **ACTION — REQUIRED BEFORE SUBMISSION** — sign up at https://orcid.org/register, add 16-digit iD to publication-plan §2 + LaTeX `\author` block | Yes (pre-submission) |
| **D3** | arXiv account | "arXiv = real identity" | ✅ **RECOMMENDED / RESOLVED** — real name, no pseudonym; create account at https://arxiv.org/user; check cs.* endorsement policy | No (endorsement may gate timing) |
| **D4** | License | "MIT (code) + CC BY 4.0 (paper)" | ✅ **RECOMMENDED — awaiting final go** — matches the drafts in `research/license-draft.md`; **the `LICENSE` file is NOT changed until Prateek explicitly ratifies** (recommended, awaiting final ratification) | No (must ratify before LICENSE edit) |
| **D5** | External reproducer | "the only thing worth delaying submission for" | 🚨 **CRITICAL PATH** — protocol + log in `research/reproduce/`; do NOT submit until an uninvolved reproducer has run it, or the delay is explicitly waived | **Yes — the only submission-delaying item** |
| **D6** | Source format | "submit LaTeX not PDF-only" | ✅ **RECOMMENDED / RESOLVED** — `research/working-paper.tex` is the submission source; compile pass (pdflatex) still required (toolchain absent locally) | No |
| **D7** | Companion note | "publish simultaneously" | ✅ **RECOMMENDED / RESOLVED** — `archival-vs-pruned-note.md` ships with or as part of the paper | No |

## What this unlocks

- **Submission is unblocked except:** D2 (ORCID before upload) and D5 (external
  reproduction — the ONLY thing Prateek says is worth delaying for). D4 does not
  block submission (arXiv license field can be set at upload; the repo LICENSE
  edit awaits ratification).
- **Post-decision actions already executed 2026-08-02:** all seven recorded
  here; author-identity.md / license-draft.md / publication-plan.md updated;
  roadmap rename to **Bitcoin Resource Accounting** (Paper 1 title unchanged);
  working-paper §11 (deep questions Q1–Q5) + §12 (cross-chain) added with model
  output from `tools/research/sccr_dynamics.py`.

## Open items after this record

- [ ] Prateek: create ORCID iD (D2) and provide the 16-digit ID
- [ ] Prateek: create arXiv account with real identity (D3)
- [ ] Prateek: final ratification of the LICENSE pair (D4) — then apply the MIT
      text to `LICENSE` + CC BY 4.0 notice to paper headers/README
- [ ] External reproducer: recruit + run (D5 — critical path)
- [ ] LaTeX compile pass on a machine with pdflatex (D6)
- [ ] Companion note content review sign-off (D7)


## Addendum — advisor review (2026-08-03)

External advisor feedback on the **Bitcoin Resource Accounting** program reviewed
by TELOS (as Aviku); clear wins executed 2026-08-03:

- **D5 confirmed as the only submission-delaying item.** The advisor's "external
  reproduction is the only real blocker" matches this tracker's critical-path
  status; no change. (Two distinct things, per advisor: independent
  implementations prove software correctness; independent researchers prove
  scientific credibility.)
- **New pre-submission item added:** "What would falsify this framework?" section
  (working-paper §7.1, added 2026-08-03 in .md/.html/.tex) — required before
  submission, alongside the banded-claim discipline.
- **Evidence/hypothesis separation enforced** — roadmap §4 evidence-status table
  (SCCR = ESTABLISHED METRIC (validated); UCIR/VCIR/RCIR/BCIR/DCIR = RESEARCH
  HYPOTHESES (not yet modeled/measured/reproduced)); publication-plan evidence
  discipline + two new pre-submit checklist items.
- **Paper-4 synthesis outline created** (`research/framework-paper-outline.md`)
  per the advisor's 6-part structure ("Bitcoin Resource Accounting: A General
  Framework"); positioned as Paper 4 / the unified framework paper. Outline
  only — the paper is NOT written (roadmap §6 amendment 1: no Paper 2–4 prose
  before Phase I ships).
- **"Price can't solve everything" insight sharpened** (working-paper §11 Q4 +
  roadmap §8 Q4): the sharper claim is an attribute / stock-vs-flow mismatch
  between the fee's charging unit and each cost driver — not a USD-vs-CPU
  denomination claim (hardware/time carry USD opportunity cost; price lifts any
  aggregate ratio as a unit effect).

**Open items after addendum (unchanged unless noted):** D2 ORCID (create before
submission), D3 arXiv real-identity account, D4 LICENSE ratification (file
untouched), D5 external reproducer (critical path), D6 LaTeX compile pass
(§7.1 now included in the source), D7 companion-note sign-off, + falsifiability
section folded into the abstract/claims pass (publication-plan §4).

---
---

*Bitcoin Sahi Research Council — Publication decisions (2026-08-02), recorded by
TELOS (as Aviku). Extends research/author-identity.md, research/license-draft.md,
research/publication-plan.md.*
