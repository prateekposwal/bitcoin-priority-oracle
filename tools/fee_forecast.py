#!/usr/bin/env python3
"""
Fee Forecast — projects fee trends from spool-indexed historical data.
Reads the spool's `fees` index directly (no HTTP, works offline).

Model: Holt's linear-trend exponential smoothing with regime detection.
The math below is load-bearing — it implements the studied knowledge pillars
(knowledge/README.md, BSAHI repo). If any formula is wrong, test_forecast.py
fails loudly at the next gate.

Knowledge citations (per constant/function):
- Nilsson, "Introduction to Machine Learning" §online learning: exponential
  smoothing is the simplest online predictor — weighted average with geometric
  decay; recurrences share the Q-learning decay shape.
- Gallier, "Math for Deep Learning" §optimization: convexity, gradient step
  intuition, exponential decay alpha^t bounding old-observation influence.
- CLRS, "Introduction to Algorithms" §streaming/running statistics: Welford's
  online mean/variance (single pass, O(1) memory, numerically stable).
"""
import json, os, glob, math, sys
from datetime import datetime, timezone

def sys_argv():
    return sys.argv

# ── Model parameters (knowledge pillars) ───────────────────────────────────────
ALPHA = 0.3          # Nilsson: smoothing — weight on newest point in S_t = a*x_t + (1-a)*S_{t-1}
BETA = 0.1           # Gallier: trend smoothing in b_t = B*(S_t - S_{t-1}) + (1-B)*b_{t-1}
Z_SCORE_THRESHOLD = 2.0   # Gallier decision theory: +-2 sigma regime cutoff for spike/dip
REGIME_WINDOW = 24        # CLRS: trailing points for rolling Welford stats
FORECAST_HORIZON = 3      # day offsets
MIN_TREND_POINTS = 6      # <6 -> alpha-only (level), no trend term
MIN_POINTS = 2            # <2 -> fall back to linear regression

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


def welford(samples):
    """CLRS streaming — Welford online mean/variance, single pass, O(1) memory.
    Returns (mean, variance, stddev); population variance (M2/n)."""
    n = 0
    mean = 0.0
    m2 = 0.0
    for x in samples:
        n += 1
        delta = x - mean
        mean += delta / n
        m2 += delta * (x - mean)
    if n == 0:
        return (0.0, 0.0, 0.0)
    var = m2 / n if n > 1 else 0.0
    return (mean, var, math.sqrt(var))


def exponential_smoothing(series, alpha=ALPHA, beta=BETA, horizon=FORECAST_HORIZON):
    """Holt's linear trend (Nilsson online-learning recurrence, generalized):
      level:   S_t = a*x_t + (1-a)*(S_{t-1} + b_{t-1})
      trend:   b_t = B*(S_t - S_{t-1}) + (1-B)*b_{t-1}
      forecast: F_{t+m} = S_t + m*b_t   (Gallier geometric-decay intuition)
    Guards: < MIN_POINTS -> None (caller falls back to linear regression);
            < MIN_TREND_POINTS -> beta forced 0 (alpha-only, no trend).
    Returns {level, trend, forecast, rmse, mae, lastResidual, algorithm}."""
    n = len(series)
    if n < MIN_POINTS:
        return None
    if n < MIN_TREND_POINTS:
        beta = 0.0
    level = [float(series[0])]
    trend = [0.0]
    for i in range(1, n):
        l_prev = level[-1]
        b_prev = trend[-1]
        l_new = alpha * series[i] + (1 - alpha) * (l_prev + b_prev)
        b_new = beta * (l_new - l_prev) + (1 - beta) * b_prev
        level.append(l_new)
        trend.append(b_new)
    # One-step-ahead in-sample quality
    residuals = []
    for i in range(1, n):
        pred = level[i - 1] + trend[i - 1]
        residuals.append(series[i] - pred)
    rmse = math.sqrt(sum(r * r for r in residuals) / len(residuals)) if residuals else 0.0
    mae = sum(abs(r) for r in residuals) / len(residuals) if residuals else 0.0
    last_residual = residuals[-1] if residuals else 0.0
    b = trend[-1]
    forecast = [round(max(1, level[-1] + m * b), 1) for m in range(1, horizon + 1)]
    return {
        'level': level,
        'trend': b,
        'forecast': forecast,
        'rmse': round(rmse, 3),
        'mae': round(mae, 3),
        'lastResidual': round(last_residual, 3),
        'algorithm': 'holt-linear-trend' if n >= MIN_TREND_POINTS else 'alpha-only'
    }


def regime_detect(series, window=REGIME_WINDOW, z=Z_SCORE_THRESHOLD):
    """CLRS streaming — rolling Welford Z-scores over trailing window:
      z_i = (x_i - mu)/sigma -> 'spike' (z > +z), 'dip' (z < -z), else 'normal'.
    Returns {current, changes, labels, z_scores}. sigma=0 -> normal."""
    labels = []
    z_scores = []
    n = len(series)
    for i in range(n):
        start = max(0, i - window + 1)
        window_vals = series[start:i + 1]
        mean, var, sd = welford(window_vals)
        if sd == 0 or i < window:
            labels.append('normal')
            z_scores.append(0.0)
            continue
        zi = (series[i] - mean) / sd
        z_scores.append(round(zi, 3))
        if zi > z:
            labels.append('spike')
        elif zi < -z:
            labels.append('dip')
        else:
            labels.append('normal')
    changes = sum(1 for i in range(1, n) if labels[i] != labels[i - 1])
    return {
        'current': labels[-1] if labels else 'normal',
        'changes': changes,
        'labels': labels,
        'z_scores': z_scores
    }


def linear_regression(dates, fees):
    n = len(dates)
    if n < 2:
        return 0, 0
    sx = sum(dates)
    sy = sum(fees)
    sxy = sum(x * y for x, y in zip(dates, fees))
    sxx = sum(x * x for x in dates)
    denom = n * sxx - sx * sx
    slope = (n * sxy - sx * sy) / denom if denom != 0 else 0
    intercept = (sy - slope * sx) / n
    return slope, intercept


def load_history_fallback():
    """Runner-safe fallback: when the spool index is empty (CI runner has no
    local spool), load the committed data/fee_history.json (rich, written by the
    local snapshot agent) — NOT the 1-entry tools/ stub — as the series.
    Returns [(captureTime, value)]."""
    hist_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'fee_history.json')
    if not os.path.exists(hist_file):
        hist_file = os.path.join(os.path.dirname(__file__), 'fee_history.json')
    if not os.path.exists(hist_file):
        return []
    try:
        with open(hist_file) as f:
            hist = json.load(f)
    except Exception:
        return []
    points = []
    for h in hist:
        v = h.get('fastestFee')
        d = h.get('date')
        if v is not None and d:
            try:
                points.append((d + '_00-00-00', float(v)))
            except (TypeError, ValueError):
                pass
    return points


def main():
    history = load_spool_series('fees', 'fastestFee')
    if len(history) < 2 and '--history' in sys_argv():
        history = load_history_fallback()
    n = len(history)
    fees = [v for _, v in history]
    if n < 2:
        print(f"Need 2+ data points, have {n} (spool not yet populated)")
        return

    dates = list(range(n))
    slope, intercept = linear_regression(dates, fees)
    trend = "rising" if slope > 0.1 else ("falling" if slope < -0.1 else "stable")

    # Holt model (load-bearing knowledge)
    model = exponential_smoothing(fees)
    regime = regime_detect(fees)

    if model:
        forecast_items = []
        for i, pred in enumerate(model['forecast']):
            forecast_items.append({
                "day_offset": i + 1,
                "predicted_fastest_fee": pred,
                "trend": "rising" if model['trend'] > 0.1 else ("falling" if model['trend'] < -0.1 else "stable"),
            })
        output_slope = round(model['trend'], 3)
        output_trend = "rising" if model['trend'] > 0.1 else ("falling" if model['trend'] < -0.1 else "stable")
        output_model = model['algorithm']
        quality = {"rmse": model['rmse'], "mae": model['mae'], "lastResidual": model['lastResidual'], "algorithm": model['algorithm']}
        disclaimer = f"Holt linear-trend exponential smoothing on spool capture history ({model['algorithm']}). Not financial advice."
    else:
        # Fallback: plain linear projection (existing behavior)
        last_date = dates[-1]
        forecast_items = []
        for i in range(1, 4):
            pred = slope * (last_date + i) + intercept
            forecast_items.append({"day_offset": i, "predicted_fastest_fee": max(1, round(pred, 1)), "trend": trend})
        output_slope = round(slope, 3)
        output_trend = trend
        output_model = 'linear-fallback'
        quality = {"algorithm": "linear-fallback"}
        disclaimer = "Simple linear projection from spool capture history (insufficient points for Holt). Not financial advice."

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_points": n,
        "first_capture": history[0][0] if history else None,
        "last_capture": history[-1][0] if history else None,
        "latest_fastest_fee": fees[-1] if fees else None,
        "slope": output_slope,
        "trend": output_trend,
        "forecast": forecast_items,
        "model": output_model,
        "params": {"alpha": ALPHA, "beta": BETA, "z_score_threshold": Z_SCORE_THRESHOLD, "regime_window": REGIME_WINDOW},
        "regime": {"current": regime['current'], "changes": regime['changes'], "window": REGIME_WINDOW},
        "quality": quality,
        "disclaimer": disclaimer,
    }

    with open(FORECAST_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    os.makedirs(os.path.dirname(MIRROR_FILE), exist_ok=True)
    with open(MIRROR_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Fee forecast generated ({n} data points, model={output_model})")
    print(f"  Trend: {output_trend} (slope={output_slope:.3f}) | regime={regime['current']} (changes={regime['changes']})")
    print(f"  Quality: rmse={quality.get('rmse', 'n/a')} mae={quality.get('mae', 'n/a')}")
    for f in forecast_items:
        print(f"  +{f['day_offset']}d: ~{f['predicted_fastest_fee']} sat/vB")


if __name__ == "__main__":
    main()
