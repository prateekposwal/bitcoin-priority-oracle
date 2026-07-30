#!/usr/bin/env python3
"""Generate CSV export of fee history for researchers."""
import json, os, csv

HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'fee_history.json')
CSV_FILE = os.path.join(os.path.dirname(__file__), 'fee_history.csv')

def generate_csv():
    if not os.path.exists(HISTORY_FILE):
        print("No history data yet")
        return
    
    with open(HISTORY_FILE) as f:
        history = json.load(f)
    
    if not history:
        print("Empty history")
        return
    
    fields = ['date', 'fastestFee', 'halfHourFee', 'hourFee', 'economyFee', 'btc_price', 'mempool_tx']
    
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for entry in history:
            row = {k: entry.get(k, '') for k in fields}
            writer.writerow(row)
    
    print(f"CSV exported: {CSV_FILE} ({len(history)} rows)")

if __name__ == "__main__":
    generate_csv()
