"""
Bitcoin UTXO Cost Model — marginal inscription externality branch.
All model constants are sourced from research/model-spec.json v2.0.0 (canonical).
This script is a CONSUMER of the spec: it reads C, C_insc, I_bytes, I_rate, T,
cb_insc and L_insc and does NOT redefine any model constant.
Attribution: MARGINAL inscription branch — cost per byte per year uses the
inscription-only denominator (cb_insc), the same quantity documented in the
Model Reconciliation table of research/verification_appendix.md.
"""
import json
import os

SPEC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model-spec.json')

with open(SPEC_PATH) as _f:
    _SPEC = json.load(_f)
Q = _SPEC['quantities']
SPEC_VERSION = _SPEC['version']

# ── Spec lookups (canonical v2.0.0) ──
C = Q['C']['value']              # 925     pinned canonical node cost (USD/yr)
C_insc = Q['C_insc']['value']    # 924.35  python-exact component sum (marginal branch)
I_BYTES = Q['I_bytes']['value']  # 400     avg inscription UTXO footprint
I_RATE = Q['I_rate']['value']    # 100000  inscriptions / month
T = Q['T']['value']              # 10      storage horizon (years)
CB_INSC = Q['cb_insc']['value']  # 1.92573e-6  cost per byte per year, marginal attribution
L_INSC = Q['L_insc']['value']    # 0.00770292  lifetime storage cost per inscription

# ── Component sub-estimates (NOT in spec; they sum to C_insc ≈ C=925) ──
HW_COST = 500.0
HW_LIFETIME_YEARS = 3.0
BANDWIDTH_MONTHLY = 50.0
ELECTRICITY_KWH = 0.12
NODE_POWER_WATTS = 150.0
HOURS_PER_DAY = 24.0


def annual_node_cost():
    hw_annual = HW_COST / HW_LIFETIME_YEARS
    bw_annual = BANDWIDTH_MONTHLY * 12
    kwh_year = (NODE_POWER_WATTS * HOURS_PER_DAY * 365) / 1000.0
    elec_annual = kwh_year * ELECTRICITY_KWH
    total = hw_annual + bw_annual + elec_annual
    return {
        "hardware": round(hw_annual, 2),
        "bandwidth": round(bw_annual, 2),
        "electricity": round(elec_annual, 2),
        "total": round(total, 2),
        "kwh_per_year": round(kwh_year, 0),
    }


def utxo_set_growth():
    bytes_per_month = I_BYTES * I_RATE
    bytes_per_year = bytes_per_month * 12
    gb_per_year = bytes_per_year / (1024 ** 3)
    return {
        "bytes_per_month": round(bytes_per_month, 0),
        "bytes_per_year": round(bytes_per_year, 0),
        "gb_per_year": round(gb_per_year, 2),
    }


def cost_per_byte_per_year(total_node_cost):
    """Marginal attribution: cb_insc = C_insc / inscription_bytes_per_year.
    Recomputed from spec inputs; matches spec cb_insc (1.92573e-6) to 6 s.f."""
    growth = utxo_set_growth()
    return total_node_cost / growth["bytes_per_year"]


def inscription_storage_cost(cpb):
    per_inscription = cpb * I_BYTES
    lifetime = per_inscription * T
    return {
        "per_inscription_per_year": round(per_inscription, 8),
        "lifetime_10yr": round(lifetime, 8),
    }


def segwit_impact():
    return {
        "non_witness_wu_per_byte": 4,
        "witness_wu_per_byte": 1,
        "weight_ratio": "4:1",
        "discount_effect": "Witness data is 75% cheaper per byte vs non-witness data in block weight accounting. "
                          "For inscriptions, this means storing data in witness (e.g. via OP_FALSE OP_IF ... OP_ENDIF) "
                          "costs 1/4 the weight of placing it in scriptPubKey or scriptSig.",
        "effective_vsize_multiplier": 0.25,
    }


def pruned_analysis(node_total):
    """Analyze cost breakdown for pruned vs archival nodes (marginal branch)."""
    bytes_yr = I_BYTES * I_RATE * 12
    cpby = node_total / bytes_yr
    per_insc_10yr = cpby * I_BYTES * T

    # Inscriptions as fraction of total block space
    # Blocks: ~4M WU per block, 144 blocks/day = ~210 GB/yr
    total_block_bytes_yr = 4_000_000 * 144 * 365 / 4  # vbytes
    inscription_fraction = bytes_yr / total_block_bytes_yr

    # Pruned node still pays bandwidth + CPU (est. 30% of total ops)
    unavoidable_pct = 0.30
    unavoidable_yr = node_total * unavoidable_pct * inscription_fraction
    unavoidable_per_insc = per_insc_10yr * unavoidable_pct

    print("\n--- PRUNED vs ARCHIVAL ANALYSIS ---")
    print(f"  Inscriptions as fraction of block space: {inscription_fraction*100:.2f}%")
    print(f"  Archival node total/yr:            ${node_total:.2f}")
    print(f"  Pruned node unavoidable cost/yr:  ${unavoidable_yr:.4f}")
    print(f"  (inscription share of bandwidth+CPU)")
    print(f"  Unavoidable cost per inscription:  ${unavoidable_per_insc:.10f}")
    print(f"  Individual economic significance:  NEGLIGIBLE (< $1/yr)")
    print(f"  Aggregate at 50K reachable nodes:  ${unavoidable_yr * 50000:.2f}/yr")
    print(f"  At 50x volume (5M/mo):             ${unavoidable_yr * 50000 * 50:.2f}/yr")
    print(f"  Verdict: Externality exists theoretically but is not")
    print(f"  economically significant at current volumes (~100K/mo).")
    print(f"  Becomes relevant only at 50x+ volume growth.")


def main():
    print("=" * 62)
    print("  Bitcoin UTXO Cost Model — Bitcoin Priority Oracle")
    print("  Phase R2: Storage cost externality quantification")
    print(f"  Constants sourced from research/model-spec.json v{SPEC_VERSION}")
    print("=" * 62)

    node = annual_node_cost()
    growth = utxo_set_growth()

    print("\n--- PARAMETERS (model-spec.json v2.0.0) ---")
    print(f"  Hardware:           ${HW_COST:.0f} / {HW_LIFETIME_YEARS}yr")
    print(f"  Bandwidth:          ${BANDWIDTH_MONTHLY:.0f}/mo")
    print(f"  Electricity:        ${ELECTRICITY_KWH:.2f}/kWh")
    print(f"  Node power draw:    {NODE_POWER_WATTS}W ({HOURS_PER_DAY:.0f}h/day)")
    print(f"  Avg inscription:    {I_BYTES:.0f} bytes UTXO data")
    print(f"  Inscription rate:   {I_RATE:,.0f}/mo")
    print(f"  UTXO lifetime:      {T:.0f}yr (assumed)")

    print("\n--- ANNUAL NODE COST ---")
    print(f"  Hardware (deprec.): ${node['hardware']:.2f}")
    print(f"  Bandwidth:          ${node['bandwidth']:.2f}")
    print(f"  Electricity:        ${node['electricity']:.2f}")
    print(f"  ─────────────────────────")
    print(f"  TOTAL per node/yr:  ${node['total']:.2f}   (component sum; spec pins canonical C=${C:.0f})")
    print(f"  (power draw:        {node['kwh_per_year']:.0f} kWh/yr)")

    print("\n--- UTXO SET GROWTH FROM INSCRIPTIONS ---")
    print(f"  New UTXO bytes/mo:  {growth['bytes_per_month']:,.0f} ({growth['bytes_per_month']/1024:.1f} KB)")
    print(f"  New UTXO bytes/yr:  {growth['bytes_per_year']:,.0f} ({growth['gb_per_year']:.2f} GB)")

    cpb = cost_per_byte_per_year(node["total"])
    print(f"\n--- COST PER BYTE PER YEAR (marginal attribution, cb_insc) ---")
    print(f"  ${node['total']:.2f} / {growth['bytes_per_year']:,.0f} bytes =")
    print(f"  ${cpb:.12f} / byte / year     (spec cb_insc = {CB_INSC:.6e})")
    print(f"  ${cpb * 1000:.12f} / KB / year")
    print(f"  ${cpb * 1_000_000:.6f} / MB / year")

    ins_cost = inscription_storage_cost(cpb)
    print(f"\n--- INSCRIPTION STORAGE COST BURDEN ---")
    print(f"  Per inscription / yr:    ${ins_cost['per_inscription_per_year']:.8f}")
    print(f"  Lifetime ({T}yr):          ${ins_cost['lifetime_10yr']:.8f}   (spec L_insc = {L_INSC})")
    print(f"  Per 100K inscriptions/yr: ${ins_cost['lifetime_10yr'] * 100_000:.6f}")
    print(f"  (spread across all node operators long-term)")

    print(f"\n--- SEGWIT WEIGHT FORMULA IMPACT ---")
    seg = segwit_impact()
    print(f"  BIP-141: block weight = base_size * 3 + total_size ≤ 4,000,000")
    print(f"  Non-witness byte = {seg['non_witness_wu_per_byte']} WU")
    print(f"  Witness byte     = {seg['witness_wu_per_byte']} WU")
    print(f"  Ratio:           {seg['weight_ratio']}")
    print(f"  Discount effect: witness data costs 1/4 the weight")
    print()
    print(f"  Inscriptions typically store data in the witness via:")
    print(f"    OP_FALSE OP_IF <data> OP_ENDIF")
    print(f"  This means inscription data benefits from the 4:1 SegWit")
    print(f"  discount, so a 400-byte inscription accounts for only")
    print(f"  ~100 vbytes of block space.")

    print(f"\n--- FEE MARKET COMPARISON ---")
    print(f"  Current typical inscription fee: ~$5-50 (at ~10-50 sat/vB)")
    print(f"  Modeled storage cost / inscription: ${ins_cost['lifetime_10yr']:.8f}")
    print(f"  Ratio of fee to storage cost: ~{5/max(ins_cost['lifetime_10yr'], 1e-12):,.0f}x to {50/max(ins_cost['lifetime_10yr'], 1e-12):,.0f}x")
    print(f"  => Current fees are ORDERS OF MAGNITUDE above modeled")
    print(f"     storage cost. However, the fee is a ONE-TIME congestion")
    print(f"     payment, while storage cost recurs annually for the long term.")

    print(f"\n--- KEY INSIGHT ---")
    print(f"  The fee market prices INCLUSION (space in the next block).")
    print(f"  It does NOT price PERMANENCE (space in every full node's")
    print(f"  blockchain history for the lifetime of the output).")
    print(f"  ")
    print(f"  At 100K inscriptions/mo, the externality is:")
    print(f"    ${ins_cost['lifetime_10yr'] * I_RATE * 12 / 1000:.2f}K/yr in node storage costs")
    print(f"  spread across ~100,000 node operators globally.")
    print(f"  ")
    print(f"  This is NOT priced into the transaction fee.")

    pruned_analysis(node["total"])


if __name__ == "__main__":
    main()
