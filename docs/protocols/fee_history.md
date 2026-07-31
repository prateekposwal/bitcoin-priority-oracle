# Protocol RFC — capture.fee_history

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/mining/blocks/fees/24h`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.fee_history @ 1.0`
**Validator:** `tools/data-engineering/schemas/fee_history.js`

## Response shape (real sample)

```json
[
  { "avgHeight": 960261, "timestamp": 1785419459, "avgFees": 4722216, "USD": 64843 },
  { "avgHeight": 960262, "timestamp": 1785420746, "avgFees": 4054608, "USD": 64972 }
]
```

## Fields (per item)

| name | type | unit | required | range |
|------|------|------|----------|-------|
| avgHeight | integer | block height | yes | > 0 |
| timestamp | integer | unix seconds | yes | ≥ 0 |
| avgFees | number | sat | yes | ≥ 0 |
| USD | number | per coin | no | ≥ 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Empty array is a schema violation. Retry on next cycle only.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
