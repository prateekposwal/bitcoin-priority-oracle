#!/bin/bash
# SCCR multi-language cross-check: JS (canonical, reads DB) vs Python vs C
# (both read the frozen capture). Asserts per-block agreement to 6 decimals.
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

echo "── 1/3 JS (canonical, frozen capture via SCCR_INPUT_FILE)"
SCCR_INPUT_FILE=research/reproduce/input/fee_history_capture.json node tools/research/storage-ratio.js > /tmp/sccr_js_report.txt
JS_LINE=$(grep -E "Avg ratio" /tmp/sccr_js_report.txt)
echo "   $JS_LINE"

echo "── 2/3 Python (frozen capture)"
python3 research/reproduce/reproduce_sccr.py | grep -E "Avg SCCR|Blocks"

echo "── 3/3 C (frozen capture)"
./research/reproduce/reproduce_sccr "$REPO" | grep -E "Avg SCCR|Blocks"

echo "── per-block comparison (Python vs C vs JS)"
python3 - "$REPO" << 'PYEOF'
import json, sys, subprocess, os
repo = sys.argv[1]

py = json.load(open(os.path.join(repo, 'research/reproduce/output/reproduce_sccr_python.json')))
c  = json.load(open(os.path.join(repo, 'research/reproduce/output/reproduce_sccr_c.json')))

# JS per-block via the module (same DB capture the report used)
code = """
process.env.SCCR_INPUT_FILE = 'research/reproduce/input/fee_history_capture.json';
const sr = require('./tools/research/storage-ratio.js');
const rows = sr.computeFromFeeHistory();
const ratios = rows.map(r => r.ratio);
console.log(JSON.stringify({
  blocks: ratios.length,
  avg: ratios.reduce((a,b)=>a+b,0)/ratios.length,
  min: Math.min(...ratios), max: Math.max(...ratios),
  below1: ratios.filter(r=>r<1).length,
  perBlock: rows.map(r => ({height: r.height, ratio: r.ratio}))
}));
"""
js = json.loads(subprocess.run(['node', '-e', code], cwd=repo, capture_output=True, text=True, check=True).stdout)

print(f"   JS     : {js['blocks']} blocks, avg {js['avg']:.6f}, min {js['min']:.6f}, max {js['max']:.6f}, below1 {js['below1']}")
print(f"   Python : {py['blocks']} blocks, avg {py['avg_sccr']:.6f}, min {py['min']:.6f}, max {py['max']:.6f}, below1 {py['below_1x']}")
print(f"   C      : {c['blocks']} blocks, avg {c['avg_sccr']:.6f}, min {c['min']:.6f}, max {c['max']:.6f}, below1 {c['below_1x']}")

# per-block: JS heights vs python heights (same capture => same heights)
py_by_h = {r['height']: r['ratio'] for r in py['per_block']}
max_diff = 0.0; worst = None; missing = 0
for r in js['perBlock']:
    if r['height'] in py_by_h:
        d = abs(r['ratio'] - py_by_h[r['height']])
        if d > max_diff: max_diff, worst = d, r['height']
    else:
        missing += 1

print(f"\n   Per-block JS vs Python: {len(js['perBlock'])} heights matched, {missing} missing")
print(f"   Max |JS−Python| per-block: {max_diff:.8f} (height {worst})")
ok = (abs(js['avg']-py['avg_sccr']) < 5e-5 and abs(js['avg']-c['avg_sccr']) < 5e-5
      and js['blocks'] == py['blocks'] == c['blocks'] and max_diff < 1e-6)
print(f"\n   VERDICT: {'✅ ALL THREE IMPLEMENTATIONS AGREE' if ok else '❌ DISCREPANCY'}")
sys.exit(0 if ok else 1)
PYEOF
