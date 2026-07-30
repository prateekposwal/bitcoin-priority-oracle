import json, urllib.request, sys

def fetch_ordinals_stats():
    try:
        resp = urllib.request.urlopen('https://ordinals.com/api/stats', timeout=10)
        return json.loads(resp.read())
    except Exception as e:
        print(f"  WARNING: Ordinals API unavailable: {e}")
        return None

def fetch_utxo_set_size():
    try:
        resp = urllib.request.urlopen('https://blockchain.info/q/utxocount', timeout=10)
        return int(resp.read().strip())
    except Exception as e:
        print(f"  WARNING: Blockchain.info unavailable: {e}")
        return None

def fetch_mempool_fees():
    try:
        resp = urllib.request.urlopen('https://mempool.space/api/v1/fees/recommended', timeout=10)
        return json.loads(resp.read())
    except Exception as e:
        print(f"  WARNING: Mempool.space unavailable: {e}")
        return None

def main():
    print("=" * 62)
    print("  Bitcoin Inscription Data - Live Verification")
    print("=" * 62)
    
    stats = fetch_ordinals_stats()
    if stats:
        total = stats.get('total_inscriptions', 0)
        print(f"\n  Total inscriptions:        {total:>15,}")
    
    utxo = fetch_utxo_set_size()
    if utxo:
        print(f"  UTXO set size:             {utxo:>15,} outputs")
        print(f"  Inscriptions as % of UTXO:  {stats.get('total_inscriptions',0)/max(utxo,1)*100:>13.2f}%" if stats else "")
    
    fees = fetch_mempool_fees()
    if fees:
        print(f"\n  Current fee estimates (sat/vB):")
        for label, key in [("No priority (slow)", "minimumFee"), ("Economy", "economyFee"),
                            ("Hour", "hourFee"), ("Half-hour", "halfHourFee"),
                            ("Fastest", "fastestFee")]:
            val = fees.get(key)
            if val: print(f"    {label:25s}  {val} sat/vB")
    
    print(f"\n  To estimate daily inscriptions, query:")
    print(f"    curl https://ordinals.com/api/inscriptions/recent | jq '.inscriptions | length'")

if __name__ == "__main__":
    main()
