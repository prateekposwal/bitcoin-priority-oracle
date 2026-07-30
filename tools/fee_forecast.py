#!/usr/bin/env python3
"""
Fee Forecast — projects fee trends from historical data.
Simple linear regression on the last N days of fastest fee data.
"""
import json, os, math
from datetime import datetime, timezone

HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'fee_history.json')
FORECAST_FILE = os.path.join(os.path.dirname(__file__), 'fee_forecast.json')

def main():
    if not os.path.exists(HISTORY_FILE):
        print("No fee history yet — need at least 2 data points")
        return
    
    with open(HISTORY_FILE) as f:
        history = json.load(f)
    
    if len(history) < 2:
        print(f"Need 2+ data points, have {len(history)}")
        return
    
    # Extract fastest fee data
    dates = list(range(len(history)))
    fees = [h.get('fastestFee', 0) for h in history]
    
    # Simple linear regression
    n = len(dates)
    sum_x = sum(dates)
    sum_y = sum(fees)
    sum_xy = sum(x * y for x, y in zip(dates, fees))
    sum_xx = sum(x * x for x in dates)
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x) if (n * sum_xx - sum_x * sum_x) != 0 else 0
    intercept = (sum_y - slope * sum_x) / n
    
    # Predict next 3 days
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
        "slope": round(slope, 3),
        "trend": "rising" if slope > 0.1 else ("falling" if slope < -0.1 else "stable"),
        "forecast": forecast,
        "disclaimer": "Simple linear projection from limited data. Not financial advice.",
    }
    
    with open(FORECAST_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Fee forecast generated ({n} data points)")
    print(f"  Trend: {output['trend']} (slope={slope:.3f})")
    for f in forecast:
        print(f"  +{f['day_offset']}d: ~{f['predicted_fastest_fee']} sat/vB")

if __name__ == "__main__":
    main()
