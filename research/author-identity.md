# Author Identity & ORCID — Recommendation (Pre-Submission)

**For:** arXiv submission of working-paper v2.1.0 (SCCR storage paper)
**Status:** RECOMMENDATION — final choice is Prateek's decision (see DECISIONS)
**Date:** 2026-08-02

---

## 1. Author identity — the three options

| Option | Author line | Standard? | Notes |
|---|---|---|---|
| **A. Independent researcher (RECOMMENDED)** | **Prateek Poswal**, Independent Researcher | ✅ Standard for solo research projects | Clean, honest, no affiliation to maintain. arXiv allows "Independent Researcher" or no affiliation at all. Matches the reality: this is a solo research effort. |
| B. Bitcoin Sahi Research | Prateek Poswal, Bitcoin Sahi Research | Acceptable | Reads like a lab/company; on arXiv most such affiliations are universities. "Bitcoin Sahi Research" is not a legal entity with a stable identity record — could raise "who is this?" friction with moderators. |
| C. Bitcoin Sahi Research Council | Prateek Poswal, Bitcoin Sahi Research Council | Not recommended for the arXiv byline | The Council is the repo's internal research body (the paper's own footer names it). Using it as an arXiv affiliation conflates the internal authoring process with an external identity. Keep it as a *research program* mention in the acknowledgements, not the byline. |

**Recommendation: Option A** — `Prateek Poswal, Independent Researcher`.
Solo research projects submit this way routinely; it is the least friction and
the most honest. The Council can be acknowledged in the paper body ("Prepared
within the Bitcoin Sahi Research Council program") without being the byline.

**Consistency rule:** whatever is chosen must be identical in (a) arXiv byline,
(b) working-paper.md header, (c) working-paper.html header, (d) README © line
(already "Prateek Poswal"), (e) publication-plan.md, (f) the LaTeX source.
Currently the paper header says "Bitcoin Sahi Research Council · 2026-08-02" —
under Option A this becomes "Prateek Poswal · Independent Researcher · 2026-08-02"
(or a footer line "Prepared within the Bitcoin Sahi Research Council program").

## 2. Why ORCID matters

- **Identity disambiguation** — ORCID is the researcher identifier used by
  arXiv, journals, Crossref, and databases. "Prateek Poswal" is not unique;
  ORCID makes *this* author unambiguous.
- **arXiv requires or strongly recommends it** — a submitter profile with an
  ORCID iD is the norm; some categories flag submissions without one.
- **Auto-linking** — arXiv links your ORCID to the preprint; the DOI registration
  (if the paper later gets a journal DOI) ties back to the same profile.
- **Future papers** — the roadmap's Paper 2/3/4 (UTXO, validation, framework)
  will accumulate on one profile, building citation credit.

## 3. ORCID signup — exact steps (5 minutes)

1. Go to **https://orcid.org/register**.
2. Create an account (email + password) — personal email recommended (not a
   work email that could vanish).
3. Verify the email via the confirmation link.
4. In the profile, add **name**: Prateek Poswal. (Optionally add country and
   keywords — not required for arXiv.)
5. Optional but recommended: link **Google Scholar** and/or **Scopus** (Profile →
   "Works" → "Link works"). This is where future citations aggregate.
6. Note the 16-digit iD (format `0000-0001-XXXX-XXXX`). Add it to
   `research/publication-plan.md` §2 and the LaTeX source (`\author` block) once
   you have it.
7. When submitting to arXiv, enter the ORCID iD in the author profile field.

## 4. Where the identity must be applied (once decided)

- [ ] `research/working-paper.md` header line (title block)
- [ ] `research/working-paper.html` (regenerate via `tools/generate_research_pages.py`)
- [ ] `research/working-paper.tex` (`\author` block) — created in this execution plan
- [ ] `research/publication-plan.md` §2 (author list item)
- [ ] README.md © line (already correct: Prateek Poswal)
- [ ] arXiv submission account (new account: author email + name)

---

## DECISIONS NEEDED (Prateek)

- **D1 — Author identity:** confirm Option A (Prateek Poswal, Independent
  Researcher). Alternatives: B (Bitcoin Sahi Research) or C (Council, not
  recommended). *Default if no response: Option A.*
- **D2 — ORCID:** create the ORCID iD (steps above) and provide the 16-digit iD.
  *Not required to block other prep, but required before arXiv upload.*
- **D3 — arXiv account:** create the submitter account
  (https://arxiv.org/user) — the email you use is the submitter identity.
  Note: first submissions to cs.* may require endorsement by an existing arXiv
  author; check the endorsement policy at submission time.

---

*Bitcoin Sahi Research — author identity recommendation for working-paper v2.1.0
(2026-08-02). Extends publication-plan.md §2.*
