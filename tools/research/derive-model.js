#!/usr/bin/env node
// BSAHI — derive-model.js: SINGLE evaluator for research/model-spec.json.
// The spec says: "Formulas live in this file; derive-model.js is the ONLY
// place formulas are evaluated; scripts import values."
// Recomputes every `derived` quantity from its `formula` string (evaluated
// explicitly per key — NO eval()), prints the full quantity table, verifies
// each recomputed value matches the stored `value` field within tolerance,
// and exits 0 on success / 1 on any mismatch.
var SPEC = require('../../research/model-spec.json');

function get(name) {
  var q = SPEC.quantities[name];
  if (!q) throw new Error('unknown quantity: ' + name);
  return q.value;
}

// ── Wire formulas (explicit per-key evaluation; mirrors spec formula strings) ──
var WIRE = {
  R_blocks: function() { return 365.25 * 24 * 6; },
  B_all_yr: function() { return get('B_block') * get('R_blocks'); },
  B_insc_yr: function() { return get('I_bytes') * get('I_rate') * 12; },
  cb:       function() { return get('C') / get('B_all_yr'); },
  cb_insc:  function() { return get('C_insc') / get('B_insc_yr'); },
  L:        function() { return get('cb') * get('B_block') * get('T'); },
  L_net:    function() { return get('L') * get('N'); },
  L_insc:   function() { return get('cb_insc') * get('I_bytes') * get('T'); },
  bw_GB_yr: function() { return get('B_all_yr') / 1e9; },
  bw_cost_per_year_node: function() { return get('B_all_yr') * get('cost_per_gb') / 1e9; },
  bw_cost_per_year_net: function() { return get('bw_cost_per_year_node') * get('N'); },
  bw_insc_incr_node: function() { return get('B_insc_yr') * get('cost_per_gb') / 1e9; }
};

var ORDER = ['R_blocks', 'B_all_yr', 'B_insc_yr', 'cb', 'cb_insc', 'L', 'L_net', 'L_insc', 'bw_GB_yr', 'bw_cost_per_year_node', 'bw_cost_per_year_net', 'bw_insc_incr_node'];
var computed = {};
ORDER.forEach(function(k) { computed[k] = WIRE[k](); });

// ── Table ──
console.log('model-spec.json v' + SPEC.version + ' — derived quantity verification');
console.log('spec: ' + SPEC.file);
console.log('');
console.log('quantity'.padEnd(12) + 'stored'.padEnd(18) + 'recomputed'.padEnd(18) + 'relErr'.padEnd(12) + 'formula');
console.log(''.padEnd(12) + ''.padEnd(18) + ''.padEnd(18) + ''.padEnd(12) + ''.padEnd(0));
Object.keys(SPEC.quantities).forEach(function(k) {
  var q = SPEC.quantities[k];
  if (q.kind !== 'derived' || k === 'SCCR') return; // SCCR is per-block, not a model constant
  var calc = computed[k];
  var relErr = Math.abs(calc - q.value) / Math.max(Math.abs(q.value), 1e-30);
  console.log(k.padEnd(12) + String(q.value).padEnd(18) + String(calc).padEnd(18) + relErr.toExponential(2).padEnd(12) + (q.formula || ''));
});

// ── Verify ──
var TOL = 1e-4; // relative tolerance (stored values are rounded to ~6 sig figs)
var ok = true;
ORDER.forEach(function(k) {
  var calc = computed[k];
  var stored = get(k);
  var relErr = Math.abs(calc - stored) / Math.max(Math.abs(stored), 1e-30);
  if (relErr > TOL) {
    ok = false;
    console.error('MISMATCH ' + k + ': stored=' + stored + ' recomputed=' + calc + ' relErr=' + relErr.toExponential(2));
  }
});

console.log('');
if (ok) { console.log('ALL QUANTITIES CONSISTENT'); process.exit(0); }
console.error('DERIVED QUANTITIES INCONSISTENT — spec needs correction'); process.exit(1);
