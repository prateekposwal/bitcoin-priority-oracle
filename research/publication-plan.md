# Phase I Publication Plan — Working Paper v2.1.0

**Status:** DRAFT (2026-08-02) — greenlit at roadmap adoption (Prateek, "continue :)")
**Scope:** submit `research/working-paper.md` v2.1.0 (SCCR storage paper) with the
archival-vs-pruned companion note (`research/archival-vs-pruned-note.md`).
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

1. **Author list & account.** Confirm the author list with Prateek (lead author
   name, affiliation if any, ORCID if available). arXiv accounts are free; a new
   submitter may need endorsement — first submissions to cs.* often require
   endorsement by an existing arXiv author. Check `arxiv.org` endorsement rules
   before submitting. *(ACTION — needs Prateek: arXiv account email + author
   details + any existing arXiv account.)*
2. **License.** arXiv requires a license choice. Recommend **arXiv perpetual
   non-exclusive license** (standard) or **CC BY 4.0** for maximal reuse. Note:
   the repo is currently **unlicensed** (LICENSE file is a stub) — decide whether
   the paper itself carries a license independent of the repo.
3. **Abstract.** Rewrite to arXiv constraints (~1 paragraph, ≤ ~1500 chars):
   state the question, the SCCR definition, the primary-source census (≥32K), the
   banded result (~22–29%, ~99–100% below 1×), and the reproducibility claim.
   The current abstract (working-paper §1) is close; trim to venue style.
4. **Source format.** arXiv accepts PDF or LaTeX. The repo holds Markdown +
   HTML (`research/working-paper.md`, `.html`). Decision needed: (a) submit the
   PDF export of working-paper.html as-is, or (b) generate a LaTeX source from the
   Markdown for arXiv-native rendering. Recommend (b) if effort is acceptable —
   LaTeX is the arXiv norm and reviewers expect it; (a) is the fast path.
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

- [ ] **Author list confirmed** (Prateek: name, affiliation/ORCID, arXiv account) — *needed from Prateek*
- [ ] **License chosen** (arXiv perpetual vs CC BY 4.0; repo LICENSE decision)
- [ ] **Abstract rewritten** to venue constraints, banded claims only
- [ ] **Units consistency pass** (every quantity tagged; no undated headline numbers)
- [ ] **Claims-within-evidence pass** (banded ~22–29% / ~99–100%; ≥32K lower bound; T=10 assumption stated)
- [ ] **Companion note final** (`archival-vs-pruned-note.md` — Prateek review pending)
- [ ] **Source format decided** (PDF export vs LaTeX)
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

## 6. DONE vs LEFT

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

*Bitcoin Sahi Research Council — Publication plan for working-paper v2.1.0 (Phase I), 2026-08-02*
