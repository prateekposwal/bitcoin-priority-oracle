#!/usr/bin/env python3
"""
Continuous Research Monitor — Bitcoin Priority Oracle
Runs daily: fetches live data, checks for new discussions, updates model output.
"""
import json, urllib.request, os, sys
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(BASE, 'live_data.json')

def fetch_json(url, timeout=15):
    try:
        resp = urllib.request.urlopen(url, timeout=timeout)
        return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

def main():
    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "fees": {},
        "btc_price": None,
        "bip110_signaling": None,
        "inscriptions": None,
        "utxo_set": None,
        "alerts": []
    }

    # 1. Fee estimates from mempool.space
    fees = fetch_json('https://mempool.space/api/v1/fees/recommended')
    if 'fastestFee' in fees:
        report['fees'] = fees
    else:
        report['alerts'].append(f"mempool.space fee API failed: {fees.get('error', 'unknown')}")

    # 2. BTC price from blockchain.info
    ticker = fetch_json('https://blockchain.info/ticker')
    if isinstance(ticker, dict) and 'USD' in ticker:
        report['btc_price'] = ticker['USD']['last']
    else:
        report['alerts'].append("blockchain.info ticker failed")

    # 3. BIP-110 signaling — previously from wickedsmartbitcoin.com API (now defunct)
    # The dashboard at wickedsmartbitcoin.com still tracks this but has no public API.
    # Last known value from Reddit discussion: ~0.1-0.8% signaling, dropping.
    # See: https://old.reddit.com/r/Bitcoin/comments/1uhzk8o/bip_110_thoughts/
    report['bip110_signaling'] = {"status": "API no longer available", "last_known": "~0.1-0.8%, dropping (Jul 2026)"}

    # 4. Check r/BitcoinEngineering thread for new replies (heuristic: title match)
    # Note: r/BitcoinEngineering has no public JSON API. Web scraping would be fragile.
    # This is a placeholder for when an API becomes available.

    # Write output
    with open(OUTPUT, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Research monitor updated: {OUTPUT}")
    print(f"  BTC: ${report['btc_price']}" if report['btc_price'] else "  BTC price: unavailable")
    print(f"  Fees: {report['fees']}")
    if report['alerts']:
        for a in report['alerts']:
            print(f"  ALERT: {a}")

if __name__ == "__main__":
    main()
