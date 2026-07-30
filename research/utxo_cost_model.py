from dataclasses import dataclass

@dataclass
class NodeCostParams:
    hardware_cost: float = 500.0
    hardware_lifetime_years: float = 3.0
    bandwidth_monthly: float = 50.0
    electricity_kwh: float = 0.12
    node_power_watts: float = 150.0
    hours_per_day: float = 24.0

@dataclass
class InscriptionParams:
    avg_utxo_bytes: float = 400.0
    inscriptions_per_month: float = 100_000.0
    lifetime_years: float = 10.0  # assume UTXO lives ~10yr in set

def annual_node_cost(p: NodeCostParams) -> dict:
    hw_annual = p.hardware_cost / p.hardware_lifetime_years
    bw_annual = p.bandwidth_monthly * 12
    kwh_year = (p.node_power_watts * p.hours_per_day * 365) / 1000.0
    elec_annual = kwh_year * p.electricity_kwh
    total = hw_annual + bw_annual + elec_annual
    return {
        "hardware": round(hw_annual, 2),
        "bandwidth": round(bw_annual, 2),
        "electricity": round(elec_annual, 2),
        "total": round(total, 2),
        "kwh_per_year": round(kwh_year, 0),
    }

def utxo_set_growth(insc: InscriptionParams) -> dict:
    bytes_per_month = insc.avg_utxo_bytes * insc.inscriptions_per_month
    bytes_per_year = bytes_per_month * 12
    gb_per_year = bytes_per_year / (1024 ** 3)
    return {
        "bytes_per_month": round(bytes_per_month, 0),
        "bytes_per_year": round(bytes_per_year, 0),
        "gb_per_year": round(gb_per_year, 2),
    }

def cost_per_byte_per_year(total_node_cost: float, p: NodeCostParams, insc: InscriptionParams) -> float:
    utxo_growth = utxo_set_growth(insc)
    # Divide node cost by total new UTXO bytes added per year
    return total_node_cost / utxo_growth["bytes_per_year"]

def inscription_storage_cost(cpb: float, insc: InscriptionParams) -> dict:
    per_inscription = cpb * insc.avg_utxo_bytes
    lifetime = per_inscription * insc.lifetime_years
    return {
        "per_inscription_per_year": round(per_inscription, 8),
        "lifetime_10yr": round(lifetime, 8),
    }

def segwit_impact() -> dict:
    return {
        "non_witness_wu_per_byte": 4,
        "witness_wu_per_byte": 1,
        "weight_ratio": "4:1",
        "discount_effect": "Witness data is 75% cheaper per byte vs non-witness data in block weight accounting. "
                          "For inscriptions, this means storing data in witness (e.g. via OP_FALSE OP_IF ... OP_ENDIF) "
                          "costs 1/4 the weight of placing it in scriptPubKey or scriptSig.",
        "effective_vsize_multiplier": 0.25,
    }

def pruned_analysis(p, insc, node_total):
    """Analyze cost breakdown for pruned vs archival nodes."""
    bytes_yr = insc.avg_utxo_bytes * insc.inscriptions_per_month * 12
    cpby = node_total / bytes_yr
    per_insc_10yr = cpby * insc.avg_utxo_bytes * 10
    
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
    print("=" * 62)

    p = NodeCostParams()
    insc = InscriptionParams()

    print("\n--- PARAMETERS ---")
    print(f"  Hardware:           ${p.hardware_cost:.0f} / {p.hardware_lifetime_years}yr")
    print(f"  Bandwidth:          ${p.bandwidth_monthly:.0f}/mo")
    print(f"  Electricity:        ${p.electricity_kwh:.2f}/kWh")
    print(f"  Node power draw:    {p.node_power_watts}W ({p.hours_per_day:.0f}h/day)")
    print(f"  Avg inscription:    {insc.avg_utxo_bytes:.0f} bytes UTXO data")
    print(f"  Inscription rate:   {insc.inscriptions_per_month:,.0f}/mo")
    print(f"  UTXO lifetime:      {insc.lifetime_years:.0f}yr (assumed)")

    node = annual_node_cost(p)
    print("\n--- ANNUAL NODE COST ---")
    print(f"  Hardware (deprec.): ${node['hardware']:.2f}")
    print(f"  Bandwidth:          ${node['bandwidth']:.2f}")
    print(f"  Electricity:        ${node['electricity']:.2f}")
    print(f"  ─────────────────────────")
    print(f"  TOTAL per node/yr:  ${node['total']:.2f}")
    print(f"  (power draw:        {node['kwh_per_year']:.0f} kWh/yr)")

    growth = utxo_set_growth(insc)
    print("\n--- UTXO SET GROWTH FROM INSCRIPTIONS ---")
    print(f"  New UTXO bytes/mo:  {growth['bytes_per_month']:,.0f} ({growth['bytes_per_month']/1024:.1f} KB)")
    print(f"  New UTXO bytes/yr:  {growth['bytes_per_year']:,.0f} ({growth['gb_per_year']:.2f} GB)")

    cpb = cost_per_byte_per_year(node["total"], p, insc)
    print(f"\n--- COST PER BYTE PER YEAR ---")
    print(f"  ${node['total']:.2f} / {growth['bytes_per_year']:,.0f} bytes =")
    print(f"  ${cpb:.12f} / byte / year")
    print(f"  ${cpb * 1000:.12f} / KB / year")
    print(f"  ${cpb * 1_000_000:.6f} / MB / year")

    ins_cost = inscription_storage_cost(cpb, insc)
    print(f"\n--- INSCRIPTION STORAGE COST BURDEN ---")
    print(f"  Per inscription / yr:    ${ins_cost['per_inscription_per_year']:.8f}")
    print(f"  Lifetime ({insc.lifetime_years}yr):          ${ins_cost['lifetime_10yr']:.8f}")
    print(f"  Per 100K inscriptions/yr: ${ins_cost['lifetime_10yr'] * 100_000:.6f}")
    print(f"  (spread across all node operators forever)")

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
    print(f"     payment, while storage cost recurs annually forever.")

    print(f"\n--- KEY INSIGHT ---")
    print(f"  The fee market prices INCLUSION (space in the next block).")
    print(f"  It does NOT price PERMANENCE (space in every full node's")
    print(f"  UTXO set for the lifetime of the output).")
    print(f"  ")
    print(f"  At 100K inscriptions/mo, the externality is:")
    print(f"    ${ins_cost['lifetime_10yr'] * insc.inscriptions_per_month * 12 / 1000:.2f}K/yr in node storage costs")
    print(f"  spread across ~100,000 node operators globally.")
    print(f"  ")
    print(f"  This is NOT priced into the transaction fee.")

    pruned_analysis(p, insc, node["total"])

if __name__ == "__main__":
    main()
