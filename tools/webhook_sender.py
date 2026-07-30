#!/usr/bin/env python3
"""Webhook sender — POSTs alerts to configured URLs when fees cross thresholds.
Config file: tools/webhook_config.json (create with empty list if not exists).
Each entry: {"url": "https://example.com/webhook", "events": ["high_fee", "low_fee", "spike"]}
"""
import json, os, urllib.request

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'webhook_config.json')
ALERT_FILE = os.path.join(os.path.dirname(__file__), 'alerts.json')

def main():
    if not os.path.exists(ALERT_FILE):
        print("No alerts.json found")
        return
    
    with open(ALERT_FILE) as f:
        alert_data = json.load(f)
    
    alerts = alert_data.get('alerts', [])
    if not alerts:
        return
    
    # Load webhook config
    config = {"webhooks": []}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            config = json.load(f)
    
    if not config.get('webhooks'):
        print("No webhooks configured. Create tools/webhook_config.json:")
        print('[{"url": "https://your-server.com/webhook", "events": ["high_fee"]}]')
        return
    
    payload = json.dumps({
        "source": "bitcoinsahi.com",
        "timestamp": alert_data.get("timestamp", ""),
        "alerts": alerts,
    }).encode()
    
    for hook in config['webhooks']:
        try:
            req = urllib.request.Request(hook['url'], data=payload,
                headers={'Content-Type': 'application/json'}, method='POST')
            r = urllib.request.urlopen(req, timeout=10)
            print(f"Webhook sent to {hook['url']}: {r.status}")
        except Exception as e:
            print(f"Webhook failed for {hook['url']}: {e}")

if __name__ == "__main__":
    main()
