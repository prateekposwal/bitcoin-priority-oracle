# Bitcoin Block Priority Oracle — Task List

## 📋 Phase 1: Planning & Content

- [x] Write tech architecture doc (`bitcoin-oracle-arch.md`)
- [ ] Refine architecture doc (diagrams, sections, feedback)
- [ ] Publish Post 1 on LinkedIn
- [ ] Publish Post 2 on LinkedIn
- [ ] Publish Post 3 on LinkedIn
- [ ] Create GitHub repo with README
- [x] Create interactive block allocation demo (`interactive-block.html`)
- [ ] Write blog post version (long-form)

## 🦀 Phase 2: Oracle Core (Weeks 1-4)

- [ ] Set up Rust crate (`cargo new bitcoin-priority-oracle`)
- [ ] Implement transaction struct wrappers (`rust-bitcoin`)
- [ ] Implement Rule Engine (ordered rules, first-match)
- [ ] Implement Confidence Scorer (0.0-1.0 per tx)
- [ ] Implement Threshold Gate (≥0.7 → emit tag)
- [ ] Bitcoin Core RPC client (`getrawmempool`, `decoderawtransaction`)
- [ ] Unit tests: classification rules against known tx types
- [ ] Test against mainnet mempool snapshot (100K tx)
- [ ] Benchmark: classification throughput target >1,000 tx/s

## 📊 Phase 3: Fee Market + Template Builder (Weeks 5-7)

- [ ] Implement Financial Pool (sorted by fee-rate)
- [ ] Implement Data Pool (sorted by fee-rate)
- [ ] Implement Allocation Algorithm (30% floor variant)
- [ ] Implement Allocation Algorithm (proportional variant)
- [ ] Implement Template Assembler (merge + sort)
- [ ] Benchmark: template generation <100ms
- [ ] Backtest against historical mainnet data

## ⛏️ Phase 4: Stratum v2 Plugin (Weeks 8-10)

- [ ] Stratum v2 protocol extension scaffolding
- [ ] Implement `SetClassificationRules` message
- [ ] Implement `ClassifiedTemplate` message
- [ ] Implement `PriorityPreference` message handler
- [ ] Integration test with mining simulator (regtest)

## 🌐 Phase 5: Fee Estimator + Polish (Weeks 10-12)

- [ ] REST API endpoint `GET /v1/fees`
- [ ] Prometheus metrics
- [ ] Grafana dashboard
- [ ] Documentation + deployment guide
- [ ] Historical backtest report

## 🔮 Future / Stretch

- [ ] Classification proofs (Merkle + opcode commitment)
- [ ] Multi-oracle with median selection (Phase 2 trust model)
- [ ] Wallet-side client classification
- [ ] MEV resistance (commit-reveal)
- [ ] zk-SNARK classification proofs (Phase 3)

## 📣 Content Calendar

| # | Title | Platform | Status |
|---|-------|----------|--------|
| 1 | "Bitcoin blocks aren't full. They're contested." | LinkedIn | Drafted |
| 2 | "How to build a transaction classifier without touching consensus" | LinkedIn | Drafted |
| 3 | "Why every mining pool should run a transaction oracle" | LinkedIn | Drafted |
| 4 | Deep dive: the allocation algorithm | LinkedIn | Idea |
| 5 | Trust model and decentralization roadmap | LinkedIn | Idea |
| 6 | Performance benchmarks | LinkedIn | Idea |
| 7 | Why not MEV-Boost for Bitcoin? | LinkedIn | Idea |
| 8 | Wallet integration guide | LinkedIn | Idea |
| — | Long-form blog post (mirror of series) | Blog/GitHub | Idea |
