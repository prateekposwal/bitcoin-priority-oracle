#!/usr/bin/env python3
"""
Cross-Reference Explorer — finds contradictions and signals across sources.
Run: python3 tools/cross_ref_explorer.py [--notify]
"""
import json, urllib.request, os, sys
from datetime import datetime

def fetch(url, timeout=15):
    try:
        resp = urllib.request.urlopen(url, timeout=timeout)
        data = resp.read().decode()
        try: return json.loads(data)
        except: return {"raw": data[:500]}
    except Exception as e:
        return {"error": str(e)}

def main():
    findings = []
    timestamp = datetime.utcnow().isoformat()
    
    print(f"Cross-Reference Explorer — {timestamp}")
    print("=" * 60)
    
    # Source 1: mempool.space fees
    fees = fetch('https://mempool.space/api/v1/fees/recommended')
    fastest = fees.get('fastestFee', 0)
    economy = fees.get('economyFee', 0)
    print(f"\n[1] mempool.space: fastest={fastest} sat/vB, economy={economy} sat/vB")
    if fastest > 50:
        findings.append(f"HIGH_FEES: fastest fee {fastest} sat/vB — possible inscription mania")
    if economy < 1 and fastest < 2:
        findings.append(f"LOW_FEES: fees at minimum — low network activity")
    
    # Source 2: Blockchain.info BTC price + UTXO count
    ticker = fetch('https://blockchain.info/ticker')
    btc_price = ticker.get('USD', {}).get('last', 0) if isinstance(ticker, dict) else 0
    print(f"[2] blockchain.info: BTC=${btc_price:,.0f}")
    
    utxo_count = fetch('https://blockchain.info/q/utxocount')
    if isinstance(utxo_count, int):
        print(f"[3] blockchain.info: UTXO count={utxo_count:,}")
    
    # Cross-reference: fee-to-price ratio
    if btc_price > 0 and fastest > 0:
        fee_sats_per_dollar = fastest / btc_price * 100_000_000
        print(f"[4] Cross-ref: fee efficiency = {fee_sats_per_dollar:.2f} sat/$")
        if fee_sats_per_dollar < 0.1:
            findings.append(f"FEES CHEAP RELATIVE TO PRICE: {fee_sats_per_dollar:.2f} sat/$ — possible spam subsidy")
    
    # Source 4: BIP-110 signaling (if API still exists)
    bip110 = fetch('https://wickedsmartbitcoin.com/api/bip110')
    if isinstance(bip110, dict):
        signal_pct = bip110.get('signaling_percent', 0)
        print(f"[5] BIP-110 signaling: {signal_pct}%")
        if signal_pct > 10:
            findings.append(f"BIP110_SIGNAL_SURGE: {signal_pct}% — significant increase")
    
    # Summary
    print("\n" + "=" * 60)
    if findings:
        print(f"FINDINGS ({len(findings)}):")
        for f in findings:
            print(f"  ⚠ {f}")
    else:
        print("No significant findings — all nominal.")
    
    # Output as JSON for GitHub Actions
    output = {
        "timestamp": timestamp,
        "btc_price": btc_price,
        "fastest_fee": fastest,
        "economy_fee": economy,
        "findings": findings
    }
    out_path = os.path.join(os.path.dirname(__file__), 'cross_ref_output.json')
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"\nOutput saved to {out_path}")

if __name__ == "__main__":
    main()
