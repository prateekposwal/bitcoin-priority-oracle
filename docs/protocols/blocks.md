# Protocol RFC — capture.blocks

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/blocks?limit=10`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.blocks @ 1.0`
**Validator:** `tools/data-engineering/schemas/blocks.js`

## Response shape (real sample)

```json
[
  { "id": "00000000000000000002130ee678a8873070470fc9bf79aa471ec3ff6fb728ee",
    "height": 960409, "version": 537354240, "timestamp": 1785505363, "tx_count": 3582,
    "size": 1701196, "weight": 3993787,
    "merkle_root": "207b436f1dd7d07bd6d0636500fe4c4897b0023b9791257297035c14108d8f0d",
    "previousblockhash": "00000000000000000001606c53f39b2c64d1ba40a843c05cab86d15bb94fefad",
    "mediantime": 1785503217, "nonce": 1052649296, "bits": 386022100,
    "difficulty": 126231507121868.19 }
]
```

## Fields (per item)

| name | type | unit | required | range |
|------|------|------|----------|-------|
| id | string | 64-hex block hash | yes | `/^[0-9a-f]{64}$/` |
| height | integer | block height | yes | > 0 |
| timestamp | integer | unix seconds | yes | ≥ 0 |
| tx_count | integer | transactions | yes | ≥ 0 |
| size | integer | bytes | yes | ≥ 0 |
| weight | integer | weight units | yes | ≥ 0 |
| difficulty | number | difficulty | yes | > 0 |
| merkle_root | string | 64-hex | no | — |
| previousblockhash | string | 64-hex | no | — |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
More than 10 items is a schema violation. Retry on next cycle only.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
