# Bitcoin Block Space — Research TODO

## Phase R1: Reading ✅

- [x] Read BIP-141 rationale for witness discount (malleability vs state economics) → `research/bip141_analysis.md`
- [x] Read Moser, Eyal, Gün Sirer — covenant paper (FC 2017) → surveyed in bip141_analysis.md
- [x] Read Poelstra — CAT and Schnorr Tricks series → surveyed in bip141_analysis.md
- [x] Search r/BitcoinEngineering for "state expiry" threads → no active proposals since 2022
- [x] Search bitcoin-dev mailing list for UTXO growth discussions → periodic threads, no consensus

## Phase R2: UTXO Cost Function ✅

- [x] Estimate: what does it cost to run a full Bitcoin node per year? (HW + bandwidth + electricity) → `research/utxo_cost_model.py`, $925/yr
- [x] Calculate: how many bytes of UTXO data does the average inscription add? → ~400 bytes (100 vbytes)
- [x] Model: node cost / byte / year → ≈1.93e-6 $/byte/yr, ~$0.0077/inscription lifetime
- [x] Document: the SegWit weight formula's impact on inscription economics → `research/bip141_analysis.md`
- [x] Simulate: how UTXO set growth affects node operator costs → model handles 50K-300K/mo scenarios
- [x] Verification appendix with source links → `research/verification_appendix.md`
- [x] Live data fetch scripts → `research/fetch_inscription_stats.py`, `research/verify_inscription_size.py`

## Phase R3: Problem Statement ✅

- [x] Write a clear, concise problem statement (1 page max) → `research/problem_statement.md`
- [x] Publish as a research note (no solution, just the framing) → `research/problem_statement.md`
- [x] Share on r/BitcoinEngineering for feedback → https://reddit.com/r/BitcoinEngineering

## Monitoring

- [x] Subscribe to Bitcoin Optech newsletter
- [x] Follow r/BitcoinEngineering for "state expiry" discussions
- [x] Track bitcoin-dev mailing list for UTXO/state threads
- [x] Analyze BIP-110 (Reduced Data Temporary Softfork) — see bitcoin-oracle-arch.md
- [x] Watch covenant proposal discussions (CTV, APO, OP_VAULT, OP_CAT)
- [x] Note: BIP-110 validates our problem diagnosis. Our cost model provides the economic data BIP-110's rationale lacks.

## Phase R4: Deployment & Business (bitcoinsahi.com)

### Stage 1: Static Site (Week 1)
- [ ] Enable GitHub Pages on the repo (Settings → Pages)
- [ ] Add CNAME file with `bitcoinsahi.com`
- [ ] Point DNS: A records to GitHub Pages IPs + CNAME www → prateekposwal.github.io
- [ ] Verify site loads at https://bitcoinsahi.com
- [ ] Add Google Analytics or Plausible for visitor tracking

### Stage 2: Live Data Pipeline (Week 2-3)
- [ ] Create `.github/workflows/refresh-data.yml` — daily Python run that fetches fees, inscription count, UTXO size
- [ ] Script outputs `research/live_data.json` committed to repo
- [ ] HTML page reads `live_data.json` via JavaScript for always-current numbers
- [ ] Add "Last updated: X hours ago" timestamp to site

### Stage 3: Full Stack Backend (Month 2)
- [ ] Set up Flask/FastAPI backend on VPS ($6–$12/mo)
- [ ] API endpoints: `/api/fees`, `/api/inscriptions`, `/api/utxo-cost-model`
- [ ] Add interactive model UI (sliders for parameters, live recalculation in browser)
- [ ] Add newsletter signup (free email service: SendGrid / Mailchimp free tier)

### Stage 4: Monetization (Month 3+)
- [ ] Draft sponsorship deck for Bitcoin mining pools and Lightning companies
- [ ] Launch Developer API tier at $50/mo (history, projections, custom runs)
- [ ] Enterprise API tier at $500/mo (real-time, webhooks, dedicated support)
- [ ] Publish first "State of Block Space" annual report ($500/copy)
- [ ] Begin consulting outreach to ETF providers, mining companies, L2 protocols

### Revenue Target: $50K–$150K/year by Month 12

## Phase R5: Contribution (if warranted)

- [ ] Only if feedback suggests a genuine gap exists
- [ ] Only if the problem can be addressed without consensus change (v1 principle)
- [ ] Only if the proposed mechanism survives incentive analysis

## Exploratory Directions

### Direction A: UTXO-Aware Relay Minimum Fee

- [ ] Write a patch for Bitcoin Core's `minrelaytxfee` to support state-density multipliers
- [ ] Define `state_density = (witness_size + output_script_size) / vsize`
- [ ] Write an economic model explaining why relay nodes would adopt this
- [ ] Simulate how the effective fee floor shifts at different adoption rates

### Direction B: BIP for State-Conscious Relay Policy

- [ ] Draft BIP defining `state_impact_score` metrics
- [ ] Engage with Bitcoin Optech, r/BitcoinEngineering, bitcoin-dev for feedback
- [ ] Provide wallet-side fee estimation guidance
- [ ] Reference implementation in Core fork or alternative node

### Direction C: Multi-Tier Relay Fee Market (Speculative)

- [ ] Explore only if A/B prove insufficient
- [ ] Requires P2P protocol changes and wallet routing logic

## Key Distinction (from Community Feedback)

The research hinges on one question that emerged from community feedback:

> **Is the "data permanence externality" a real, economically significant problem — or is the existing fee market sufficient?**

The fee market prices **congestion** (inclusion in the next block). It does not price **permanence** (lifetime storage in every full node's blockchain history). These are two different market failures.

| | Congestion pricing | Permanence cost |
|---|---|---|
| What it prices | Entry into the next block | Lifetime storage in every node |
| Who pays | Sender (once) | All future node operators (forever) |
| Time horizon | ~10 min (1 block) | Indefinite |
| Market failure | None — works well | Tragedy of the commons — no marginal cost signal |
| Handled by fee market? | ✅ Yes | ❌ No — unpriced externality |

**Open question:** Is the permanence externality significant enough to matter, or do most node operators run pruned nodes and not care about historical data?

## Phase R5: Storage Cost Coverage Ratio (2026-07-30)

- [x] Define metric: StorageCostCoverageRatio = TransactionFee / (Bytes × ReplicationFactor × CostPerBytePerYear × Years)
- [x] Build reproducible computation module → `tools/research/storage-ratio.js`
- [x] Generate first report: 148 blocks, avg ratio 0.0149 (1.49%) → `reports/research/storage-ratio-2026-07-30.md` *(superseded by the v2.0.0 correction — see research/model-spec.json; corrected avg ≈ 0.174)*
- [ ] Feed Bitcoin Core `getblockstats → utxo_size_inc` for per-block UTXO growth data
- [ ] Track ratio over time as new data accumulates
- [ ] Publish as research note (arXiv, Bitcoin Optech, r/BitcoinEngineering)

**Key finding (v1.0.0, superseded):** 100% of sampled blocks had fees covering less than 1× the estimated 10-year storage cost. Average coverage: **1.49%**. Corrected in v2.0.0 (duplicated time-horizon term removed) — the regenerated average is ≈ **17.4%** (see research/verification_appendix.md Model Reconciliation); the direction of the finding is unchanged.

## Open Questions

1. Does the SegWit weight formula need to be parameterized differently for data vs financial transactions?
2. Is state expiry viable for Bitcoin without soft fork?
3. Can covenant proposals reduce UTXO churn from inscriptions?
4. What would a "storage cost oracle" look like — and is it even possible without trust?
5. Is the "externality of data permanence" actually a problem with economic significance, or is the existing fee market sufficient?
