# Storage Cost Coverage Ratio Report
Generated: 2026-08-01 17:11:14 UTC

## Thesis

Bitcoin's fee market prices short-term competition for block inclusion. This report measures
whether those fees also cover the long-term storage burden imposed on the network.

**Storage Cost Coverage Ratio** = Transaction Fee (BTC) / (Bytes × Replication Factor × Cost per Byte per Year × Years)

A ratio > 1.0 means the fee exceeds estimated storage cost. A ratio < 1.0 means the network
subsidizes storage beyond what the fee covers.

## Parameters

| Parameter | Value |
|-----------|-------|
| Node cost per year | $925 |
| Estimated full nodes | 60,000 |
| Storage horizon | 10 years |
| Avg block size | 1.5 MB |

## Results (from 24h fee history)

| Metric | Value |
|--------|-------|
| Blocks sampled | 152 |
| Avg coverage ratio | 0.0180 |
| Min ratio | 0.0032 |
| Max ratio | 0.0820 |
| Interpretation | Fees BELOW storage cost |

- 100.0% of blocks have fees covering less than 1× the estimated 10-year storage cost

### Ratio Distribution (last 24h)

```
<0.1     ██████████████████████████████████████████████████ (152)
0.1-0.5   (0)
0.5-1     (0)
1-2       (0)
2-5       (0)
5-10      (0)
10+       (0)
```

## Discussion

Average ratio of 0.02 suggests that current fees do NOT fully cover the estimated
10-year storage cost across the network. The difference represents an
unpriced externality borne by node operators.

### Caveats

- Node count is estimated (60K). Actual count varies.
- Node costs vary by hardware, bandwidth, electricity.
- Storage horizon of 10 years is an assumption. Some nodes prune earlier, some keep archival data forever.
- Block size is averaged. Individual blocks vary significantly.
- This model does not account for bandwidth costs of block propagation.

## Next Steps

- Feed per-block UTXO growth data from Bitcoin Core (getblockstats → utxo_size_inc)
- Track ratio over time to identify trends across fee regimes
- Correlate with BIP-110 signaling data to measure impact of data restrictions
- Publish as reproducible research note

---
*Bitcoin Sahi Research — Storage Cost Coverage Ratio*