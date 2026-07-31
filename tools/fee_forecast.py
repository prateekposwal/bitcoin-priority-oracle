#!/usr/bin/env python3
"""
Fee Forecast — projects fee trends from spool-indexed historical data.
Reads the spool's `fees` index directly (no HTTP, works offline).
Simple linear regression on the last N days of fastest fee data.
"""
import json, os, math, glob, sys
from datetime import datetime, timezone

SPOOL_INDEX = os.path.join(os.path.dirname(__file__), '..', 'captured-data', 'spool', 'index')
FORECAST_FILE = os.path.join(os.path.dirname(__file__), 'fee_forecast.json')
MIRROR_FILE = os.path.join(os.path.dirname(__file__), '..', 'captured-data', 'fee_forecast.json')

def load_spool_series(source, field, days=7):
    """Read spool index jsonl for last `days` days, return [(captureTime, value)]."""
    points = []
    day_dirs = sorted(glob.glob(os.path.join(SPOOL_INDEX, source, '*.jsonl')))[-days:]
    for f in day_dirs:
        with open(f) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                payload = rec.get('payload') or {}
                data = payload.get('data')
                if isinstance(data, dict) and field in data and data[field] is not None:
                    try:
                        points.append((rec.get('captureTime', ''), float(data[field])))
                    except (TypeError, ValueError):
                        pass
    return points

def main():
    history = load_spool_series('fees', 'fastestFee')

    if len(history) < 2:
        print(f"Need 2+ data points, have {len(history)} (spool not yet populated)")
        return

    fees = [v for _, v in history]
    n = len(dates) if (dates := list(range(len(fees)))) else 0

    # Simple linear regression
    sum_x = sum(dates)
    sum_y = sum(fees)
    sum_xy = sum(x * y for x, y in zip(dates, fees))
    sum_xx = sum(x * x for x in dates)

    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x) if (n * sum_xx - sum_x * sum_x) != 0 else 0
    intercept = (sum_y - slope * sum_x) / n

    last_date = dates[-1]
    forecast = []
    for i in range(1, 4):
        pred = slope * (last_date + i) + intercept
        forecast.append({
            "day_offset": i,
            "predicted_fastest_fee": max(1, round(pred, 1)),
            "trend": "rising" if slope > 0.1 else ("falling" if slope < -0.1 else "stable"),
        })

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_points": n,
        "first_capture": history[0][0] if history else None,
        "last_capture": history[-1][0] if history else None,
        "latest_fastest_fee": fees[-1] if fees else None,
        "slope": round(slope, 3),
        "trend": "rising" if slope > 0.1 else ("falling" if slope < -0.1 else "stable"),
        "forecast": forecast,
        "disclaimer": "Simple linear projection from spool capture history. Not financial advice.",
    }

    with open(FORECAST_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    os.makedirs(os.path.dirname(MIRROR_FILE), exist_ok=True)
    with open(MIRROR_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Fee forecast generated ({n} data points)")
    print(f"  Trend: {output['trend']} (slope={slope:.3f})")
    for f in forecast:
        print(f"  +{f['day_offset']}d: ~{f['predicted_fastest_fee']} sat/vB")

if __name__ == "__main__":
    main()
