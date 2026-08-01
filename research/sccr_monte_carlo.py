#!/usr/bin/env python3
"""
Headline SCCR Monte Carlo — joint uncertainty on the STORAGE COST COVERAGE RATIO.
Complements monte_carlo.py (which simulates only the inscription branch).
Samples N (nodes), C (node cost), T (horizon), P (BTC price) jointly, re-derives
cb and SCCR from model-spec formulas, reports the distribution of the HEADLINE.

All constants sourced from research/model-spec.json (canonical v2.0.x).
"""
import json
import os
import random
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SPEC = json.load(open(os.path.join(REPO, 'research', 'model-spec.json')))
Q = SPEC['quantities']

N_SAMPLES = 10000
B_BLOCK = Q['B_block']['value']
R_BLOCKS = Q['R_blocks']['value']
B_ALL_YR = B_BLOCK * R_BLOCKS
T_BASE = Q['T']['value']

# Known facts fixed by the capture (158 blocks, 2026-08-01):
TOTAL_FEE_USD = 293362.0          # sum of block fees (sats->USD @ 62900)
N_BLOCKS = 158
PER_BLOCK_FEE_USD = TOTAL_FEE_USD / N_BLOCKS   # ~$1,857 avg fee per block
CAPTURE_AVG_SCCR = 0.1719

def triangular(a, b, c):
    """Triangular distribution with mode c in [a,b]."""
    u = random.random()
    f = (c - a) / (b - a)
    if u < f:
        return a + (u * (b - a) * (c - a)) ** 0.5
    return b - ((1 - u) * (b - a) * (b - c)) ** 0.5

def run():
    random.seed(42)
    results = []
    for _ in range(N_SAMPLES):
        N = triangular(10000, 150000, 60000)      # nodes: band 10K-150K, mode 60K
        C = triangular(500, 2000, 925)            # node cost USD/yr
        T = triangular(5, 30, 10)                 # horizon years
        P = triangular(30000, 120000, 62900)      # BTC price USD
        cb = C / B_ALL_YR
        L_net = cb * B_BLOCK * T * N
        sccr = PER_BLOCK_FEE_USD * (P / 62900.0) / L_net
        results.append((N, C, T, P, sccr))

    results.sort(key=lambda r: r[4])
    def pct(p):
        return results[int(p / 100.0 * N_SAMPLES)][4]
    below1 = sum(1 for r in results if r[4] < 1.0)

    print("=" * 62)
    print("  Headline SCCR — Joint Monte Carlo (10,000 samples)")
    print("=" * 62)
    print(f"  N  ~ Triangular(10K,150K,mode 60K)")
    print(f"  C  ~ Triangular($500,$2000,mode $925)")
    print(f"  T  ~ Triangular(5,30,mode 10 yr)")
    print(f"  P  ~ Triangular($30K,$120K,mode $62.9K)")
    print(f"  fixed: 158-block capture, sum fees = ${TOTAL_FEE_USD:,.0f}")
    print(f"  P5  SCCR = {pct(5):.4f}")
    print(f"  P25 SCCR = {pct(25):.4f}")
    print(f"  P50 SCCR = {pct(50):.4f}")
    print(f"  P75 SCCR = {pct(75):.4f}")
    print(f"  P95 SCCR = {pct(95):.4f}")
    print(f"  Share below 1.0: {below1 / N_SAMPLES * 100:.1f}%")
    print(f"  Point estimate (deterministic): {CAPTURE_AVG_SCCR}")
    print(f"  Sample mean: {sum(r[4] for r in results) / N_SAMPLES:.4f}")

    out = {
        "n_samples": N_SAMPLES,
        "spec_version": SPEC['version'],
        "distributions": {"N": "tri(10K,150K,mode 60K)", "C": "tri(500,2000,mode 925)",
                          "T": "tri(5,30,mode 10)", "P": "tri(30K,120K,mode 62.9K)"},
        "p5": round(pct(5), 4), "p25": round(pct(25), 4), "p50": round(pct(50), 4),
        "p75": round(pct(75), 4), "p95": round(pct(95), 4),
        "below_1x_pct": round(below1 / N_SAMPLES * 100, 1),
        "point_estimate": CAPTURE_AVG_SCCR,
        "mean": round(sum(r[4] for r in results) / N_SAMPLES, 4),
    }
    with open(os.path.join(REPO, 'tools', 'sccr_monte_carlo_output.json'), 'w') as f:
        json.dump(out, f, indent=2)
    print(f"  wrote tools/sccr_monte_carlo_output.json")
    return out

if __name__ == "__main__":
    sys.exit(0 if run() else 1)
