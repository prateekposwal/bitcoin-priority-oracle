# Decision — Publishing queue policy + SCCR correction (2026-08-02)

## Context
- The publishing bridge is OFF by M4 design. 58-86 queued items accumulate
  (publishing-queue.json shows 86 items; ~58 are on disk in reports/marketing/queue/).
- 26 pending queue items still carried the v1.0.0 SCCR figure (0.0149 / 1.49% / 1.5%),
  which was corrected in v2.0.0/v2.0.1 (duplicated time-horizon bug; N reclassified to
  the real 32K census). Live re-measure 2026-08-02 = **0.2252**.

## Decisions
1. **Queue policy: STAY OFF (bridge off), no publish-on-cadence.** The backlog is
   content that predates the SCCR correction and the N=32K census. Publishing a
   backlog on a schedule would ship stale research framing to public channels.
   Re-opened publishing must be intentional: review the backlog item-by-item against
   the canonical model-spec v2.0.1, update figures, then publish a curated set.
2. **All pending queue items were swept to the corrected figure (2026-08-02):**
   the 26 items carrying 0.0149 / 1.49% / 1.5% now state **0.2252 (live re-measure,
   N=32K census)**. Zero stale-figure items remain in the queue (verified by grep).
3. **Pinned correction for already-published v1.0.0 posts:**
   - Nostr events from the v1.0.0 period were intentionally NOT retro-edited
     (immutability + honest provenance — see
     `docs/decisions/2026-08-02-sccr-v2-correction.md`).
   - Correction channel: the public learn.html and working paper carry the corrected
     figure, and this decision record is the authoritative correction note. A
     pinned Nostr correction post is a TODO (drafted, not yet published — bridge off).
4. **Never re-publish a hardcoded ratio:** all new content must read the live value
   from `node tools/research/storage-ratio.js` or the canonical model-spec v2.0.1.

## Status
Drafted and applied (queue sweep done). Awaiting Prateek's ratification of the
"stay off / curated re-open" policy.
