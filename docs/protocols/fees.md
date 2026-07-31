# Protocol RFC — capture.fees

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/fees/recommended`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.fees @ 1.1`
**Validator:** `tools/data-engineering/schemas/fees.js`

Schema 1.1: validators accept numeric strings (mempool.space intermittently string-types fees).

## Response shape (real sample)

```json
{ "fastestFee": 2, "halfHourFee": 1, "hourFee": 1, "economyFee": 1, "minimumFee": 1 }
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| fastestFee | integer | sat/vB | yes | ≥ 0 |
| halfHourFee | integer | sat/vB | yes | ≥ 0 |
| hourFee | integer | sat/vB | yes | ≥ 0 |
| economyFee | integer | sat/vB | yes | ≥ 0 |
| minimumFee | integer | sat/vB | yes | ≥ 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, envelope `captured.satisfied: false`.
No hot-looping; retry occurs on the next cycle. Unknown extra fields allowed (forward compat).

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
