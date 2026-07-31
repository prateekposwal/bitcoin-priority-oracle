# Protocol RFC — capture.mining_pools

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/mining/pools/weekly`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.mining_pools @ 1.1`
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
  "blockCount": 520217,
  "lastEstimatedHashrate": 861120000000000000000000,
  "lastEstimatedHashrate1w": 865493241447024300000000
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
| blockCount | integer | blocks (total all pools) | yes | ≥ 0 |
| lastEstimatedHashrate | number | hashes/s | no | ≥ 0 |

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
| 1.1.0 | 2026-07-31 | corrected top-level field to `blockCount` (was `totalBlockCount`) per real API |
