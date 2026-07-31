# Protocol RFC — capture.fear_greed

**Status:** ACTIVE
**Source URL:** `https://api.alternative.me/fng/`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.fear_greed @ 1.0`
**Validator:** `tools/data-engineering/schemas/fear_greed.js`

## Response shape (real sample)

```json
{
  "name": "Fear and Greed Index",
  "data": [ { "value": "29", "value_classification": "Fear", "timestamp": "1785283200", "time_until_update": "12730" } ],
  "metadata": { "error": null }
}
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| name | string | — | yes | — |
| data[0].value | string (digits) | index 0–100 | yes | `/^\d+$/` |
| data[0].value_classification | string | enum | yes | Extreme Fear, Fear, Neutral, Greed, Extreme Greed |
| data[0].timestamp | string | unix seconds | yes | — |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
