# Protocol RFC — capture.blockchair

**Status:** ACTIVE
**Source URL:** `https://api.blockchair.com/bitcoin/stats`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.blockchair @ 1.0`
**Validator:** `tools/data-engineering/schemas/blockchair.js`

## Response shape (real sample)

```json
{
  "data": {
    "blocks": 960142, "transactions": 1407106043, "outputs": 3850287258,
    "circulation": 2006291479155096, "blocks_24h": 128, "transactions_24h": 583418,
    "difficulty": 126231507121868.2, "volume_24h": 104109770316233,
    "mempool_transactions": 2777, "mempool_size": 1112644, "mempool_tps": 2.9166666666666665,
    "mempool_total_fee_usd": 2734.3651, "best_block_height": 960141
  }
}
```

## Fields (inside `data` wrapper)

| name | type | unit | required | range |
|------|------|------|----------|-------|
| data.blocks | integer | blocks | yes | > 0 |
| data.transactions | integer | transactions | yes | ≥ 0 |
| data.best_block_height | integer | block height | yes | > 0 |
| data.difficulty | number | difficulty | yes | > 0 |
| data.mempool_transactions | integer | transactions | yes | ≥ 0 |
| data.market_price_usd | number | per coin | yes | > 0 |
| data.mempool_size | integer | bytes | no | ≥ 0 |
| data.block_time | integer | seconds | no | > 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
