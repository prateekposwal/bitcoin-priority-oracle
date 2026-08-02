#!/usr/bin/env python3
"""
BSAHI — SCCR Reproduce (one command).

The literal "reproduce in 30 seconds" path from the README:

    python3 tools/research/reproduce.py

Reads the fee data, runs the canonical SCCR model (research/model-spec.json,
no redefined constants), prints the headline numbers, and writes a simple
chart (research/reproduce/output/sccr_chart.png).

Data source order:
  1. --live      → read the latest fee_history capture from captured-data/bsahi.db
                  (identical to what tools/research/storage-ratio.js consumes)
  2. (default)   → read the frozen capture research/reproduce/input/fee_history_capture.json
                  (deterministic reproduction; no DB needed)

Exit code 0 on success, 1 on failure. Prints machine-readable JSON to stdout
when --json is passed.
"""
import argparse
import json
import os
import subprocess
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SPEC_PATH = os.path.join(REPO, 'research', 'model-spec.json')
FROZEN = os.path.join(REPO, 'research', 'reproduce', 'input', 'fee_history_capture.json')
OUT_DIR = os.path.join(REPO, 'research', 'reproduce', 'output')
CHART_PATH = os.path.join(OUT_DIR, 'sccr_chart.png')


def load_spec():
    with open(SPEC_PATH) as f:
        spec = json.load(f)
    q = spec['quantities']
    return {
        'C': q['C']['value'], 'N': q['N']['value'], 'T': q['T']['value'],
        'B_block': q['B_block']['value'], 'version': spec['version'],
    }


def load_capture_live():
    """Read the latest fee_history capture from the SQLite DB (same source as
    storage-ratio.js: captures WHERE source='fee_history' ORDER BY captured_at DESC LIMIT 1)."""
    db = os.path.join(REPO, 'captured-data', 'bsahi.db')
    sql = "SELECT json_data FROM captures WHERE source='fee_history' ORDER BY captured_at DESC LIMIT 1"
    tmp = '/tmp/bsahi-reproduce-%d.sql' % os.getpid()
    with open(tmp, 'w') as f:
        f.write('.mode json\n' + sql)
    try:
        proc = subprocess.run(['sqlite3', db], stdin=open(tmp), capture_output=True, text=True, timeout=15)
        out = proc.stdout
    finally:
        try: os.unlink(tmp)
        except OSError: pass
    if not out.strip():
        raise RuntimeError('empty sqlite output (is captured-data/bsahi.db present?)')
    rows = json.loads(out)
    if not rows or 'json_data' not in rows[0]:
        raise RuntimeError('unexpected capture row shape')
    return json.loads(rows[0]['json_data'])


def compute(cfg, capture):
    r_blocks = 365.25 * 24 * 6
    cb = cfg['C'] / (cfg['B_block'] * r_blocks)
    l_net = cfg['B_block'] * cb * cfg['T'] * cfg['N']
    rows = []
    for e in capture:
        fee_sats = e.get('avgFees') or 0
        usd = e.get('USD') or 0
        if not fee_sats:
            continue
        fee_usd = (fee_sats / 1e8) * usd
        rows.append({'height': e.get('avgHeight'), 'fee_sats': fee_sats, 'usd': usd,
                     'fee_usd': fee_usd, 'ratio': fee_usd / l_net})
    ratios = [r['ratio'] for r in rows]
    return rows, ratios, l_net, cb


def write_chart(rows):
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print('matplotlib not available — skipping chart (SCCR numbers still valid)')
        return False
    os.makedirs(OUT_DIR, exist_ok=True)
    heights = [r['height'] for r in rows]
    ratios = [r['ratio'] for r in rows]
    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=110)
    ax.plot(heights, ratios, color='#F7931A', lw=1.6)
    ax.axhline(1.0, color='#E74C3C', ls='--', lw=1.0, label='1× (full coverage)')
    ax.set_facecolor('#1A1612'); fig.patch.set_facecolor('#1A1612')
    ax.tick_params(colors='#E8E5E0'); ax.xaxis.label.set_color('#E8E5E0'); ax.yaxis.label.set_color('#E8E5E0')
    for s in ax.spines.values(): s.set_color('#3A3228')
    ax.set_title('Storage Cost Coverage Ratio per block', color='#EADCC8')
    ax.set_xlabel('Block height'); ax.set_ylabel('SCCR (dimensionless)')
    ax.legend(facecolor='#231F19', edgecolor='#3A3228', labelcolor='#EADCC8')
    ax.grid(True, color='#3A3228', alpha=0.4)
    fig.tight_layout(); fig.savefig(CHART_PATH)
    plt.close(fig)
    return True


def main():
    ap = argparse.ArgumentParser(description='BSAHI SCCR reproduction')
    ap.add_argument('--live', action='store_true', help='read live capture from the DB (default: frozen capture)')
    ap.add_argument('--json', action='store_true', help='emit machine-readable JSON to stdout')
    args = ap.parse_args()

    cfg = load_spec()
    try:
        capture = load_capture_live() if args.live else json.load(open(FROZEN))
    except Exception as e:
        print('ERROR: could not load capture: %s' % e, file=sys.stderr)
        return 1

    rows, ratios, l_net, cb = compute(cfg, capture)
    if not ratios:
        print('ERROR: no blocks parsed', file=sys.stderr)
        return 1

    avg = sum(ratios) / len(ratios)
    below = sum(1 for r in ratios if r < 1.0)
    chart = write_chart(rows)

    result = {
        'spec_version': cfg['version'],
        'source': 'live-db' if args.live else 'frozen-capture',
        'blocks': len(ratios),
        'avg_sccr': round(avg, 6),
        'min': round(min(ratios), 6),
        'max': round(max(ratios), 6),
        'below_1x': below,
        'below_1x_pct': round(below / len(ratios) * 100, 2),
        'l_net_usd': round(l_net, 6),
        'chart': CHART_PATH if chart else None,
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print('=' * 60)
        print('  BSAHI — Storage Cost Coverage Ratio (SCCR)')
        print('  model-spec v%s · %s · %d blocks' % (cfg['version'], result['source'], len(ratios)))
        print('=' * 60)
        print('  Avg SCCR      : %.4f' % avg)
        print('  Min / Max     : %.4f / %.4f' % (min(ratios), max(ratios)))
        print('  Below 1×      : %d/%d (%.1f%%)' % (below, len(ratios), result['below_1x_pct']))
        print('  L_net         : $%.4f / block' % l_net)
        if chart:
            print('  Chart         : %s' % CHART_PATH)
        print('  Reproduce     : python3 tools/research/reproduce.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
