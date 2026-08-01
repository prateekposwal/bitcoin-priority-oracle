# Decision 2026-08-01 — Per-Persona Nostr Keys (planned, not yet executed)

**Status:** PLANNED — documented for the next sprint, not implemented.

## Current state
- One Nostr identity (`captured-data/nostr-key.json`, loaded by `tools/marketing/publisher.js` `keys()`) is used for all 5 personas.
- Post-log entries carry a `persona` field (satoshi/hal/lisa/wei/nick) but publish under the same pubkey.
- NIP-05 `_@bitcoinsahi.com` → pubkey `44744d037e50a4f3bc6b44b9ca7c5a3f52e68b0f70789696ccb7e28e274d2d61`.

## Problem
- No per-persona attribution/credibility — all posts trace to one pubkey.
- The Research Council presents 5 distinct specialists, but on-chain they read as one identity.

## Migration plan
1. Generate 5 keypairs via `generateSecretKey()`.
2. Per-persona identity envelope in `captured-data/persona-keys.json`:
   `{ persona, pubkey, privkey, profile: {name, about, picture}, createdAt }`.
3. `publish()` picks the key by `post.persona`.
4. Nostr `metadata` (kind 0) per persona.
5. Post-log backfill: keep legacy `eventId`s, add `pubkey` field.
6. RSS unchanged (guids stay eventIds).
7. Rollback: single-key fallback flag.

## Risks
- Private key custody (5 keys to protect).
- Cross-relay profile propagation (each persona's metadata must reach all 6 relays).
- Feed continuity during cutover.

## When
- After the medium ranking unlocks are live (JSON-LD, og:image, research pages, SW).
- Do not attempt mid-migration to avoid identity fragmentation.

## Evidence
- `tools/marketing/employees.js` (5 personas, shared key path)
- `captured-data/post-log.json` (persona field, one pubkey)
- `docs/decisions/` (this decision-record convention)
