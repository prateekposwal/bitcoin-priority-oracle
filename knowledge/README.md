# ⬡ BSAHI Knowledge Base — Foundation

Deep study of the four foundational texts. Purpose: build our own systems
from first principles instead of depending on external tools/APIs.

## The Four Pillars

| Book | Domain | Source | Value |
|------|--------|--------|-------|
| **Introduction to Algorithms (CLRS)** | Algorithms | pdfdrive | Full algorithm toolkit |
| **Introduction to Machine Learning (Nilsson)** | ML | Stanford AI Lab | Build ML from scratch |
| **Math for Deep Learning (Gallier)** | Mathematics | Penn CIS | Complete math foundations |
| **Computer Architecture (Hennessy & Patterson)** | Architecture | archive.org | Quantitative systems thinking |

---

## 1. Algorithms (CLRS) — The Transferable Design Moves

1. **Asymptotic thinking**: classify every op by Θ/O/Ω before building.
2. **Correctness via invariants**: loop invariants, induction, exchange arguments.
3. **Divide-and-conquer**: master theorem, recursion trees.
4. **Memoization / subproblem graphs**: exponential → polynomial when subproblems overlap.
5. **Optimal substructure**: DP vs greedy decision.
6. **Amortized analysis**: potential/accounting methods for rare-expensive ops.
7. **Graph reduction**: model problems as graphs; reduce unknown to known.
8. **Relaxation + frontier expansion**: Dijkstra/Prim/BFS pattern.
9. **Randomization defeats adversaries**: random pivots, universal hashing.
10. **Data-structure augmentation**: add attributes to balanced trees safely.
11. **Trade time/memory**: memoization, prefix sums, fingerprinting.
12. **Approximation via lower bounds**: MST for TSP, LP relaxation for vertex cover.
13. **Integrality trick**: integer capacities force exact combinatorial solutions.

## 2. Machine Learning (Nilsson) — Key Formulas

**Perceptron / TLU**: f = thresh(X·W + w); update V ← V + c(d−f)Y.

**Backprop** (sigmoid f, f′=f(1−f)):
- Wᵢ⁽ʲ⁾ ← Wᵢ⁽ʲ⁾ + c δᵢ⁽ʲ⁾ X⁽ʲ⁻¹⁾
- δ⁽ᵏ⁾ = (d−f⁽ᵏ⁾)f⁽ᵏ⁾(1−f⁽ᵏ⁾); δᵢ⁽ʲ⁾ = fᵢ⁽ʲ⁾(1−fᵢ⁽ʲ⁾)Σₗδₗ⁽ʲ⁺¹⁾wᵢₗ⁽ʲ⁺¹⁾

**Naive Bayes** = linear classifier: wᵢ = log[pᵢ(1−qᵢ)/(qᵢ(1−pᵢ))]

**Nearest neighbor**: 1-NN error ≤ 2× Bayes error (Cover–Hart).

**Decision trees**: entropy H = −Σp·log₂p; pick test maximizing uncertainty reduction; MDL for pruning.

**PAC learning**: m ≥ (1/ε)(ln|H| + ln(1/δ)); VC bound: m ≥ (1/ε)max[4lg(2/δ), 8·VCdim·lg(13/ε)].

**Clustering**: cluster-seeker Cⱼ ← (1−1/(1+mⱼ))Cⱼ + (1/(1+mⱼ))Xᵢ; converges to sample mean.

**TD(λ)**: (ΔW)ᵢ = c(fᵢ₊₁−fᵢ)eᵢ, eligibility trace eᵢ₊₁ = ∂fᵢ₊₁/∂W + λeᵢ.

**Q-learning**: Q(X,a) ← (1−c)Q(X,a) + c[r + γ·max_b Q(X′,b)]; no model needed.

## 3. Mathematics (Gallier) — The Toolchain

**Linear algebra**: LU (solve Ax=b, never invert), Cholesky (SPD), QR (stable least squares), SVD A⁺=UD⁺Vᵀ (robust, rank-deficient), eigenvalues (spectral theorem A=QDQᵀ), cond(A)=σ_max/σ_min.

**Key gradients**: ∇(xᵀAx)=2Ax; ∇‖Ax−b‖²=2Aᵀ(Ax−b); d log det(X)=tr(X⁻¹dX).

**Optimization**:
- Gradient descent rate = (κ−1)/(κ+1) where κ=cond₂(A)
- Newton: d = −(∇²f)⁻¹∇f; Newton decrement λ²/2 ≤ ε
- KKT: ∇J + Σλᵢ∇ϕᵢ = 0, λᵢ ≥ 0, λᵢϕᵢ = 0 (Slater ⟹ necessary+sufficient)
- ADMM: x/z alternating + λ update; residual-based stopping
- Subgradients: 0 ∈ ∂f(x) ⟺ x minimizes

**Regularization**: ridge x=(AᵀA+KI)⁻¹Aᵀb; lasso via ADMM/ℓ₁ prox; elastic net = both.

## 4. Architecture (Hennessy & Patterson) — Principles

**Performance**: CPU time = IC × CPI × Clock; Amdahl governs everything; 90/10 locality rule.

**Cache-friendly code** (most actionable):
- A cache miss ≈ 100–200 cycles ≈ thousands of instructions
- Block/tile loops so working set fits L1/L2
- Avoid power-of-2-strided access (conflict misses)
- Avoid false sharing (pad to cache line)
- DRAM row-buffer hits ~5× cheaper; batch by bank

**Parallelism**: match to domain (DLP→SIMD/GPU, TLP→cores, RLP→MapReduce); ILP plateaus.

**Energy**: E ∝ CV²f; DRAM access = 12,500× an 8-bit add; 8-bit int vs FP = 22–150× energy.

**Systems**: at scale failure is normal (100K servers = 1 disk/hour); tail latency > average; ~$2/watt-year.

---

## What This Enables Us to Build (No External Dependencies)

1. **Fee forecasting model** — ridge/lasso regression or gradient descent from scratch on captured fee data (Math + ML knowledge).
2. **Mempool anomaly detection** — naive Bayes / nearest neighbor classifier on mempool features (ML knowledge).
3. **Bitcoin price/volume analysis** — PCA + linear regression from first principles (Math knowledge).
4. **Autonomous research ranking** — decision trees / greedy feature selection over research findings (ML + Algorithms).
5. **Efficient data pipeline** — cache-friendly batching, hash tables, B-trees for the capture store (Architecture + Algorithms).
6. **Reinforcement learning agents** — Q-learning for auto-tuning capture schedules (ML knowledge).
7. **Our own neural net** — backprop from scratch (ML + Math knowledge).
8. **Distributed research computation** — Amdahl-aware parallelism, MapReduce pattern (Architecture).

---
*BSAHI Knowledge Base — compiled from deep study of CLRS, Nilsson, Gallier, Hennessy & Patterson.*
