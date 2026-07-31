#!/usr/bin/env python3
"""
BSAHI — Compliant Publishing Scheduler
======================================
Runs the compliant poster across all platforms on a natural cadence.
Integrates with the go-live system to run periodically.

Cadence (anti-spam, per platform):
- Reddit:    min 6h apart, max 2/day
- LinkedIn:  min 12h apart, max 1/day
- Medium:    min 24h apart, max 1/day

Compliance rules (why this works where link-drops fail):
- Substantive in-post analysis generated from real captured data
- No promotional link-drops
- Platform-native formatting
- Every post logged for review
"""
import subprocess, time, json, os, sys

REPO = '/Users/prateekposwal/Desktop/block-space-economics'
BIN = os.path.join(REPO, 'tools/bridge/compliant-poster.py')

PLATFORMS = ['reddit', 'linkedin', 'medium']

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] [Scheduler] {msg}", flush=True)

def check_cadence(platform):
    r = subprocess.run(['node', '-e',
        f'var c = require("{REPO}/tools/bridge/compliant-content.js"); console.log(JSON.stringify(c.canPost("{platform}")))'],
        capture_output=True, text=True, timeout=15, cwd=REPO)
    try:
        return json.loads(r.stdout)
    except:
        return {'ok': False, 'nextPostMs': 86400000, 'postsToday': 0}

def post(platform):
    log(f"Posting to {platform}...")
    r = subprocess.run(['python3', BIN, platform], capture_output=True, text=True, timeout=180, cwd=REPO)
    out = (r.stdout or '').strip() + (('\n' + r.stderr) if r.stderr else '')
    log(out[-500:])
    return r.returncode == 0

def run_cycle():
    log("=== Compliant publishing cycle ===")
    for platform in PLATFORMS:
        cadence = check_cadence(platform)
        if not cadence.get('ok'):
            next_h = cadence.get('nextPostMs', 0) / 3600000
            log(f"{platform}: cadence block (next in {next_h:.1f}h, {cadence.get('postsToday',0)} today)")
            continue
        try:
            post(platform)
        except Exception as e:
            log(f"{platform}: error {e}")
        # Natural pacing between platforms
        time.sleep(8)
    log("=== Cycle complete ===")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--daemon':
        # Run forever, checking every 30 min
        while True:
            run_cycle()
            log("Next check in 30 min")
            time.sleep(1800)
    else:
        run_cycle()
