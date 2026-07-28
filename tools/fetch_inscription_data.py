import urllib.request, json

def fetch_recent_inscriptions():
    try:
        r = urllib.request.urlopen('https://blockstream.info/api/blocks/tip/height', timeout=10)
        tip = int(r.read().strip())
        print(f"Current block height: {tip}")

        r = urllib.request.urlopen(f'https://blockstream.info/api/block-height/{tip}', timeout=10)
        block_hash = r.read().decode().strip()
        print(f"Block hash: {block_hash[:16]}...")

        r = urllib.request.urlopen(f'https://blockstream.info/api/block/{block_hash}/txids', timeout=10)
        txids = json.loads(r.read())[:25]
        print(f"Got {len(txids)} transactions from block")

        total_bytes = 0
        witness_bytes = 0
        count = 0
        for txid in txids:
            try:
                r = urllib.request.urlopen(f'https://blockstream.info/api/tx/{txid}', timeout=10)
                tx = json.loads(r.read())
                for vin in tx.get('vin', []):
                    if 'witness' in vin and vin['witness']:
                        w_size = sum(len(w) for w in vin['witness']) // 2
                        if w_size > 50:
                            witness_bytes += w_size
                            count += 1
                hex = tx.get('hex', '')
                total_bytes += len(hex) // 2
            except:
                pass

        print(f"\nResults:")
        print(f"  Transactions checked: {len(txids)}")
        print(f"  Txs with large witness (>50B): {count}")
        print(f"  Avg witness size: {witness_bytes // max(count, 1)} bytes")
        print(f"  Avg total tx size: {total_bytes // max(len(txids), 1)} bytes")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_recent_inscriptions()
