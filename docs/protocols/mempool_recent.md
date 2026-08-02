# Protocol: mempool_recent

- **Source:** `mempool_recent` · schema `capture.mempool_recent@1.0`
- **Endpoint:** `https://mempool.space/api/mempool/recent`
- **What:** tx-level mempool snapshot of the last ~10 minutes: `txid`, `fee`, `vsize`, `value` per tx — the raw material for feerate distribution analysis.
- **Why:** `mempool` gives aggregate counts; this adds per-tx feerate distribution (the "feerate distribution" gap).
- **Cadence:** hourly (heavy endpoint — can take 10–30s when the CDN is loaded; timeout 45000ms).
- **Health:** maxLatency 30000ms / timeout 45000ms. Added 2026-08-02.
