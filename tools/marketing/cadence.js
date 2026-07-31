// BSAHI — shared per-platform posting cadence windows (single source of truth).
// Mirrors compliant-content.js CADENCE and extends it to all platforms so
// ops-center, ledger-gate, and agent 18 cannot drift.
// WINDOW_HOURS: cross-stack global cap per platform — how long after a posted
// item on a platform another stack is blocked from posting there.
var WINDOW_HOURS = {
  nostr: 0.5,      // hourly cadence — burst guard only, preserves frequency
  twitter: 6,
  reddit: 6,
  linkedin: 12,
  medium: 24
};

var CADENCE = {
  reddit: { minHours: 6, maxPerDay: 2 },
  linkedin: { minHours: 12, maxPerDay: 1 },
  medium: { minHours: 24, maxPerDay: 1 },
  nostr: { minHours: 0.5, maxPerDay: 48 },
  twitter: { minHours: 6, maxPerDay: 4 }
};

function windowMs(platform) {
  return (WINDOW_HOURS[platform] || 24) * 3600000;
}

module.exports = { WINDOW_HOURS: WINDOW_HOURS, CADENCE: CADENCE, windowMs: windowMs };
