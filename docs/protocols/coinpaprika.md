# Protocol RFC — capture.coinpaprika

**Status:** ACTIVE
**Source URL:** `https://api.coinpaprika.com/v1/coins/btc-bitcoin`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.coinpaprika @ 1.0`
**Validator:** `tools/data-engineering/schemas/coinpaprika.js`

## Response shape (real sample)

```json
{
  "id": "btc-bitcoin", "name": "Bitcoin", "symbol": "BTC", "rank": 1,
  "is_new": false, "is_active": true, "type": "coin",
  "hash_algorithm": "SHA256", "first_data_at": "...", "last_data_at": "..."
}
```

Note: the `quotes` object is NOT present in this endpoint's response — this endpoint returns
coin metadata. Price data comes from `btc_price` (mempool.space).

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| id | string | — | yes | must be `btc-bitcoin` |
| name | string | — | yes | — |
| symbol | string | — | yes | — |
| rank | integer | rank | yes | ≥ 1 |
| is_active | boolean | — | no | — |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
