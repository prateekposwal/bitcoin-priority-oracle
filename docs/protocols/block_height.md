# Protocol RFC — capture.block_height

**Status:** ACTIVE
**Source URL:** `https://blockstream.info/api/blocks/tip/height`
**Cadence:** 60 minutes (`expectedIntervalMinutes`)
**Schema:** `capture.block_height @ 1.0`
**Validator:** `tools/data-engineering/schemas/block_height.js`

## Response shape (real sample)

```json
960410
```

Scalar body — the payload IS a bare integer height (JSON-parsed number).

## Fields

| name | type | unit | required | range |
|------|------|------|----------|-------|
| (scalar) | integer | block height | yes | > 0 |

## Error semantics

Non-2xx or timeout → `{ status: 0, error, fetchedAt }`, `captured.satisfied: false`.
Retry on next cycle only.

## Version history

| version | date | what |
|---------|------|------|
| 1.0.0 | 2026-07-31 | initial |
