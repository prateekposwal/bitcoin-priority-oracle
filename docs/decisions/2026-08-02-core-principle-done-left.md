# Decision — Core Principle: NEVER CONFUSE WITH UNDONE WORK (2026-08-02)

## Context
The architect was confused: TELOS repeatedly reported "the correction is DONE and correct"
while the work was uncommitted, unshipped, the live site still showed 0.0149, and bots were
racing to overwrite it. "Done" and "shipped" meant different things; no explicit DONE/LEFT list.

## Decision
Codify the principle as a load-bearing core rule in both TELOS and BSAHI:

1. **DONE vs LEFT is mandatory** — every report/status/plan ends with an explicitly labeled
   `DONE (verified)` list and a `LEFT / TODO (verified)` list. Mixing without labels = FAILURE.
2. **DONE means SHIPPED** — "done" = verified AND committed/pushed/deployed/live. Uncommitted
   or unshipped work goes in LEFT, never DONE.
3. **Pattern identification + gap filling** — on completion, scan for recurring patterns and
   structural gaps; propose or execute the fix that closes them.

## Canonical locations (written 2026-08-01 ~19:45 UTC)
- TELOS repo: `AGENTS.md`, `.opencode/skills/telos/SKILL.md`,
  `telos/core/identity/system_self.py` → `IdentityCore.core_principles` (+ `recognizes_principle()`)
- BSAHI repo: `AGENTS.md`, this decision file, `captured-data/decision-log.json` (trace #50)

## Verification
- Live site bitcoinsahi.com/learn.html: **0.0149** (NOT shipped) — confirmed via fetch
- Local learn.html: **0.1719** (corrected, UNCOMMITTED) — 82 dirty files
- Snapshot bot 19:23 UTC commit failed: pre-commit hook `node: command not found`
