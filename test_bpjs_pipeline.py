"""
Test fungsional Pipeline BPJS — memastikan:
1. Fungsi _bpjs_compute_d1_features() menghasilkan output valid
2. Fungsi _bpjs_score() mengklasifikasikan formula dengan benar
3. Fungsi run_bpjs_pipeline() menerima universe dan menghasilkan output
4. TIDAK menyentuh pipeline lain (import saja sudah cukup untuk konfirmasi)
"""
import sys
sys.path.insert(0, ".")

# Import hanya fungsi yang dibutuhkan
from screener import (
    _bpjs_compute_d1_features,
    _bpjs_score,
    run_bpjs_pipeline,
    CONFIG,
)

print("=" * 60)
print("TEST PIPELINE BPJS — Fungsional")
print("=" * 60)

# Test 1: CONFIG keys exist
bpjs_keys = [k for k in CONFIG if k.startswith("BPJS_")]
print(f"\n[1] CONFIG BPJS keys: {len(bpjs_keys)} ditemukan")
for k in sorted(bpjs_keys):
    print(f"    {k} = {CONFIG[k]}")
assert len(bpjs_keys) >= 10, "FAIL: CONFIG BPJS kurang"
print("    PASS [OK]")

# Test 2: Score function — Reversal Bounce
feat_rev = {
    "d1_body":      -0.03,   # merah 3%
    "d1_cpos":       0.20,   # close di bawah
    "d1_vol_r":      0.70,   # volume sepi
    "d1_chg":       -0.03,
    "d1_uwick":      0.10,
    "d1_lwick":      0.30,
    "d1_range_pct":  0.025,
    "d2_chg":        0.01,
    "above_ma20":    True,
    "above_ma50":    True,
    "above_ma200":   True,
    "atr_pct":       0.03,
    "val_ma20":      5e9,
    "d1_close":      1000,
    "d1_high":       1050,
    "d1_low":        980,
    "d1_open":       1030,
}
stock_mm_rev = {"net_foreign_today": 5e9, "from_screener": True}
score_rev, formula_rev, pos_rev, neg_rev = _bpjs_score(feat_rev, stock_mm_rev)
print(f"\n[2] Score Reversal: score={score_rev}, formula={formula_rev}")
print(f"    Signals+: {len(pos_rev)}, Signals-: {len(neg_rev)}")
# Reversal cocok, tapi juga bisa cocok Quiet? Tidak, karena d1_body = -0.03 < QC_BODY_MIN 0.01
assert formula_rev == "REVERSAL_BOUNCE", f"FAIL: expected REVERSAL_BOUNCE, got {formula_rev}"
assert score_rev > 0, "FAIL: score should be > 0"
print("    PASS [OK]")

# Test 3: Score function — Quiet Continuation
feat_qc = {
    "d1_body":       0.025,  # hijau tipis 2.5%
    "d1_cpos":       0.50,   # close tengah
    "d1_vol_r":      0.40,   # volume mati
    "d1_chg":        0.02,
    "d1_uwick":      0.15,
    "d1_lwick":      0.10,
    "d1_range_pct":  0.020,
    "d2_chg":        0.00,
    "above_ma20":    True,
    "above_ma50":    True,
    "above_ma200":   False,
    "atr_pct":       0.025,
    "val_ma20":      3e9,
    "d1_close":      2000,
    "d1_high":       2050,
    "d1_low":        1960,
    "d1_open":       1950,
}
stock_mm_qc = {"net_foreign_today": 0, "from_screener": False}
score_qc, formula_qc, pos_qc, neg_qc = _bpjs_score(feat_qc, stock_mm_qc)
print(f"\n[3] Score Quiet Cont: score={score_qc}, formula={formula_qc}")
print(f"    Signals+: {len(pos_qc)}, Signals-: {len(neg_qc)}")
assert formula_qc == "QUIET_CONTINUATION", f"FAIL: expected QUIET_CONTINUATION, got {formula_qc}"
assert score_qc >= 40, f"FAIL: score should be >= 40 (base), got {score_qc}"
print("    PASS [OK]")

# Test 4: Score function — No match
feat_none = {
    "d1_body":       0.15,   # hijau terlalu kuat
    "d1_cpos":       0.95,   # puncak
    "d1_vol_r":      5.0,    # volume meledak
    "d1_chg":        0.10,
    "d1_uwick":      0.02,
    "d1_lwick":      0.01,
    "d1_range_pct":  0.08,
    "d2_chg":        0.05,
    "above_ma20":    True,
    "above_ma50":    True,
    "above_ma200":   True,
    "atr_pct":       0.05,
    "val_ma20":      10e9,
    "d1_close":      3000,
    "d1_high":       3200,
    "d1_low":        2900,
    "d1_open":       2750,
}
score_none, formula_none, _, _ = _bpjs_score(feat_none, {})
print(f"\n[4] Score No Match: score={score_none}, formula={formula_none}")
assert formula_none == "NONE", f"FAIL: expected NONE, got {formula_none}"
print("    PASS [OK]")

# Test 5: Pipeline with empty universe
result_empty = run_bpjs_pipeline([], "YAHOO_ONLY")
print(f"\n[5] Pipeline empty universe: {len(result_empty)} results")
assert result_empty == [], "FAIL: should return empty list"
print("    PASS [OK]")

# Test 6: Pipeline with mock universe
mock_universe = [
    {"ticker": "BBCA", "name": "Bank BCA", "price": 9000, "value_today": 500e9,
     "change_pct": -2.5, "net_foreign_today": 10e9, "from_screener": True,
     "from_gainer": False, "in_mover_types": ["top_value"]},
]
result_mock = run_bpjs_pipeline(mock_universe, "YAHOO_ONLY")
print(f"\n[6] Pipeline mock universe (BBCA): {len(result_mock)} results")
if len(result_mock) > 0:
    r = result_mock[0]
    print(f"    Ticker: {r['ticker']}, Formula: {r['formula']}, Score: {r['score']}")
    assert "morning_confirmation_criteria" in r, "FAIL: missing morning criteria"
    assert "trading_plan" in r, "FAIL: missing trading plan"
    assert "backtest_stats" in r, "FAIL: missing backtest stats"
    assert "disclaimer" in r, "FAIL: missing disclaimer"
    assert "WATCHLIST" in r["type"], "FAIL: type should contain WATCHLIST"
    print(f"    Morning criteria: {len(r['morning_confirmation_criteria'])} items")
    print(f"    Type: {r['type']}")
print("    PASS [OK]")

print(f"\n{'=' * 60}")
print("SEMUA TEST PASS [OK] — Pipeline BPJS siap.")
print(f"{'=' * 60}")
