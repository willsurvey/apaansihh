"""Test fungsional Pipeline SWING — verifikasi tanpa merusak pipeline lain."""
import sys
sys.path.insert(0, ".")
import os
os.environ["PYTHONIOENCODING"] = "utf-8"

from screener import (
    _swing_compute_features, _swing_score, run_swing_pipeline, CONFIG,
    # Pastikan pipeline lain masih bisa diimport
    run_bpjs_pipeline, run_bsjp_pipeline, run_ara_pipeline_v2,
    save_combined_output_v3,
)

print("=" * 60)
print("TEST PIPELINE SWING")
print("=" * 60)

# Test 1: CONFIG
swing_keys = [k for k in CONFIG if k.startswith("SWING_")]
print(f"\n[1] CONFIG SWING keys: {len(swing_keys)}")
assert len(swing_keys) >= 15, f"FAIL: only {len(swing_keys)} keys"
print("    PASS")

# Test 2: Score - Stage 2 Golden Setup
feat_gold = {
    "is_stage2": True, "ma50_slope": 0.02, "dist_ma20": 0.05,
    "squeeze": 0.25, "vol_ratio": 0.35, "rsi": 70.0,
    "atr_pct": 0.025, "val_ma20": 20e9, "dist_52w": -0.05,
    "close": 5000, "ma20": 4762, "ma50": 4500, "ma200": 4000,
    "above_ma200": True,
}
score, pos, neg = _swing_score(feat_gold, {"net_foreign_today": 5e9})
print(f"\n[2] Golden Setup: score={score}, pos={len(pos)}, neg={len(neg)}")
assert score >= 80, f"FAIL: score={score}, expected >=80"
print("    PASS")

# Test 3: Score - Not Stage 2
feat_no = {**feat_gold, "is_stage2": False}
score_no, _, neg_no = _swing_score(feat_no, {})
print(f"\n[3] Not Stage 2: score={score_no}")
assert score_no == 0, f"FAIL: score should be 0, got {score_no}"
print("    PASS")

# Test 4: Empty universe
result = run_swing_pipeline([], "YAHOO_ONLY", {"market_safe": True})
print(f"\n[4] Empty universe: {len(result)} results")
assert result == [], "FAIL"
print("    PASS")

# Test 5: Mock universe with BBCA
mock = [{"ticker": "BBCA", "name": "Bank BCA", "price": 9000,
         "value_today": 500e9, "net_foreign_today": 10e9}]
result = run_swing_pipeline(mock, "YAHOO_ONLY", {"market_safe": True})
print(f"\n[5] Mock BBCA: {len(result)} results")
if result:
    r = result[0]
    assert "trading_plan" in r
    assert "backtest_stats" in r
    assert r["type"] == "WATCHLIST_SWING"
    print(f"    Score={r['score']}, Plan={r['trading_plan']['strategy']}")
print("    PASS")

# Test 6: save_combined_output_v3 accepts swing_results
import inspect
sig = inspect.signature(save_combined_output_v3)
params = list(sig.parameters.keys())
print(f"\n[6] save_combined_output_v3 params: {params}")
assert "swing_results" in params, "FAIL: swing_results not in params"
print("    PASS")

print(f"\n{'=' * 60}")
print("SEMUA TEST PASS - Pipeline SWING siap.")
print(f"{'=' * 60}")
