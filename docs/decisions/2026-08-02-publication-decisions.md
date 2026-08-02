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

---

*Bitcoin Sahi Research Council — Publication decisions (2026-08-02), recorded by
TELOS (as Aviku). Extends research/author-identity.md, research/license-draft.md,
research/publication-plan.md.*
