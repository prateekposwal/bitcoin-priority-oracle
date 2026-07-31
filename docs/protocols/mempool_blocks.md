# Protocol RFC — capture.mempool_blocks

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/fees/mempool-blocks`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.mempool_blocks @ 1.0`
**Validator:** `tools/data-engineering/schemas/mempool_blocks.js`

## Response shape (real sample)

```json
[
  { "blockSize": 1669134, "blockVSize": 997963.5, "nTx": 4767, "totalFees": 2552420, "medianFee": 1.2048722511819614, "feeRange": [1, 1.0034843205574913, 1.0078909612625537] }
]
```

## Fields (per item)

| name | type | unit | required | range |
|------|------|------|----------|-------|
| blockSize | number | bytes | yes | ≥ 0 |
| blockVSize | number | vbytes | yes | ≥ 0 |
| nTx | integer | transactions | yes | ≥ 0 |
| totalFees | integer | sat | yes | ≥ 0 |
| medianFee | number | sat/vB | yes | ≥ 0 |
| feeRange | array | sat/vB quantiles | yes | length ≥ 2 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Empty array is a schema violation. Retry on next cycle only.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
