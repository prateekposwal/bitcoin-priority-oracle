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

## Addendum 2 — advisor review deliverables (2026-08-03)

Second advisor review executed by TELOS (as Aviku); all items docs-only, no code:

- **Resource Map figure added (Figure 1).** One figure showing the whole
  framework: root = Bitcoin Fee Market; two branches = **Directly Priced**
  (Block Space) and **Indirectly Measured** (Storage/SCCR + UTXO/Validation/
  Relay/Bandwidth as FUTURE). ASCII version embedded in working-paper §1,
  roadmap §1, and framework-paper-outline (Figure 1); standalone assets
  `research/resource-map.txt` + `research/resource-map.svg` (dark theme,
  site-ready). The Directly/Indirectly split is the visual anchor.
- **Theory-paper outline restructured (framework-paper-outline.md).** Now a
  **mostly-theory, minimal-equations** plan: five-question spine (What is a
  resource? Which are scarce? Which are priced? Which are shared? Which are
  externalized?) with **SCCR as Example #1, not the headline**. Positioned as
  the framework-defining paper — the one that could "become the citation
  everyone references." Write THIS next (advisor sequencing), after Phase I.
- **arXiv moderator pitch recorded (publication-plan §2a).** The advisor's
  one-paragraph "Why is this paper interesting?" (does not argue the fee market
  is incorrect; reproducible empirical metric; broader contribution = proposed
  framework) — canonical submission framing, distinct from the technical
  abstract.
- **Evidence discipline reinforced.** Advisor's exact statement added to roadmap
  §4: *never "established metrics" for UCIR/VCIR/RCIR/BCIR/DCIR until they
  exist — always "proposed research directions."* Working paper + audience
  summaries audited: consistent (all future legs labeled research hypotheses).
- **D5 priority reinforced (unchanged blocker).** Advisor: external reproduction
  is **"worth far more than another 100 commits"** — THE highest-value remaining
  action; everything else is secondary. Recorded in publication-plan §4/§7 and
  this tracker. **D5 remains the ONLY submission blocker** (unchanged).

**Open items after addendum 2 (unchanged):** D2 ORCID, D3 arXiv account, D4
LICENSE ratification, **D5 external reproducer (the only submission blocker)**,
D6 LaTeX compile pass, D7 companion-note sign-off, + abstract/moderator-pitch
final pass (publication-plan §2 step 3 + §2a).

## Addendum 3 — advisor final directives (2026-08-03)

Final advisor review executed by TELOS (as Aviku) in `../block-space-economics`;
all items docs-only, no code:

- **WHY_THIS_EXISTS.md created** (repo root) — one page, questions only, no
  equations: the working block-space market, the unpriced long-lived resources,
  the internalization question, explicit non-claims, the invitation. High-
  visibility public document; may be read more than the paper.
- **Strategic rebranding to "Bitcoin Resource Accounting" continued.** The
  advisor's instruction: slowly stop branding as an SCCR project — the framework
  becomes the identity, metrics become implementations, SCCR becomes one chapter.
  Applied to README.md (title/tagline + research-focus now lead with the
  framework), roadmap.md (header note), research index page. Paper title
  untouched; dated SCCR-provenance HTML deliberately not over-rebranded.
- **Three-assets framing recorded** (roadmap §1): Asset 1 = the measurement
  (SCCR — what people cite); Asset 2 = the methodology (reproducibility — what
  reviewers appreciate); Asset 3 = the vision (Bitcoin Resource Accounting —
  what defines future work). Protect all three; they are different.
- **"Earn the right" discipline strengthened** (roadmap §4): "Frameworks grow
  through evidence, not naming" — do NOT invent UCIR/VCIR/RCIR before their
  time; SCCR must be accepted first; each new metric earns its name by evidence.
- **Submission-moment protocol added** (publication-plan §8) — the exact
  sequence the instant one independent person reproduces: freeze → tag v1.0.0 →
  Zenodo → arXiv → Delving Bitcoin → Bitcoin Optech → invite criticism; no more
  polishing. Numbered, executable.
- **v1.0.0 release checklist added** (publication-plan §9) — paper (all
  formats), model-spec, reproduction kit, WHY_THIS_EXISTS.md, audience
  summaries, companion note, **license decision APPLIED**.
- **D4 elevated to a PRE-FREEZE REQUIREMENT.** License ratification is no longer
  merely "awaiting final go" — the v1.0.0 freeze cannot ship with the
  "All Rights Reserved" stub. **D4 is now a pre-freeze blocker, distinct from
  D5.** D5 (external reproduction) remains the ONLY submission blocker.

**Open items after addendum 3:** D2 ORCID, D3 arXiv account, **D4 LICENSE
ratification (now a PRE-FREEZE requirement for v1.0.0)**, **D5 external
reproducer (the only submission blocker)**, D6 LaTeX compile pass, D7 companion-
note sign-off, + abstract/moderator-pitch final pass (publication-plan §2 step 3
+ §2a).

---
---

*Bitcoin Sahi Research Council — Publication decisions (2026-08-02), recorded by
TELOS (as Aviku). Extends research/author-identity.md, research/license-draft.md,
research/publication-plan.md.*
