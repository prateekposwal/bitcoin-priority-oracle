# Bitcoin Block Priority Oracle

## Problem

Bitcoin blocks have ~4 MWU. Inscriptions (Ordinals, BRC-20, Runes) compete with financial transactions (payments, settlements, Lightning channel opens) for the same space. The market treats them identically — highest fee-rate wins — despite fundamentally different time-value curves:

- A settlement is worth nothing if it misses this block
- An inscription is worth the same next block, or next hour

No consensus change required. No soft fork. No hard fork.

## Solution

A two-mode system that creates a **two-tier priority fee market** within the existing block size limit:

1. **Passive mode:** Separate fee estimates for financial vs data transactions. No pool changes needed.
2. **Active mode:** Wallets self-declare transaction type (financial/data) via a signed field. Pools read the declaration and allocate block space accordingly.

**No classification oracle needed.** Wallets know their own intent. False positives drop to zero.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   WALLET                          │
│  TX type: "financial"     Fee: 200 sat/vB        │
│  Signed declaration in OP_RETURN output           │
│  (or annex, or PSBT field)                        │
└──────────────────────┬───────────────────────────┘
                       │ tx broadcast
                       ▼
┌──────────────────────────────────────────────────┐
│              MEMPOOL (unchanged)                  │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 POOL TEMPLATE ASSEMBLER              │
│                                                     │
│  1. Scan for declarations (check OP_RETURN / annex) │
│  2. If declared → trust it                          │
│  3. If undeclared → structural fallback heuristic   │
│  4. Apply allocation (financial floor / fee ratio)  │
│  5. Emit final template to Stratum v1 or v2         │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│      Stratum v1 or v2 (no protocol change)      │
│  v2 pools get optional classification tags       │
│  v1 pools see a normal template as before       │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│           FEE ESTIMATOR API (public)             │
│                                                   │
│  GET /v1/fees                                    │
│  ┌──────────────────────────────────────┐        │
│  │ financial: {fastest: 120, hour: 45} │        │
│  │ data:      {fastest: 200, hour: 80} │        │
│  │ allocation: {financial_pct: 62}      │        │
│  └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

## 1. Wallet Self-Declaration Protocol

### How it works

The wallet adds a small structured output to the transaction that declares its type. Three mutually exclusive methods, any one sufficient:

### Method A: OP_RETURN declaration (recommended for wallets)

Add an OP_RETURN output with type-tag bytes:

```
OP_RETURN 0x7072 0x01 0x00
  ↑       ↑      ↑    ↑
  magic  ver   flags  tag
```

**Format:**

| Offset | Size | Field | Values |
|--------|------|-------|--------|
| 0 | 2 | Magic | `0x7072` ("pr" = priority) |
| 2 | 1 | Version | `0x01` |
| 3 | 1 | Flags | Bit 0: `0` = financial, `1` = data. Bits 1-7 reserved. |

Total overhead: **4 bytes** in an OP_RETURN output (~10 vB with the output itself).

### Method B: Annex field (for Taproot transactions)

If the transaction uses Taproot inputs, include an annex (witness element starting with `0x50`) with the declaration:

```
annex = 0x50 || 0x7072 || version || flags
```

Same data layout as Method A, but in the witness annex instead of a separate output. Zero additional vBytes (annex is witness data, 4 WU = 1 vB).

### Method C: PSBT field (for multi-sig / hardware wallets)

The declaration is carried in the PSBT during construction and stripped before broadcast. The pool never sees it directly — instead, the wallet includes a commitment to the declaration in the transaction itself (e.g., a specific sighash single byte). This is more complex and only needed for hardware wallet flows.

### Wallet Integration

| Wallet Type | Method | Effort |
|------------|--------|--------|
| Software (Sparrow, Electrum, Blue) | Method A (OP_RETURN) | Low — add 1 output |
| Mobile (Muun, Phoenix) | Method A (OP_RETURN) | Low |
| Taproot-native (Xverse, Leather) | Method B (annex) | Low — annex field already supported |
| Hardware (Ledger, Coldcard) | Method C (PSBT) | Medium — needs firmware update |
| Exchange hot wallets | Method A (OP_RETURN) | Very low — change withdrawal logic |

### Anti-Abuse: Structural Backcheck

The pool doesn't blindly trust declarations. Every declared-"financial" transaction passes a **lightweight structural check**:

| Check | What it tests | Cost |
|-------|---------------|------|
| Witness size / input count | If > 0.4 → suspicious | O(1) |
| Presence of ordinal envelope (`0x00 0x63 ... 0x68`) | If found → override to DATA | O(witness size) |
| OP_RETURN + OP_13 (`0x6a 0x5d`) in outputs | If found + block >= 840K → override to DATA | O(output count) |
| Known inscription address | If input from known inscriber → DATA | O(1) (lookup) |

**If structural check disagrees with declaration:**
- First offense: warning, tx downgraded to DATA allocation
- Repeated offenses: wallet address rate-limited or blacklisted

**Result:** Honest wallets never hit the backcheck. Liars get caught by simple heuristics.

### For Wallets That Don't Declare

Unmarked transactions use a **fallback classifier** (same structural rules as above, but with lower confidence). Unclear cases default to FINANCIAL.

## 2. Priority Fee Market

### Two Virtual Pools

```
Financial Pool: tx with tag=FINANCIAL, sorted by fee-rate descending
Data Pool:      tx with tag=DATA, sorted by fee-rate descending
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

```
financial_fee_mass = sum(fee × weight) over financial pool top 4 MWU
data_fee_mass = sum(fee × weight) over data pool top 4 MWU
total_fee_mass = financial_fee_mass + data_fee_mass

financial_allocation = C × (financial_fee_mass / total_fee_mass)
data_allocation = C × (data_fee_mass / total_fee_mass)
```

No hard floor. Simpler but financial tx get no guaranteed minimum.

### Data Fee Premium (Pool Revenue)

Data transactions pay a **premium for the same confirmation speed**:

```
data_target_fee = financial_fee_for_same_speed × (1 + premium_rate)
```

If `premium_rate = 0.25`, a data tx needs 250 sat/vB to match a financial tx at 200 sat/vB for next-block inclusion.

The premium goes to the pool. This gives pools a direct revenue incentive to run the oracle.

## 3. Stratum Compatibility

### Stratum v1 (Today — ~90% of hashrate)

**No changes needed.** The oracle operates entirely in the pool's template assembly pipeline:

```
Pool's tx selection logic → Oracle modifies it → Template → Stratum v1 → Miner
```

The miner receives a normal block template. No protocol awareness required.

### Stratum v2 (Optional upgrade)

For pools that want transparency, three optional messages over Template Distribution Protocol (channel `0x74`):

| Message | Direction | Purpose |
|---------|-----------|---------|
| `SetClassificationRules` | Pool → Miner | Publish classification rules hash |
| `ClassifiedTemplate` | Pool → Miner | Template + per-tx declaration tag |
| `PriorityPreference` | Miner → Pool | Miner's desired allocation ratio |

Payload format (CBOR):

```
SetClassificationRules:
  { "version": 1, "rules_hash": "sha256(...)", "confidence_threshold": 0.7 }

ClassifiedTemplate:
  { "template_id": 142, "txs": [...], "tags": [{"txid": "...", "tag": 0|1|2}],
    "allocation": {"financial_weight": 2410000, "data_weight": 1590000} }

PriorityPreference:
  { "session_id": "...", "min_financial_pct": 30, "max_data_pct": 70,
    "signature": "0x..." }
```

Tags: `0=FINANCIAL`, `1=DATA`, `2=UNCERTAIN`

**Backward compatible:** Unmodified Stratum v2 miners see standard `NewTemplate` messages. The `ClassifiedTemplate` is an opt-in replacement.

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
    "data_premium_pct": 25,
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

In **passive mode** (no pool changes needed), just publishing these estimates shifts wallet behavior — wallets naturally use the appropriate fee curve. Over time, financial tx and data tx segregate into different fee bands, making the allocation algorithm's job easier when pools eventually adopt active mode.

## 5. Trust Model

### Self-Declaration is Inherently Trustworthy

Unlike a pool-side classifier (which requires trusting the pool), self-declaration requires trusting the wallet — and wallets have reputation:

| Actor | Trust Model | Why It Works |
|-------|-------------|-------------|
| Wallet | Self-declaration signed by wallet key | Wallet has reputation to lose. Structural backcheck catches liars. |
| Pool | Publishes allocation rules + template tags transparently | Miners audit a random sample |
| Miner | Sets `PriorityPreference` — keeps full discretion | Can ignore oracle entirely |

### Abuse Scenarios

| Attack | Likelihood | Mitigation |
|--------|-----------|------------|
| Wallet declares "financial" for an inscription | Low (reputation loss) | Structural backcheck flags it; wallet blacklisted |
| Pool mis-tags financial as data | Low (miners audit) | Miners sample-check; pool reputation |
| Miner ignores oracle entirely | High (and that's OK!) | Miner gets standard template — no worse than today |
| Sybil wallet farm | Medium | Fee-based: lying costs the tx fee anyway |

### Phased Decentralization

| Phase | Declaration | Verification | Adoption |
|-------|------------|-------------|----------|
| **0** (now) | None — unified fee market | N/A | Status quo |
| **1** | Fee estimator API only | None (passive) | Wallets adopt separate fee estimates |
| **2** | Wallet declaration (OP_RETURN) | Optional pool backcheck | First pool adopts; wallets add declaration |
| **3** | Multi-pool, cross-verification | Pool A checks Pool B's tags | Standard practice |

## 6. Economic Incentives — Why Pools Adopt

### Short-term: Data Fee Premium

The oracle applies a **premium rate** to data transactions for the same confirmation speed. A 25% premium means:

```
Financial tx at 200 sat/vB → next block
Data tx at 200 sat/vB → pushed back unless it pays 250+ sat/vB
```

The pool captures this premium. If a pool mines 1,000 blocks/year and data tx average 100K vB/block, a 25% premium on 200 sat/vB average generates:

```
100,000 vB × 200 sat/vB × 25% premium × 1,000 blocks
= 5,000,000,000 extra satoshis/year ≈ 5 BTC/year per pool
```

### Medium-term: SLA Products for Institutions

Exchanges need predictable withdrawal confirmations. A pool offering "Financial Priority" can sell:

- **Next-block guarantee** for exchange withdrawals (premium subscription)
- **Volume discounts** for financial tx bundles (payment processors)
- **Priority API** for institutional Bitcoin users

These are new revenue streams that don't exist today.

### Long-term: Network Effects

First-mover pool gets:
- Wallet integrations (wallets add "Use Pool X for priority" feature)
- Exchange partnerships (exchanges direct withdrawals to the pool)
- Brand differentiation in a commoditized market

Once 2-3 pools adopt, non-adopters look worse for financial tx. Game theory inverts.

### Risk: Pools That Don't Adopt

Non-adopting pools continue mining standard templates. They get:
- Whatever data tx remain after the priority pool fills
- No financial tx premium
- No SLA revenue

They are **not worse off than today** — they just miss the upside. No downside to non-adoption.

## 7. Comparison with Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **This (self-declaration)** | Zero false positives, works with v1 today, no classifier, wallet-driven | Requires wallet integration for optimal results |
| **Pool-side classifier** | No wallet changes needed | Black box, false positives, trust issue, Runes hard to classify |
| **CPFP/RBF** | Already works, no new infra | Doesn't solve allocation — both sides can CPFP |
| **Consensus block type (BIP-119)** | Enforceable on-chain | Hard fork, years to deploy, political |
| **EIP-1559 style** | Algorithmic, automatic | Requires soft fork, contentious |
| **Do nothing** | Simple | Fee market degradation continues |

## 8. Adoption Strategy

### Phase 0: Passive (now — no pool changes)

1. Deploy **Fee Estimator API** that monitors mempool and publishes separate financial/data fee estimates
2. Wallets integrate the API → users naturally self-select fee bands
3. Builds the data pipeline for later phases

### Phase 1: Wallet Declaration (4-8 weeks)

1. Publish **wallet SDK** (JS, Swift, Kotlin, Rust) — 20 lines to add declaration
2. Integrate with 3 wallets (Sparrow, Electrum, Blue Wallet as starting candidates)
3. Ship **OP_RETURN declaration format** spec

### Phase 2: Pool Integration (4-8 weeks)

1. Publish **pool adapter** (Rust/Go) — hooks into template assembly
2. First pool partner signs on
3. Launch with data fee premium + SLA products

### Phase 3: Network Effects (ongoing)

1. More pools: competitive pressure drives adoption
2. More wallets: standard declaration field becomes expected
3. Stratum v2 transparency: optional classification tags

## 9. Implementation Plan

### Phase 0 — Fee Estimator (Weeks 1-2)

- Bitcoin Core RPC mempool listener
- Mempool composition analyzer (declared vs structural vs unknown)
- REST API: `GET /v1/fees`
- Prometheus metrics + Grafana dashboard

### Phase 1 — Wallet SDK (Weeks 3-6)

- Rust library for declaration construction (OP_RETURN + annex methods)
- JS/TS wrapper for web wallets
- Swift + Kotlin wrappers for mobile wallets
- Reference integration: Sparrow wallet plugin

### Phase 2 — Pool Adapter (Weeks 7-10)

- Template assembly hook (reads declarations, applies allocation)
- Structural backcheck (ordinal envelope + runestone detection)
- Stratum v1 + v2 output
- Integration test with mining simulator (regtest)

### Phase 3 — Stratum v2 Transparency (Weeks 10-12)

- Optional `ClassifiedTemplate` message for v2 pools
- `PriorityPreference` handler
- Multi-pool cross-verification

## 10. Future Work

- **Hardware wallet support:** PSBT-based declaration for Coldcard/Ledger
- **Declaration aggregation:** Batch wallet declarations into Merkle proof for block-level verification
- **Cross-pool federation:** Pools share declaration data for anti-abuse
- **MEV resistance:** Commit-reveal for high-value declarations
- **Automated premium tuning:** ML-based data fee premium optimization

## Why This Works

1. **No consensus change:** Everything at the wallet/template layer.
2. **Zero false positives:** Wallets declare their own intent. No classifier oracle.
3. **Works with Stratum v1 today:** No protocol change needed for MVP.
4. **Pools get paid more:** Data fee premium is a new revenue stream.
5. **Wallets control their fate:** Self-declaration gives users agency.
6. **Backward compatible:** Unmarked tx default to financial. Non-adopting pools see no change.
7. **Phased rollout:** Passive fee estimates → wallet declaration → pool integration → full network.

## Team

- ** engineers** 
- (wallet integration / mining ops)
- - **Advisors desired:** Wallet developer, pool operator, Stratum v2 maintainer

## Resources Needed

- Bitcoin Core node (archive, mainnet)
- Mining simulator (regtest + Stratum v1/v2)
- Wallet SDK test harness (Electrum, BlueWallet, Sparrow)

> *Bitcoin Has a 4 MWU Apartment. Your Inscription Is the Roommate Who Won't Pay Rent.*
