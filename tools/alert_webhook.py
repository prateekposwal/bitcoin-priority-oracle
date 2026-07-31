#!/usr/bin/env python3
"""Alert webhook — creates alerts when fees cross thresholds or freshness breaks.
`--spool` mode reads live fee data from the spool index (no stale live_data.json).
Default mode keeps the legacy live_data.json read for back-compat."""
import json, os, sys, glob
from datetime import datetime, timezone

ALERT_FILE = os.path.join(os.path.dirname(__file__), 'alerts.json')
MIRROR_ALERT = os.path.join(os.path.dirname(__file__), '..', 'captured-data', 'alerts.json')
ALERT_LOG = os.path.join(os.path.dirname(__file__), '..', 'captured-data', 'alerts.log')
SPOOL_INDEX = os.path.join(os.path.dirname(__file__), '..', 'captured-data', 'spool', 'index')
THRESHOLDS = {
    'fastestFee': {'high': 50, 'low': 1},
    'economyFee': {'high': 20, 'low': 1},
}
FRESHNESS_MAX_MIN = 120

def latest_from_spool(source, field):
    """Return (value, captureTime) of the newest fee capture in the spool."""
    best_val, best_ts = None, None
    for f in sorted(glob.glob(os.path.join(SPOOL_INDEX, source, '*.jsonl'))):
        with open(f) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                data = (rec.get('payload') or {}).get('data')
                ts = rec.get('captureTime', '')
                if isinstance(data, dict) and field in data:
                    try:
                        val = float(data[field])
                    except (TypeError, ValueError):
                        continue
                    if best_ts is None or ts > best_ts:
                        best_val, best_ts = val, ts
    return best_val, best_ts

def latest_nested_from_spool(source, parent, field):
    """Newest value of data[parent][field] (handles lightning latest.*, mempool_blocks arrays)."""
    best_val, best_ts = None, None
    for f in sorted(glob.glob(os.path.join(SPOOL_INDEX, source, '*.jsonl'))):
        with open(f) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                data = (rec.get('payload') or {}).get('data')
                ts = rec.get('captureTime', '')
                val = None
                if isinstance(data, dict) and isinstance(data.get(parent), dict) and field in data[parent]:
                    val = float(data[parent][field])
                elif isinstance(data, list) and data and isinstance(data[0], dict) and field in data[0]:
                    val = float(data[0][field])
                if val is not None:
                    try:
                        val = float(val)
                    except (TypeError, ValueError):
                        continue
                    if best_ts is None or ts > best_ts:
                        best_val, best_ts = val, ts
    return best_val, best_ts

def freshness_minutes(capture_ts):
    """'2026-07-31_20-22-42' (local) -> minutes since now. None if unparsable."""
    try:
        t = datetime.strptime(capture_ts, '%Y-%m-%d_%H-%M-%S').replace(tzinfo=timezone.utc)
    except Exception:
        return None
    return (datetime.now(timezone.utc) - t).total_seconds() / 60.0

def check_alerts(fees, btc, capture_ts, extra=None):
    alerts = []
    extra = extra or {}
    for key, threshold in THRESHOLDS.items():
        val = fees.get(key, 0)
        if val > threshold['high']:
            alerts.append(f"🚨 {key}: {val} sat/vB — above {threshold['high']} threshold")
        elif val < threshold['low'] and btc > 50000:
            alerts.append(f"⚡ {key}: {val} sat/vB — below {threshold['low']} threshold at high BTC price")

    fastest = fees.get('fastestFee', 0)
    economy = fees.get('economyFee', 1)
    if fastest > 3 * economy and fastest > 5:
        alerts.append(f"📈 Fee spike: fastest ({fastest}) is {fastest/economy:.0f}x economy ({economy})")

    age = freshness_minutes(capture_ts) if capture_ts else None
    if age is not None and age > FRESHNESS_MAX_MIN:
        alerts.append(f"🕐 data freshness: no fee capture for {age:.0f} min (expected ≤{FRESHNESS_MAX_MIN})")

    # M6: mempool congestion (vsize > 300 MB)
    mempool_vsize = extra.get('mempool_vsize')
    if mempool_vsize is not None and mempool_vsize > 300 * 1e6:
        alerts.append(f"🌊 Mempool congestion: {mempool_vsize/1e6:.0f} MB — above 300 MB threshold")

    # M6: block-interval deviation (avgInterval > 15 min or < 5 min)
    avg_interval = extra.get('avg_interval_sec')
    if avg_interval is not None:
        if avg_interval > 900:
            alerts.append(f"🐢 Slow blocks: avg interval {avg_interval/60:.0f} min — above 15 min")
        elif avg_interval < 300:
            alerts.append(f"⚡ Fast blocks: avg interval {avg_interval/60:.0f} min — below 5 min")

    return alerts

def load_fees_spool():
    fees = {}
    for field in ['fastestFee', 'halfHourFee', 'hourFee', 'economyFee', 'minimumFee']:
        val, ts = latest_from_spool('fees', field)
        if val is not None:
            fees[field] = val
    _, latest_ts = latest_from_spool('fees', 'fastestFee')
    btc, _ = latest_from_spool('btc_price', 'USD')
    return fees, btc or 0, latest_ts

def main():
    use_spool = '--spool' in sys.argv

    if use_spool:
        fees, btc, latest_ts = load_fees_spool()
        if not fees:
            print("Spool has no fee data yet")
            return
        timestamp = latest_ts
        btc_price = btc
        # M6: extra spool signals
        mv, _ = latest_from_spool('mempool', 'vsize')
        ai, _ = latest_nested_from_spool('block_interval', 'blocks', 'avgInterval')
        extra = {'mempool_vsize': mv, 'avg_interval_sec': ai}
    else:
        data_file = os.path.join(os.path.dirname(__file__), 'live_data.json')
        if not os.path.exists(data_file):
            print("No live_data.json found (use --spool for spool-backed alerts)")
            return
        with open(data_file) as f:
            live_data = json.load(f)
        fees = live_data.get('fees', {})
        btc_price = live_data.get('btc_price', 0)
        timestamp = live_data.get('timestamp', '')
        extra = {}

    alerts = check_alerts(fees, btc_price, timestamp, extra=extra)

    payload = {"alerts": alerts, "timestamp": timestamp, "source": "spool" if use_spool else "live_data"}
    with open(ALERT_FILE, 'w') as f:
        json.dump(payload, f, indent=2)
    os.makedirs(os.path.dirname(MIRROR_ALERT), exist_ok=True)
    with open(MIRROR_ALERT, 'w') as f:
        json.dump(payload, f, indent=2)

    # Append to alerts.log (JSONL) so history exists even with zero webhooks
    if alerts:
        try:
            os.makedirs(os.path.dirname(ALERT_LOG), exist_ok=True)
            with open(ALERT_LOG, 'a') as f:
                for a in alerts:
                    f.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(), "alert": a}) + '\n')
        except Exception as e:
            print(f"  alerts.log append failed: {e}")

    if alerts:
        print(f"⚠️ {len(alerts)} alert(s) triggered:")
        for a in alerts:
            print(f"  {a}")
    else:
        print("✅ No alerts triggered")

    try:
        sys.path.insert(0, os.path.dirname(__file__))
        from webhook_sender import main as send_webhooks
        send_webhooks()
    except Exception as e:
        print(f"  Webhook send failed: {e}")

if __name__ == "__main__":
    main()
