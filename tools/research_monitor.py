#!/usr/bin/env python3
"""
Continuous Research Monitor — Bitcoin Sahi
Runs daily: fetches live data, stores 7-day history, updates model output.
"""
import json, urllib.request, os
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(BASE, 'live_data.json')
HISTORY = os.path.join(BASE, 'fee_history.json')

def fetch_json(url, timeout=15):
    try:
        resp = urllib.request.urlopen(url, timeout=timeout)
        return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

def main():
    now = datetime.now(timezone.utc)
    report = {
        "timestamp": now.isoformat(),
        "fees": {},
        "btc_price": None,
        "mempool": None,
        "block_height": None,
        "bip110_signaling": None,
        "utxo_set": None,
        "alerts": []
    }

    # 1. Fee estimates from mempool.space
    fees = fetch_json('https://mempool.space/api/v1/fees/recommended')
    if 'fastestFee' in fees:
        report['fees'] = fees
    else:
        report['alerts'].append(f"Fee API failed: {fees.get('error', 'unknown')}")

    # 2. BTC price from blockchain.info
    ticker = fetch_json('https://blockchain.info/ticker')
    if isinstance(ticker, dict) and 'USD' in ticker:
        report['btc_price'] = ticker['USD']['last']
    else:
        report['alerts'].append("blockchain.info ticker failed")

    # 3. Mempool data from mempool.space
    mempool = fetch_json('https://mempool.space/api/mempool')
    if 'count' in mempool:
        report['mempool'] = {
            "unconfirmed_tx": mempool['count'],
            "vsize": mempool.get('vsize', 0),
            "total_fee_sats": mempool.get('total_fee', 0),
        }
    else:
        report['alerts'].append("mempool.space mempool API failed")

    # 4. Block height from blockstream.info
    try:
        r = urllib.request.urlopen('https://blockstream.info/api/blocks/tip/height', timeout=10)
        report['block_height'] = int(r.read().strip())
    except Exception as e:
        report['alerts'].append(f"blockstream.info height API: {e}")

    # 5. BIP-110 signaling — checked directly from block version bits via blockstream.info
    try:
        r = urllib.request.urlopen(
            f'https://blockstream.info/api/blocks/{report["block_height"]}/25', timeout=15)
        blocks = json.loads(r.read())
        signaling_blocks = sum(1 for b in blocks if b.get('version', 0) & 0x10)
        total_checked = len(blocks)
        report['bip110_signaling'] = {
            "source": "blockstream.info (version bit 4, last 25 blocks)",
            "signaling_count": signaling_blocks,
            "total_checked": total_checked,
            "signaling_percent": round(signaling_blocks / max(total_checked, 1) * 100, 1),
            "block_height": report["block_height"],
        }
    except Exception as e:
        report['bip110_signaling'] = {
            "status": "check failed",
            "error": str(e)[:80],
            "last_known": "~0.1-0.8%, dropping (Jul 2026)",
        }

    # Write output
    with open(OUTPUT, 'w') as f:
        json.dump(report, f, indent=2)

    # ── Fee History (7-day rolling) ──
    history = []
    if os.path.exists(HISTORY):
        try:
            with open(HISTORY) as f:
                history = json.load(f)
        except: pass
    
    if 'fastestFee' in fees:
        entry = {
            "date": now.strftime('%Y-%m-%d'),
            "fastestFee": fees['fastestFee'],
            "halfHourFee": fees.get('halfHourFee', 0),
            "hourFee": fees.get('hourFee', 0),
            "economyFee": fees.get('economyFee', 0),
            "btc_price": report['btc_price'],
            "mempool_tx": mempool.get('count', 0) if isinstance(mempool, dict) else 0,
        }
        # Only add if not already today
        if not history or history[-1].get('date') != entry['date']:
            history.append(entry)
        # Keep last 14 entries
        history = history[-14:]
    
    with open(HISTORY, 'w') as f:
        json.dump(history, f, indent=2)

    print(f"Research monitor updated: {OUTPUT}")
    print(f"  BTC: ${report['btc_price'] or '?'}")
    print(f"  Fees: fastest={fees.get('fastestFee','?')}  economy={fees.get('economyFee','?')} sat/vB")
    print(f"  Mempool: {mempool.get('count','?')} unconfirmed tx" if isinstance(mempool, dict) else "")
    print(f"  Block height: {report['block_height']}")
    print(f"  Fee history: {len(history)} entries")
    if report['alerts']:
        for a in report['alerts']:
            print(f"  ALERT: {a}")

if __name__ == "__main__":
    main()
