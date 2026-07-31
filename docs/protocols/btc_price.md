# Protocol RFC — capture.btc_price

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/prices`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.btc_price @ 1.0`
**Validator:** `tools/data-engineering/schemas/btc_price.js`

## Response shape (real sample)

```json
{ "time": 1785505510, "USD": 63400, "EUR": 55284, "GBP": 47349, "CAD": 89047, "CHF": 51490, "AUD": 90502, "JPY": 10162779 }
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| time | integer | unix seconds | yes | ≥ 0 |
| USD | integer | per coin | yes | ≥ 0 |
| EUR | integer | per coin | yes | ≥ 0 |
| GBP | integer | per coin | yes | ≥ 0 |
| CAD | integer | per coin | yes | ≥ 0 |
| CHF | integer | per coin | yes | ≥ 0 |
| AUD | integer | per coin | yes | ≥ 0 |
| JPY | integer | per coin | yes | ≥ 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
