#!/usr/bin/env python3
"""
Test suite for tools/fee_forecast.py — validates the load-bearing knowledge
formulas (Holt exponential smoothing, Welford streaming stats, regime detection).
If any formula is wrong these fail loudly at the next gate.
"""
import os
import sys
import unittest
import statistics

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fee_forecast as fc


class TestWelford(unittest.TestCase):
    def test_matches_statistics(self):
        import random
        random.seed(42)
        samples = [random.uniform(0, 100) for _ in range(500)]
        mean, var, sd = fc.welford(samples)
        self.assertAlmostEqual(mean, statistics.mean(samples), places=9)
        self.assertAlmostEqual(sd, statistics.pstdev(samples), places=9)

    def test_empty(self):
        mean, var, sd = fc.welford([])
        self.assertEqual((mean, var, sd), (0.0, 0.0, 0.0))

    def test_single(self):
        mean, var, sd = fc.welford([42.0])
        self.assertEqual(mean, 42.0)
        self.assertEqual(var, 0.0)


class TestExponentialSmoothing(unittest.TestCase):
    def test_rising_series(self):
        series = [10 + 0.5 * i for i in range(40)]
        model = fc.exponential_smoothing(series)
        self.assertIsNotNone(model)
        self.assertGreater(model['forecast'][0], series[-1])
        self.assertLess(model['rmse'], 1.0)
        self.assertEqual(model['algorithm'], 'holt-linear-trend')

    def test_flat_series(self):
        series = [5.0] * 40
        model = fc.exponential_smoothing(series)
        self.assertLess(abs(model['trend']), 0.1)

    def test_too_few_points_returns_none(self):
        self.assertIsNone(fc.exponential_smoothing([5.0]))

    def test_alpha_only_below_trend_points(self):
        series = [10, 11, 12, 13, 14]
        model = fc.exponential_smoothing(series)
        self.assertEqual(model['algorithm'], 'alpha-only')


class TestRegimeDetect(unittest.TestCase):
    def test_spike_detected(self):
        series = [5.0] * 40 + [50.0]
        regime = fc.regime_detect(series)
        self.assertEqual(regime['current'], 'spike')

    def test_dip_detected(self):
        series = [5.0] * 40 + [0.5]
        regime = fc.regime_detect(series)
        self.assertEqual(regime['current'], 'dip')

    def test_normal_flat(self):
        series = [5.0] * 40
        regime = fc.regime_detect(series)
        self.assertEqual(regime['current'], 'normal')

    def test_empty(self):
        regime = fc.regime_detect([])
        self.assertEqual(regime['current'], 'normal')


class TestLinearRegression(unittest.TestCase):
    def test_rising(self):
        slope, intercept = fc.linear_regression(list(range(10)), [i for i in range(10)])
        self.assertAlmostEqual(slope, 1.0, places=6)

    def test_fallback(self):
        slope, intercept = fc.linear_regression([0], [5])
        self.assertEqual((slope, intercept), (0, 0))


class TestMainOutput(unittest.TestCase):
    def test_output_shape(self):
        # Run against a temp spool-like fixture by monkeypatching the reader
        orig = fc.load_spool_series
        fc.load_spool_series = lambda s, f, days=7: [('2026-07-31_10-00-00', 10.0 + 0.1 * i) for i in range(30)]
        fc.FORECAST_FILE = '/tmp/test_forecast_out.json'
        fc.MIRROR_FILE = '/tmp/test_forecast_mirror.json'
        try:
            import io
            from contextlib import redirect_stdout
            buf = io.StringIO()
            with redirect_stdout(buf):
                fc.main()
            with open(fc.FORECAST_FILE) as f:
                out = json.load(f)
            for key in ['generated_at', 'data_points', 'trend', 'slope', 'forecast', 'model', 'params', 'regime', 'quality']:
                self.assertIn(key, out)
            self.assertEqual(len(out['forecast']), 3)
            self.assertIn('predicted_fastest_fee', out['forecast'][0])
        finally:
            fc.load_spool_series = orig


if __name__ == '__main__':
    import json
    unittest.main()
