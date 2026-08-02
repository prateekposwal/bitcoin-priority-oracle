# Protocol: block_hash

- **Source:** `block_hash` · schema `capture.block_hash@1.0`
- **Endpoint:** `https://blockstream.info/api/blocks/tip/hash`
- **What:** SHA-256 block header hash of the current chain tip (64-char hex).
- **Why:** closes the "block header" capture gap — `blocks` gives the last 10 headers; this pins the live tip hash.
- **Cadence:** hourly with the DE capture agent.
- **Health:** maxLatency 8000ms / timeout 15000ms. Added 2026-08-02 (block-data completeness).
