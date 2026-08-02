# Protocol: hashrate

- **Source:** `hashrate` · schema `capture.hashrate@1.0`
- **Endpoint:** `https://mempool.space/api/v1/mining/hashrate/24h`
- **What:** 24h averaged network hashrate series + current hashrate + difficulty.
- **Why:** miner/mempool stats were incomplete (mining_pools weekly + difficulty only). Hashrate is the core miner health metric.
- **Cadence:** hourly.
- **Health:** maxLatency 10000ms / timeout 30000ms. Added 2026-08-02.
