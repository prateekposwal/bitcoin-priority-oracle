# UTXO Storage Cost Model — Research Note

**Project:** Bitcoin Priority Oracle
**Phase:** R2 — UTXO Cost Function
**Date:** 2026-07-28

---

## Summary

The Bitcoin fee market prices **congestion** (inclusion in the next block) but not **permanence** (lifetime storage in every full node's blockchain history). This note quantifies the gap.

A full Bitcoin node costs approximately **$925/year** to operate (hardware depreciation + bandwidth + electricity). At the current inscription rate of ~100K/month, each average 400-byte inscription adds ~0.45 GB/year of UTXO growth across the network. The modeled storage cost is **≈1.93e-6 $/byte/year** (1.925729e-6, marginal inscription attribution) — or roughly **$0.0077 per inscription over a 10-year lifetime**.

Current inscription fees ($5–50) are 650–6,500× above the modeled storage cost, but they are a **one-time congestion payment**, not a recurring storage payment.

---

## Cost Model Formula

```
NodeCostPerYear = HW_depreciation + Bandwidth_annual + Electricity_annual

CostPerBytePerYear = NodeCostPerYear / (UTXO_bytes_added_per_year)

InscriptionStorageCost = CostPerBytePerYear * inscription_bytes * assumed_lifetime_years
```

Where:
- `HW_depreciation = $500 / 3 years = $166.67/yr`
- `Bandwidth_annual = $50/mo × 12 = $600/yr`
- `Electricity_annual = (150W × 24h × 365) / 1000 × $0.12/kWh = $157.68/yr`
- `UTXO_bytes_added_per_year = 400 bytes × 100,000 inscriptions × 12 = 480,000,000 bytes`

---

## Key Numbers

| Metric | Value |
|---|---|
| Annual node cost (hardware) | $166.67 |
| Annual node cost (bandwidth) | $600.00 |
| Annual node cost (electricity) | $157.68 |
| **Total annual node cost** | **$924.35** |
| UTXO growth from inscriptions | 480 MB/yr (0.45 GB/yr) |
| **Cost per byte per year** | **≈1.93e-6 $/byte/yr** (1.925729e-6) |
| Cost per inscription per year | $0.00077 |
| **Cost per inscription (10yr lifetime)** | **$0.0077** |
| Cost for 100K inscriptions (10yr) | $770 |

---

## SegWit Weight Formula Impact

BIP-141 defines block weight as:

```
block_weight = base_size × 3 + total_size ≤ 4,000,000
```

This means:
- **Non-witness data:** 4 weight units (WU) per byte
- **Witness data:** 1 WU per byte
- **Ratio:** 4:1 — witness data is 75% cheaper

Inscriptions store data in the witness using `OP_FALSE OP_IF <data> OP_ENDIF`, benefiting from this discount. A 400-byte inscription's data occupies only ~100 vbytes of block space. This means:

1. **The marginal cost to include inscription data in a block is artificially low** — the SegWit discount was designed to fix malleability, not to subsidize data storage.
2. **The gap between congestion cost and storage cost is widened** — the discount makes it cheap to write data, but every node must store the full (non-discounted) blockchain data long-term.
3. **A data-conscious relay policy** would need to account for the full byte cost, not the discounted vbyte cost, when assessing state impact.

---

## Fee Market Comparison

| | Congestion pricing (current market) | Storage cost (modeled) |
|---|---|---|
| What it prices | Space in next block (~10 min) | Lifetime storage in every node |
| Inscription fee | $5–$50 (one-time) | $0.0077 (10yr) |
| Payer | Sender (once) | All future node operators (long-term) |
| Market mechanism | Competitive fee auction | None — unpriced externality |
| Orders of magnitude | 6–7× higher per tx | — |

**Key observation:** The current fee market is functioning well for congestion, but there is no mechanism for storage cost recovery. Even if the absolute numbers are small today, the externality scales with inscription volume. At 10× current rates (1M inscriptions/mo), the annual storage externality reaches ~$92K/yr across the network.

---

## Open Questions

1. **Is the externality economically significant?** At current volumes, the modeled storage cost per inscription is small ($0.0077 over 10yr). But UTXO set growth compounds, and nodes are not compensated for carrying historical state.

2. **Do node operators run pruned nodes?** If most nodes prune, they don't bear the full UTXO set cost. However, archival nodes and miners validating new blocks do carry the full set. The distribution matters.

3. **Should SegWit's discount be revisited for data transactions?** The 4:1 witness discount was designed for signature data (malleability fix), not arbitrary data storage. A state-conscious relay policy might treat witness data differently than script data.

4. **What would a storage cost oracle look like?** Any oracle would need to estimate node costs, UTXO growth rates, and projected lifetimes — all noisy parameters. The model is useful for directional insight but not for precise fee setting.

5. **Is the externality better addressed by UTXO-aware relay policy than by protocol change?** Direction A from the TODO (state-density multipliers on `minrelaytxfee`) could work without a soft fork, by giving node operators a configurable tool to price state impact at the relay layer.
