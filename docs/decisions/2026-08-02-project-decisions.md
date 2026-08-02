# Project Decisions — scope, data source, deployment (2026-08-02)

Status: DRAFTED — awaiting Prateek's ratification. These three decisions were
owed for days and had never been written down. Each is documented with the
recommendation and rationale; the repo's working assumption is the recommended
option until Prateek ratifies or overrides.

---

## Decision 1 — Scope: v3 open research vs Oracle MVP

**Context:** the roadmap is written as a product (R4 stages 3–4: API, interactive
model UI, monetization), but the actual work produced is research (SCCR, working
paper, node census). R4 stage 2 (live data) is built and now healthy. v1
(priority oracle) and v2 (externality fee) were refuted on Reddit for sound
economic reasons — the live project is *open research into unpriced state storage*
(SCCR), not an oracle build.

**Recommendation: RESEARCH-FIRST (SCCR measurement + publication), site as showcase.**
- The SCCR finding is genuinely novel, reproducible, and falsifiable — that's the
  asset. The "oracle MVP" has no defensible product thesis after v1/v2 refutation.
- The static site + live data serves the research (public evidence, engagement).
- Oracle-MVP remains a future option only if research feedback reveals a real gap
  with a survivable incentive analysis (R5 gate).

**Prateek to confirm:** accept research-first, or reprioritize toward an oracle MVP.

---

## Decision 2 — Data source

**Context:** current stack is mempool.space-primary (10/17 endpoints) + blockstream
+ blockchair. Fee/mempool series is single-sourced: if mempool.space dies, 8 core
endpoints die. Local Bitcoin Core node exists but is ~320K blocks behind tip and
cannot serve `getblockstats`/`utxo_size_inc`.

**Recommendation: add fee failover (blockstream `fees/recommended` or blockchair
feerate) for the core fee/mempool series, and accept single-source + degraded
fallback for now.**
- Failover removes the single point of failure on the most load-bearing data.
- Sync the local Core node to tip is deferred (weeks of sync time; not needed for
  the current research-first scope). `utxo_size_inc` sub-task is explicitly
  dropped until the node is synced (documented, not silently abandoned).
- **Measured evidence (2026-08-02):** local Core node at block 644,223 of 960,718
  (67%), ~3.8GB downloaded in ~3 days — full IBD (~600GB) will not complete in a
  useful window for the current scope. Fallback adapters for fees/price/mempool
  (blockstream + blockchair) were implemented 2026-08-02 and verified live.

**Prateek to confirm:** proceed with fee failover + documented deferred node sync.

---

## Decision 3 — Deployment shape

**Context:** currently GitHub Pages static (live at bitcoinsahi.com) + local-Mac
launchd agents + GH Actions fallback. The GH Actions fallback was actively
destroying live data (now fixed — it reads committed rich history). R4 stage 3
(real backend: /api, Postgres history, interactive model UI, newsletter) is not built.

**Recommendation: keep the static + launchd + GH-Actions-fallback shape (fixed),
defer the VPS/backend build until the research-first scope shows product demand.**
- The fixed publishing path now serves rich live data at zero infra cost.
- A VPS backend is real cost + maintenance for a research showcase that doesn't
  need it yet; it becomes justified only if R5 feedback demands interactive tooling.

**Prateek to confirm:** accept current static deployment shape, defer backend.
