# Protocol RFC — capture.difficulty

**Status:** ACTIVE
**Source URL:** `https://mempool.space/api/v1/difficulty-adjustment`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.difficulty @ 1.1`
**Validator:** `tools/data-engineering/schemas/difficulty.js`

## Response shape (real sample)

```json
{
  "progressPercent": 39.48412698412698, "difficultyChange": -2.0994769221320375,
  "estimatedRetargetDate": 1786256956920, "remainingBlocks": 1220, "remainingTime": 748635920,
  "previousRetarget": -0.7383735253058887, "previousTime": 1785019866,
  "nextRetargetHeight": 961632, "timeAvg": 613636, "adjustedTimeAvg": 613636,
  "timeOffset": 0, "expectedBlocks": 814.0916666666667
}
```

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| difficultyChange | number | percent (signed) | yes | — |
| estimatedRetargetDate | integer | unix ms | yes | ≥ 0 |
| remainingBlocks | integer | blocks | yes | ≥ 0 |
| remainingTime | integer | ms | yes | ≥ 0 |
| nextRetargetHeight | integer | block height | yes | > 0 |
| timeAvg | integer | ms | yes | > 0 |
| progressPercent | number | percent | no | — |
| previousRetarget | number | percent | no | — |
| expectedBlocks | number | blocks | no | ≥ 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only. Unknown extra fields allowed.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
