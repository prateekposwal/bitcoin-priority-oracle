# External Reproduction Log

**Status:** 🟡 IN PROGRESS — kit verified reproducible-by-stranger (fresh-clone
simulation 2026-08-03 PASS); **actual external reproducer still NOT engaged —
that is the one remaining human step (Prateek sends the recruit message).**

---

## ✅ Fresh-clone simulation (2026-08-03) — the closest autonomous proxy

An uninvolved person was simulated exactly: fresh `git clone` of the public
repo into a clean temp dir, then **only** the published instructions
(`README.md` → "Reproduce in 30 seconds" + `research/reproduce/README.md` →
"Run all three") were followed. No insider knowledge, no extra files, no help.

| Path tested | Result |
|---|---|
| `python3 tools/research/reproduce.py` (one-command) | ✅ **PASS** — exit 0, prints avg **0.2186**, min 0.0584, max 0.8320, 171/171 below 1×, writes chart |
| `bash research/reproduce/cross_check.sh` (all three) | ✅ **PASS** — JS / Python / C all agree (avg 0.218605, min 0.058357, max 0.831961), VERDICT: ALL THREE AGREE |
| `gcc -O2 -o reproduce_sccr reproduce_sccr.c -lm` (C from source) | ✅ **PASS** — compiles clean on macOS, produces 0.2186 |
| Python 3.9 (system, no pip installs needed) | ✅ works (stdlib only for compute; chart skips gracefully if matplotlib absent) |
| Input data (171 entries, heights 960562→960732) | ✅ committed + versioned in `input/fee_history_capture.json`; `reproduce.py` **defaults to it** (no DB needed) |
| Node (JS impl) | ✅ works from clone |

### Gaps found and fixed by the simulation (all fixed, all committed)

1. **❌→✅ C binary missing in clones.** `cross_check.sh` step 3/3 called
   `./research/reproduce/reproduce_sccr`, but the binary is gitignored — a
   stranger following "Run all three" hit `No such file or directory` and the
   script failed (exit 1). **Fix:** `cross_check.sh` now auto-compiles the C
   source when the binary is absent (with a clear message + fallback gcc
   command).
2. **❌→✅ Scary sqlite errors in JS step.** `storage-ratio.js` in frozen-input
   mode still tried DB queries (`no such table: block_stats / research_findings`
   printed to stderr) and overwrote the committed dated report file in the
   clone. **Fix:** `SCCR_INPUT_FILE` mode is now fully DB-free and
   side-effect-free — no sqlite queries, no research_findings insert, no report
   file written; output explicitly says "frozen-input reproduction — no report
   written". Canonical live-DB behavior unchanged when env var absent.
3. **❌→✅ Heights not sorted (contiguous-set but unordered).** A stranger
   checking `heights == list(range(960562, 960733))` would get `False` even
   though all 171 heights were present. **Fix:** `input/fee_history_capture.json`
   normalized to ascending height order — order-invariant computation (verified:
   all three implementations still produce identical avg/min/max, and per-block
   values unchanged), so this is a pure determinism improvement. Reference
   outputs (`output/reproduce_sccr_python.json`, `sccr_chart.png`) regenerated.

## 📦 Shareable package (for the human step)

- **Repo (the whole package):** `https://github.com/prateekposwal/block-space-economics`
  (public; live at bitcoinsahi.com)
- **Protocol:** `research/reproduce/README.md` → *External reproduction protocol (3 steps)*
- **Input:** `research/reproduce/input/fee_history_capture.json` (171 entries, committed)
- **Expected output:** avg **0.2186**, min **0.0584**, max **0.8320**, 100% below 1×
- **Recruit message (copy-paste ready):** `research/reproduce/recruit-message.md`

## ⏳ The one remaining human step (requires Prateek)

External reproduction is **Prateek's task**: an *uninvolved* person must run the
3-step protocol. TELOS cannot recruit a real human, and autonomous posting is
blocked on two gates:

1. **arXiv is NOT yet live** (`TODO-bitcoin-oracle.md` R5: arXiv/Optech not
   submitted; awaiting Prateek's arXiv account/ORCID/license). The community
   review plan's outreach list is explicitly sequenced *after* the preprint
   URL exists, so those venues (Optech, Delving, bitcoin-dev, Chaincode,
   r/BitcoinEngineering) are not ready.
2. **The Nostr publisher uses Prateek's key** (`captured-data/nostr-key.json`,
   gitignored). Posting through `tools/marketing/publisher.js` would use his
   account — **not** something TELOS does without his explicit say-so.

**What Prateek does (≈5 min):** open `research/reproduce/recruit-message.md`,
copy the message into an email/DM to one person (friend, colleague, any
technically-literate non-crypto person), and send. Then record the result
below.

## When a result lands, record it here:

| Date | Reproducer | Language | Avg SCCR | Min | Max | Below 1× | Per-block max dev | Verdict |
|---|---|---|---|---|---|---|---|---|
| *(pending)* | | | | | | | | |

---

*Bitcoin Sahi Research — external reproduction log (working-paper v2.1.0,
model-spec v2.0.1). Simulation + fixes 2026-08-03.*
