# Protocol RFC — capture.lightning

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/lightning/statistics/latest`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.lightning @ 1.0`
**Validator:** `tools/data-engineering/schemas/lightning.js`

## Response shape (real sample)

```json
{
  "latest": {
    "id": 106271, "added": "2026-06-18T00:00:00.000Z",
    "channel_count": 40639, "node_count": 17408, "total_capacity": 478878771889,
    "tor_nodes": 8930, "clearnet_nodes": 4673, "unannounced_nodes": 2029
  }
}
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| latest.id | integer | id | yes | ≥ 0 |
| latest.channel_count | integer | channels | yes | ≥ 0 |
| latest.node_count | integer | nodes | yes | ≥ 0 |
| latest.total_capacity | number | sat | yes | ≥ 0 |
| latest.added | string | ISO date | no | — |
| latest.tor_nodes / clearnet_nodes | integer | nodes | no | ≥ 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
