# Protocol: raw_block_tip

- **Source:** `raw_block_tip` · schema `capture.raw_block_tip@1.0`
- **Chain (2 steps, same host — blockstream.info):**
  1. `https://blockstream.info/api/blocks/tip/hash` → tip hash
  2. `https://blockstream.info/api/block/:hash/raw` → full raw block (hex, ~1.2–2.4 MB)
- **What:** the COMPLETE raw block at the tip — every header and transaction in serialized form. This is the "raw blocks" gap: no other endpoint captures full block bytes.
- **Capture payload:** `{ blockHash, rawHex, size }` where `size = rawHex.length / 2` (bytes).
- **Why chosen over mempool.space raw:** mempool.space raw measured 28s vs blockstream 7s on 2026-08-02; same-host chain avoids cross-host hops.
- **Cadence:** hourly. ~30–60 MB/day on disk (captured-data mirror is gitignored, so no repo bloat).
- **Health:** maxLatency 30000ms / timeout 60000ms. Added 2026-08-02.
