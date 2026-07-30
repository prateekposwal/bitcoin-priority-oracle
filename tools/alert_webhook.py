#!/usr/bin/env python3
"""Alert webhook — creates GitHub Issues when fees cross thresholds.
Designed to be called by the daily research monitor."""
import json, os, sys, urllib.request

ALERT_FILE = os.path.join(os.path.dirname(__file__), 'alerts.json')
THRESHOLDS = {
    'fastestFee': {'high': 50, 'low': 1},
    'economyFee': {'high': 20, 'low': 1},
}

def check_alerts(live_data):
    alerts = []
    fees = live_data.get('fees', {})
    btc = live_data.get('btc_price', 0)
    
    for key, threshold in THRESHOLDS.items():
        val = fees.get(key, 0)
        if val > threshold['high']:
            alerts.append(f"🚨 {key}: {val} sat/vB — above {threshold['high']} threshold")
        elif val < threshold['low'] and btc > 50000:
            alerts.append(f"⚡ {key}: {val} sat/vB — below {threshold['low']} threshold at high BTC price")
    
    # Check for sudden fee spikes (fastest > 3x economy)
    fastest = fees.get('fastestFee', 0)
    economy = fees.get('economyFee', 1)
    if fastest > 3 * economy and fastest > 5:
        alerts.append(f"📈 Fee spike: fastest ({fastest}) is {fastest/economy:.0f}x economy ({economy})")
    
    return alerts

def main():
    data_file = os.path.join(os.path.dirname(__file__), 'live_data.json')
    if not os.path.exists(data_file):
        print("No live_data.json found")
        return
    
    with open(data_file) as f:
        live_data = json.load(f)
    
    alerts = check_alerts(live_data)
    
    # Save alerts for the GitHub Action to pick up
    with open(ALERT_FILE, 'w') as f:
        json.dump({"alerts": alerts, "timestamp": live_data.get("timestamp", "")}, f, indent=2)
    
    if alerts:
        print(f"⚠️ {len(alerts)} alert(s) triggered:")
        for a in alerts:
            print(f"  {a}")
    else:
        print("✅ No alerts triggered")

    # Send webhooks if alerts exist
    try:
        sys.path.insert(0, os.path.dirname(__file__))
        from webhook_sender import main as send_webhooks
        send_webhooks()
    except Exception as e:
        print(f"  Webhook send failed: {e}")

if __name__ == "__main__":
    main()
