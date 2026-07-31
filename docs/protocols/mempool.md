# Protocol RFC — capture.mempool

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/mempool`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.mempool @ 1.0`
**Validator:** `tools/data-engineering/schemas/mempool.js`

## Response shape (real sample)

```json
{
  "count": 90129,
  "vsize": 43521925,
  "total_fee": 10316370,
  "fee_histogram": [[7.5, 50010], [4.571429, 50056], [3.878049, 55830]]
}
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| count | integer | transactions | yes | ≥ 0 |
| vsize | integer | vbytes | yes | ≥ 0 |
| total_fee | integer | sat | yes | ≥ 0 |
| fee_histogram | array | `[feeRate sat/vB, vsize vbytes]` pairs | yes | — |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
