# Protocol RFC — capture.mining_pools

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/mining/pools/weekly`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.mining_pools @ 1.0`
**Validator:** `tools/data-engineering/schemas/mining_pools.js`

## Response shape (real sample)

```json
{
  "pools": [
    { "poolId": 1, "name": "Unknown", "link": "https://learnmeabitcoin.com/technical/coinbase-transaction",
      "blockCount": 220586, "rank": 1, "emptyBlocks": 84030, "slug": "unknown",
      "avgMatchRate": 98.95, "avgFeeDelta": "-0.06039664", "poolUniqueId": 0 },
    { "poolId": 45, "name": "AntPool", "blockCount": 109054, "rank": 2, "slug": "antpool",
      "avgMatchRate": 99.09, "avgFeeDelta": "0.36297888", "poolUniqueId": 44 }
  ],
  "totalBlockCount": 520217
}
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| pools | array | pool objects | yes | length ≥ 1 |
| pools[0].poolId | integer | id | yes | — |
| pools[0].name | string | name | yes | — |
| pools[0].blockCount | integer | blocks | yes | ≥ 0 |
| pools[0].rank | integer | rank | yes | ≥ 1 |
| pools[0].slug | string | slug | no | — |
| pools[0].avgMatchRate | number | percent | no | — |
| pools[0].avgFeeDelta | string | percent | no | — |
| totalBlockCount | integer | blocks | yes | ≥ 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Empty pools array is a schema violation. Retry on next cycle only.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
