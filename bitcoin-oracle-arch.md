# Bitcoin Block Priority Oracle

## Problem

Bitcoin blocks have ~4 MWU (million weight units). Inscriptions (Ordinals, BRC-20, Runes) compete with financial transactions (payments, settlements, Lightning channel opens) for the same space. Miners optimize for fee revenue — if data inscriptions pay higher fees, financial transactions get priced out or delayed.

No consensus change required. No soft fork. No hard fork.

## Solution

A **sidecar oracle + Stratum v2 plugin** that classifies transactions as **financial** or **data** before block template assembly, enabling a two-tier priority fee market within the existing block size limit.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             Bitcoin Core Node                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                          Mempool                                 │   │
│  │  tx_a (P2WPKH, 200 sat/vB)   tx_b (inscription, 250 sat/vB)     │   │
│  │  tx_c (HTLC, 180 sat/vB)     tx_d (BRC-20, 300 sat/vB)          │   │
│  └──────────┬───────────────────────────────────────────────────────┘   │
└─────────────┼───────────────────────────────────────────────────────────┘
              │ getrawmempool
              ▼
┌─────────────────────────────┐
│     Transaction Oracle      │
│                             │
│  ┌───────────────────────┐  │
│  │   Classifier Engine   │  │
│  │  ┌─────────────────┐  │  │
│  │  │ Rule 1: witness  │  │  │
│  │  │ Rule 2: taproot  │  │  │
│  │  │ Rule 3: standard │  │  │
│  │  │ Rule 4: fallback │  │  │
│  │  └────────┬────────┘  │  │
│  │           ▼           │  │
│  │  ┌─────────────────┐  │  │
│  │  │ Confidence      │  │  │
│  │  │ Scorer (0.0-1.0)│  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Classified Pool     │  │
│  │  ┌────────┐┌────────┐ │  │
│  │  │Financial││  Data  │ │  │
│  │  │ Pool   ││  Pool  │ │  │
│  │  └────────┘└────────┘ │  │
│  └───────────────────────┘  │
└──────────┬──────────────────┘
           │ classified tx set
           ▼
┌──────────────────────────────┐
│     Allocation Engine        │
│                              │
│  Financial minimum: 30%      │
│  Remainder split by fee-ratio│
│                              │
│  ┌────────────────────────┐  │
│  │   Block Template       │  │
│  │   tx_a (FIN, 200 s/vB) │  │
│  │   tx_c (FIN, 180 s/vB) │  │
│  │   tx_b (DAT, 250 s/vB) │  │
│  │   tx_d (DAT, 300 s/vB) │  │
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │ ClassifiedTemplate
           ▼
┌──────────────────────────────┐
│  Stratum v2 Plugin           │
│                              │
│  Channel 0x74                │
│  ┌────────────────────────┐  │
│  │ SetClassificationRules │──│──> Miner (classification logic)
│  │ ClassifiedTemplate     │──│──> Miner (template + tags)
│  │ PriorityPreference     │<─│── Miner (allocation preference)
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│        Mining Hardware        │
│  (unmodified — sees standard  │
│   block templates as before)  │
└──────────────────────────────┘

           ┌──────────────────────┐
           │   Fee Estimator API  │
           │                      │
           │  GET /fees           │
           │  ┌────────────────┐  │
           │  │ financial: 120 │  │
           │  │ data:      200 │  │
           │  │ alloc:   62/38 │  │
           │  └────────────────┘  │
           └──────────────────────┘
```

## 1. Transaction Classifier (Oracle)

### Input

Raw transactions fetched from `getrawmempool` (full mempool scan every 10s) or `testmempoolaccept` (real-time on new tx).

### Classification Pipeline

Each transaction passes through a rule engine. Rules are evaluated in order; the first match determines the tentative tag, which then passes through confidence scoring.

```
                Raw Tx
                  │
                  ▼
        ┌─────────────────┐
        │  Rule Engine     │
        │  (ordered rules) │
        └────────┬────────┘
                  │ tag + matched_rule
                  ▼
        ┌─────────────────┐
        │  Confidence     │
        │  Scorer         │
        └────────┬────────┘
                  │ tag + confidence
                  ▼
        ┌─────────────────┐
        │  Threshold Gate │── confidence < 0.7 ──> UNCERTAIN ──> FINANCIAL
        │  (0.7)          │── confidence ≥ 0.7 ──> emit tag
        └─────────────────┘
```

### Classification Rules

| # | Rule | Tag | Confidence | Rationale |
|---|------|-----|-----------|-----------|
| 1 | `tx.HasOpReturn && tx.OpReturnData.Length > 80` | DATA | 0.95 | Non-standard data carrier per BIP-XXX |
| 2 | `tx.WitnessSize / tx.Vsize > 0.4` | DATA | 0.85 | High witness density = inscription |
| 3 | `tx.WitnessSize - tx.ScriptSigSize > 500` | DATA | 0.90 | Taproot script-path spend, large witness = Ordinal |
| 4 | `tx.Inputs.All(inp => inp.IsP2PKH || inp.IsP2WPKH || inp.IsP2TRKeyPath)` | FINANCIAL | 0.90 | Standard key-path spend |
| 5 | `tx.Outputs.Any(out => out.IsOpReturn) && tx.WitnessSize < 100` | FINANCIAL | 0.85 | Small OP_RETURN (e.g., timestamping, not inscription) |
| 6 | `tx.HasCLTV || tx.HasCSV || tx.Outputs.Any(out => out.IsP2WSH)` | FINANCIAL | 0.80 | Timelocks / multisig = Lightning or DeFi |
| 7 | `tx.IsBIP125` | FINANCIAL | 0.85 | Replace-by-fee = time-sensitive financial tx |
| 8 | `tx.Fee / tx.Vsize > mempool.P95Feerate` | FINANCIAL | 0.70 | Extremely high fee = urgency signal |
| 9 | `tx.Version == 3 && tx.Inputs.Any(i => i.IsP2TR)` | FINANCIAL | 0.75 | BIP-119/CTV or BIP-118 (APO) |

**Fallback (no rule matched):** FINANCIAL with confidence 0.50

### Confidence Scoring Detail

Indicators that increase DATA confidence:
- Multiple inscription-like outputs (e.g., > 3 Taproot script-path spends)
- Witness data includes content-type markers (`ord`, `text/plain`, etc.)
- Transaction chaining (same address funds multiple inscription-like tx)

Indicators that decrease DATA confidence:
- Transaction has a change output to a known exchange/OTC wallet
- Transaction includes OP_RETURN with BIP-XXX protocol marker

### False Positive Budget

| Type | Acceptable Rate | Impact |
|------|----------------|--------|
| Financial → DATA | < 1% | Tx delayed 1-2 blocks, still confirmed |
| DATA → Financial | < 5% | Inscription sneaks into financial pool, crowds slightly |

The asymmetric budget reflects that false-DATA is harmless (still confirmed), while false-FINANCIAL lets inscriptions bypass the allocation.

## 2. Priority Fee Market

### Two Virtual Pools

```
Financial Pool: all tx with tag=FINANCIAL, sorted by fee-rate descending
Data Pool:      all tx with tag=DATA, sorted by fee-rate descending
```

### Allocation Algorithm

```
Given:
  C = 4,000,000 weight units (block capacity)
  F_total = total weight of all FINANCIAL tx in mempool
  D_total = total weight of all DATA tx in mempool
  P50_f   = median fee-rate of top 4 MWU of FINANCIAL tx
  P50_d   = median fee-rate of top 4 MWU of DATA tx

Step 1 — Financial floor:
  min_financial_allocation = min(C × 0.30, F_total)

Step 2 — Remaining allocation:
  remaining = C - min_financial_allocation
  fee_ratio = clamp(0.10, P50_d / max(P50_f, 1), 10.0)

  data_weight = remaining × (fee_ratio / (1 + fee_ratio))
  financial_weight = remaining - data_weight

Step 3 — Fill from each pool:
  financial_tx_set = select from Financial Pool until weight ≥ financial_weight
  data_tx_set = select from Data Pool until weight ≥ data_weight

Step 4 — Final merge:
  template = merge(financial_tx_set, data_tx_set) sorted by fee-rate
```

### Worked Example

**Mempool snapshot:**

| Tx | Fee-rate (sat/vB) | Weight (wu) | Tag |
|----|-------------------|-------------|-----|
| A | 300 | 200,000 | DATA |
| B | 250 | 150,000 | DATA |
| C | 220 | 300,000 | FINANCIAL |
| D | 200 | 400,000 | FINANCIAL |
| E | 180 | 500,000 | FINANCIAL |
| F | 150 | 200,000 | DATA |
| G | 120 | 350,000 | FINANCIAL |

**Compute:**
- F_total = 300K + 400K + 500K + 350K = 1,550,000 wu
- D_total = 200K + 150K + 200K = 550,000 wu
- P50_f = P50 of [220, 200, 180, 120] = 190 sat/vB
- P50_d = P50 of [300, 250, 150] = 250 sat/vB
- fee_ratio = clamp(0.1, 250/190, 10.0) = 1.316
- min_financial_allocation = min(4M × 0.3, 1.55M) = 1,200,000 wu
- remaining = 4M - 1.2M = 2,800,000 wu
- data_weight = 2.8M × (1.316 / (2.316)) = 1,590,000 wu
- financial_weight = 2.8M - 1.59M = 1,210,000 wu
- Total financial: 1,200,000 + 1,210,000 = 2,410,000 wu (60.25%)
- Total data: 1,590,000 wu (39.75%)

**Template:** A(300,D), B(250,D), C(220,F), D(200,F), E(180,F), F(150,D) → sorted by fee.

### Alternative: Proportional Allocation

If the clamp model feels too rigid, a proportional alternative:

```
financial_fee_mass = sum(fee × weight) over financial pool top 4 MWU
data_fee_mass = sum(fee × weight) over data pool top 4 MWU
total_fee_mass = financial_fee_mass + data_fee_mass

financial_allocation = C × (financial_fee_mass / total_fee_mass)
data_allocation = C × (data_fee_mass / total_fee_mass)
```

This is purely fee-proportional — no hard floor. Simpler but financial tx get no guaranteed minimum.

## 3. Stratum v2 Plugin

### Protocol Extension

Extends the Template Distribution Protocol (channel `0x74`) per the Stratum v2 spec. Three new message types:

### Message: `SetClassificationRules`

```
+----+--------+--------+--------+--------+
| 0x74 | 0x01  |  len   |  rules...     |
+----+--------+--------+--------+--------+
  ↑       ↑        ↑           ↑
channel  msg_id  varint_len  CBOR-encoded rules
```

Payload (CBOR):

```cbor
{
  "version": 1,
  "rules": [
    {"id": "witness_ratio", "threshold": 0.4, "tag": "data"},
    {"id": "taproot_script", "min_witness": 500, "tag": "data"},
    {"id": "standard_keypath", "tag": "financial"},
    {"id": "timelock_multisig", "tag": "financial"},
    {"id": "bip125", "tag": "financial"}
  ],
  "confidence_threshold": 0.7,
  "default_tag": "financial",
  "hash": "sha256(rule_set)"
}
```

Miner receives this once on connect (or when pool updates rules). Miner can reject by closing channel.

### Message: `ClassifiedTemplate`

Replaces `NewTemplate` in channel 0x74.

```
+----+--------+--------+--------+--------+
| 0x74 | 0x02  |  template_data | tags[] |
+----+--------+--------+--------+--------+
```

Payload:

```cbor
{
  "template_id": 142,
  "previous_block_hash": "0x...",
  "coinbase_tx": "0x...",
  "transactions": ["txid_a", "txid_b", "txid_c", ...],
  "tags": [
    {"txid": "txid_a", "tag": 1},   // DATA
    {"txid": "txid_b", "tag": 0},   // FINANCIAL
    {"txid": "txid_c", "tag": 0},   // FINANCIAL
  ],
  "allocation": {
    "financial_weight": 2410000,
    "data_weight": 1590000,
    "financial_floor_pct": 30,
    "fee_ratio": 1.316
  }
}
```

Tags: `0=FINANCIAL`, `1=DATA`, `2=UNCERTAIN`

### Message: `PriorityPreference`

```
+----+--------+--------+--------+--------+
| 0x74 | 0x03  |  preference_data      |
+----+--------+--------+--------+--------+
```

Payload (miner → pool):

```cbor
{
  "session_id": "0x...",
  "min_financial_pct": 30,       // 0..100, default 30
  "max_data_pct": 70,            // 0..100, default 70
  "max_data_weight_absolute": 2000000,  // max 2 MWU for data
  "fee_ratio_override": null,    // null = use automatic
  "signature": "0x..."           // signed by miner key
}
```

### Flow Diagram (Sequence)

```
Pool                          Miner
  │                              │
  │── SetClassificationRules ───>│  (on connect, or on update)
  │                              │
  │── ClassifiedTemplate(tid=1)─>│  (every new block template)
  │                              │
  │<── PriorityPreference ──────│  (optional, miner adjusts)
  │                              │
  │── ClassifiedTemplate(tid=2)─>│  (adjusted per miner preference)
  │                              │
  │── SubmitSolution ───────────>│  (standard Stratum v2, unchanged)
```

## 4. Fee Estimator API

### Endpoint

```
GET /v1/fees
```

### Response

```json
{
  "financial": {
    "fastest": 120,
    "fastest_weight": 400000,
    "thirty_min": 75,
    "sixty_min": 45,
    "slowest": 25
  },
  "data": {
    "fastest": 200,
    "fastest_weight": 275000,
    "thirty_min": 110,
    "sixty_min": 80,
    "slowest": 40
  },
  "allocation": {
    "financial_pct": 60.25,
    "data_pct": 39.75,
    "financial_floor_active": false,
    "blocks_until_financial_congestion": 3,
    "historical_split_24h": {
      "financial_avg": 0.58,
      "data_avg": 0.42
    }
  },
  "mempool": {
    "total_vsize_mb": 85,
    "financial_vsize_mb": 52,
    "data_vsize_mb": 33,
    "uncertain_vsize_mb": 0.5
  }
}
```

### Integration

Wallets call this endpoint. For financial payments, show `financial.fastest`. For inscriptions, show `data.fastest`. Replace the current monolithic fee estimate with the relevant bucket.

## 5. Trust Model

### Phased Decentralization

| Phase | Classifier | Allocation | Verification | Trust Assumption |
|-------|-----------|-----------|-------------|-----------------|
| 1 (MVP) | Single pool, open-source rules | Deterministic | Manual audit | Trust pool operator to run published code |
| 2 | Multi-oracle (3-5 pools) | Median of N | Cross-check tags | N-1 Byzantine — honest majority |
| 3 | Succinct proofs | On-chain commitment | zk-SNARK verification | Trust math |

### Phase 1 Details (MVP)

**What miners verify:**
- Pool publishes the exact classification binary + rules hash
- Miner runs `SetClassificationRules` content against local node
- Miner audits a random 1% of classifications via side-channel (their own node)

**What users verify:**
- Fee estimator API is open-source
- Historical classification log published (anonymized txid → tag)

### Phase 2 Details (Multi-Oracle)

```
Oracle A ──┐
Oracle B ──┼──> Miner selects median classification
Oracle C ──┘

Per tx:
  votes = [A: FINANCIAL, B: FINANCIAL, C: DATA]
  tag = majority vote → FINANCIAL
  confidence = 2/3 = 0.67
```

Miner sets `PriorityPreference` with oracle whitelist.

## 6. Security Analysis

### Attack Vectors

| Attack | Description | Severity | Mitigation |
|--------|------------|----------|------------|
| **Classification front-running** | Attacker sees a tx labeled DATA, replaces with dummy inscription to claim financial allocation | Medium | Commitment delay: classification computed on txid, not tx content. Rerunning same tx = same classification. |
| **Sybil oracle** | Pool spins up fake oracles to sway median | High | Phase 2: stake-weighted voting. Each oracle posts bond. |
| **False DATA tagging** | Pool tags financial tx as DATA to push them into data pool (reduces financial allocation) | Low | Miners audit random sample. Pool reputation damage. |
| **False FINANCIAL tagging** | Inscription creator mimics financial tx pattern | Medium | Heuristic improvement game. Inscription would need to use standard keypath → no inscription content → defeats purpose. |
| **Mempool exclusion** | Pool's oracle doesn't see certain tx → invisible to allocation | Low | Miners maintain their own mempool view; cross-check. |
| **Stratum v2 message forgery** | Attacker injects fake `ClassifiedTemplate` | High | ECDSA signatures on all messages (standard Stratum v2 auth). |

### Economic Analysis — Why Pools Adopt

**Short-term incentive:** Differentiate your pool. Offer "Financial Priority" as a feature. Payment processors, exchanges, and Lightning nodes will direct hashpower to pools that guarantee financial tx don't get crowded out.

**Medium-term incentive:** Capture fee flow from institutional Bitcoin users who need predictable confirmation. If Financial tx fees are consistently lower than data tx fees on your pool vs generic pools, financial users will use you more.

**Long-term incentive:** Healthy fee market. If data inscriptions permanently dominate block space, financial tx migrate off-chain (Lightning, Liquid). Bitcoin's security budget narrows to inscription speculation. A priority mechanism broadens the fee base.

**Game theory:** First pool to adopt captures the financial tx premium. Once 2-3 pools adopt, it becomes a competitive necessity. Non-adopting pools still get data tx — no downside.

### Comparison with Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **This oracle** | No consensus change, opt-in, backward compatible, market-driven | Requires Stratum v2, adds complexity to template assembly |
| **Just use CPFP/RBF** | Already works, no new infra | Doesn't solve the allocation problem — both financial and data can CPFP |
| **Miner-manual policy** | Simple | Non-transparent, no user-facing fee signal, no API |
| **Consensus-level block type** (e.g., BIP-119 + covenant to reserve space) | Enforceable on-chain | Hard fork, years to deploy, political battle |
| **Fee oracle (EIP-1559 style)** | Algorithmic, automatic | Requires soft fork to change block reward logic, contentious |

## Future Work

- **Classification proofs:** Merkle inclusion + opcode commitment so miners can independently verify classification without re-running the full classifier.
- **MEV resistance:** Commit-reveal scheme for classification to prevent front-running.
- **Cross-pool coordination:** Federation of oracles with BFT consensus on classification.
- **Client-side validation:** Wallet-side classification to pre-negotiate with pool.
- **Backtest engine:** Run the classifier + allocation algorithm against historical mainnet mempool data to measure: (a) how many financial tx would confirm faster, (b) revenue impact for pools.

## Implementation Plan

### Phase 1 — Oracle Core (Weeks 1-4)

- Transaction classifier in Rust (using `rust-bitcoin`)
- Bitcoin Core RPC integration (`getrawmempool`, `decoderawtransaction`)
- Classification confidence scoring
- Test against mainnet mempool snapshot (100K transactions)
- Benchmark: classification throughput (> 1,000 tx/s)

### Phase 2 — Fee Market + Template Builder (Weeks 5-7)

- Allocation algorithm (implement both variants)
- Template assembly with classified transactions
- Performance benchmark (template generation time < 100ms)

### Phase 3 — Stratum v2 Plugin (Weeks 8-10)

- Stratum v2 protocol extension (rust-stratum)
- `ClassifiedTemplate` message
- `PriorityPreference` handling
- Integration test with mining simulator

### Phase 4 — Fee Estimator + Polish (Weeks 10-12)

- REST API for fee estimation
- Prometheus metrics
- Grafana dashboard
- Documentation + deployment guide
- Historical backtest against mainnet data

## Why This Works

1. **No consensus change:** Everything happens at the template assembly layer.
2. **Miners opt in voluntarily:** They keep full discretion via `PriorityPreference`.
3. **Market-driven:** Classification is a suggestion, not a rule. Miners who ignore it lose nothing; miners who use it attract financial tx fee flow.
4. **Backward compatible:** Unmodified miners see standard templates. Stratum v2 is already rolling out.
5. **Economic incentives aligned:** First-mover advantage, then competitive necessity.

## Team

- **2 engineers** (Rust + Bitcoin protocol background)
- **1 part-time** (mining ops / Stratum v2 integration)
- **Timeline:** 10-12 weeks to production
- **Advisors desired:** Pool operator, Stratum v2 maintainer

## Resources Needed

- Bitcoin Core node (archive, mainnet) — for classifier testing
- Mining simulator (regtest + Stratum v2) — for integration testing
- Mainnet mempool data dump — for backtest and benchmarks
- Access to a test mining pool (even 1 PH/s in regtest) — for real-world Stratum v2 test
