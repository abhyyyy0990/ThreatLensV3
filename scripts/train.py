#!/usr/bin/env python3
"""ThreatLens Phase 1 — Model Training Script.

Run:
    python3 scripts/train.py

Pipeline:
  1. Load train + validation splits
  2. Extract URL features (v001) for all rows
  3. Train four candidate models with fixed seeds:
       A. Logistic Regression
       B. Random Forest
       C. Gradient Boosting
       D. XGBoost (skipped gracefully if libomp unavailable)
  4. Evaluate each on validation set (all metrics)
  5. Select best candidate by PR-AUC on validation
  6. Calibrate best model (Platt vs. Isotonic → pick lower ECE)
  7. Tune decision threshold on validation
  8. Save to model registry as url_model_v001
  9. Promote to production
 10. Generate reports/model/comparison_report.json

IMPORTANT:
- The locked test split is NEVER loaded during training.
- Calibration uses validation data only.
- Threshold tuning uses validation data only.
"""

from __future__ import annotations

import json
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.features import url_features
from src.ml import calibration as cal_mod
from src.ml import evaluate as eval_mod
from src.ml import registry
from src.ml import threshold as thr_mod
from src.utils.logger import get_logger

log = get_logger("train")
warnings.filterwarnings("ignore")

SPLITS_DIR       = ROOT / "data" / "splits"
REPORTS_DIR      = ROOT / "reports" / "model"
RANDOM_SEED      = 42
DATASET_VERSION  = "v001"
MODEL_VERSION    = "v001"
FEATURE_VERSION  = url_features.FEATURE_VERSION


# ── Feature extraction ────────────────────────────────────────────────

def _extract_features(df: pd.DataFrame) -> np.ndarray:
    """Apply URL feature extractor to a DataFrame with a 'url' column."""
    feature_cols = url_features.feature_names()
    records = [url_features.extract(url) for url in df["url"]]
    return pd.DataFrame(records)[feature_cols].to_numpy(dtype=float)


# ── Model catalogue ───────────────────────────────────────────────────

def _build_candidates(seed: int) -> dict:
    """Build all candidate model pipelines."""
    candidates = {
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(
                max_iter=1000,
                solver="lbfgs",
                random_state=seed,
                class_weight="balanced",
                C=1.0,
            )),
        ]),
        "RandomForest": RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=seed,
            n_jobs=-1,
        ),
        # HistGradientBoosting: sklearn's fast histogram-based gradient
        # boosting (equivalent to LightGBM internally). Fully parallel,
        # ~10-50x faster than GradientBoostingClassifier on large datasets.
        # Replaces vanilla GradientBoostingClassifier which is sequential
        # and impractical on 428k samples.
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=200,
            learning_rate=0.1,
            max_depth=6,
            l2_regularization=1.0,
            random_state=seed,
        ),
    }

    # XGBoost — optional; skip gracefully if libomp is not available
    try:
        import xgboost as xgb
        candidates["XGBoost"] = xgb.XGBClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=seed,
            n_jobs=-1,
        )
        log.info("XGBoost: available and included in benchmark")
    except (ImportError, Exception) as exc:
        log.warning(f"XGBoost unavailable ({exc}); skipping. Install libomp to enable.")

    return candidates


# ── Main training pipeline ────────────────────────────────────────────

def train() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Load splits ───────────────────────────────────────────────────
    train_path = SPLITS_DIR / "train.csv"
    val_path   = SPLITS_DIR / "validation.csv"

    if not train_path.exists() or not val_path.exists():
        log.error(
            "Splits not found. Run scripts/prepare_data.py first."
        )
        sys.exit(1)

    log.info("Loading train split ...")
    df_train = pd.read_csv(train_path)
    log.info(f"  Train: {len(df_train):,} rows  "
             f"(pos={int((df_train.binary_label==1).sum()):,}  "
             f"neg={int((df_train.binary_label==0).sum()):,})")

    log.info("Loading validation split ...")
    df_val = pd.read_csv(val_path)
    log.info(f"  Val:   {len(df_val):,} rows  "
             f"(pos={int((df_val.binary_label==1).sum()):,}  "
             f"neg={int((df_val.binary_label==0).sum()):,})")

    y_train = df_train["binary_label"].to_numpy(dtype=int)
    y_val   = df_val["binary_label"].to_numpy(dtype=int)

    # ── Feature extraction ─────────────────────────────────────────────
    log.info("Extracting features (train) ...")
    X_train = _extract_features(df_train)
    log.info(f"  Feature matrix: {X_train.shape}")

    log.info("Extracting features (validation) ...")
    X_val = _extract_features(df_val)

    feature_schema = url_features.feature_names()

    # ── Train & evaluate all candidates ───────────────────────────────
    candidates = _build_candidates(RANDOM_SEED)
    results: list[dict] = []

    for name, model in candidates.items():
        log.info(f"\nTraining: {name} ...")
        model.fit(X_train, y_train)

        y_prob_val = model.predict_proba(X_val)[:, 1]
        metrics = eval_mod.compute_metrics(
            y_val,
            (y_prob_val >= 0.5).astype(int),
            y_prob_val,
            threshold=0.5,
        )
        metrics["model"] = name
        results.append(metrics)
        log.info(eval_mod.format_report(metrics, title=f"{name} — Validation"))

    # ── Sort by PR-AUC (primary); F1 (secondary) ──────────────────────
    results_sorted = sorted(results, key=lambda x: (x["pr_auc"], x["f1"]), reverse=True)
    best_name = results_sorted[0]["model"]
    log.info(f"\nBest candidate by PR-AUC: {best_name}")

    best_model = candidates[best_name]

    # ── Calibration ───────────────────────────────────────────────────
    log.info("Comparing calibration methods on validation set ...")
    cal_results = cal_mod.compare_calibration(best_model, X_val, y_val)

    recommended_cal = cal_results["recommended"]
    calibrated_model = cal_results[recommended_cal]["calibrated_model"]
    cal_ece = {
        "platt":    cal_results["platt"]["ece"],
        "isotonic": cal_results["isotonic"]["ece"],
    }
    log.info(
        f"  Platt ECE={cal_ece['platt']:.4f}  "
        f"Isotonic ECE={cal_ece['isotonic']:.4f}  "
        f"→ Recommended: {recommended_cal}"
    )

    # ── Threshold tuning (on validation, calibrated probabilities) ────
    log.info("Tuning decision threshold on validation ...")
    y_prob_cal_val = calibrated_model.predict_proba(X_val)[:, 1]
    thr_result = thr_mod.tune(y_val, y_prob_cal_val, criterion="f1")
    selected_threshold = thr_result["selected_threshold"]
    log.info(
        f"  Selected threshold: {selected_threshold:.3f}  "
        f"(F1={thr_result['best_f1']:.4f}  "
        f"Recall={thr_result['best_recall']:.4f}  "
        f"Precision={thr_result['best_precision']:.4f}  "
        f"FPR={thr_result['best_fpr']:.4f}  "
        f"FNR={thr_result['best_fnr']:.4f})"
    )

    # Final validation metrics at selected threshold
    final_val_metrics = eval_mod.compute_metrics(
        y_val,
        (y_prob_cal_val >= selected_threshold).astype(int),
        y_prob_cal_val,
        threshold=selected_threshold,
    )
    log.info(eval_mod.format_report(final_val_metrics, "Final Validation Metrics (calibrated, tuned)"))

    # ── Model registry ────────────────────────────────────────────────
    existing = registry.list_versions()
    if MODEL_VERSION in existing:
        log.warning(
            f"Registry version '{MODEL_VERSION}' already exists. "
            "Skipping save — increment MODEL_VERSION to retrain."
        )
    else:
        metadata = {
            "model_name":        f"url_classifier_{MODEL_VERSION}",
            "version":           MODEL_VERSION,
            "dataset_version":   DATASET_VERSION,
            "feature_version":   FEATURE_VERSION,
            "training_timestamp": datetime.now(timezone.utc).isoformat(),
            "random_seed":       RANDOM_SEED,
            "algorithm":         best_name,
            "selected_threshold": selected_threshold,
            "calibration_method": recommended_cal,
            "calibration_ece": cal_ece,
            "validation_metrics": final_val_metrics,
            "threshold_selection_criterion": "f1",
            "locked_test_metrics": "NOT_YET_EVALUATED — run scripts/evaluate.py",
            "notes": (
                "Trained on domain-grouped split. Locked test set has not been "
                "evaluated yet. Run evaluate.py to compute locked-test results."
            ),
        }
        log.info(f"Saving model to registry as {MODEL_VERSION} ...")
        registry.save(calibrated_model, feature_schema, metadata, MODEL_VERSION)
        log.info("Promoting to production ...")
        registry.promote(MODEL_VERSION)

    # ── Save comparison report ────────────────────────────────────────
    comparison = {
        "generated_at":   datetime.now(timezone.utc).isoformat(),
        "dataset_version": DATASET_VERSION,
        "feature_version": FEATURE_VERSION,
        "random_seed":     RANDOM_SEED,
        "models_evaluated": results_sorted,
        "best_model":      best_name,
        "calibration": {
            "platt_ece":    cal_ece["platt"],
            "isotonic_ece": cal_ece["isotonic"],
            "recommended":  recommended_cal,
        },
        "threshold": {
            "selected": selected_threshold,
            "criterion": "f1",
            "sweep_summary": {
                "start": 0.05, "stop": 0.95, "step": 0.01,
            },
        },
        "final_validation_metrics": final_val_metrics,
    }
    report_path = REPORTS_DIR / "comparison_report.json"
    with open(report_path, "w") as f:
        json.dump(comparison, f, indent=2)
    log.info(f"Comparison report saved: {report_path}")

    # ── Summary ───────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("  TRAINING COMPLETE")
    print(f"{'='*60}")
    print(f"  Best model     : {best_name}")
    print(f"  Calibration    : {recommended_cal} (ECE={cal_ece[recommended_cal]:.4f})")
    print(f"  Threshold      : {selected_threshold:.3f}")
    print(f"  Val Precision  : {final_val_metrics['precision']:.4f}")
    print(f"  Val Recall     : {final_val_metrics['recall']:.4f}")
    print(f"  Val F1         : {final_val_metrics['f1']:.4f}")
    print(f"  Val PR-AUC     : {final_val_metrics['pr_auc']:.4f}")
    print(f"  Val FPR        : {final_val_metrics['fpr']:.4f}")
    print(f"  Val FNR        : {final_val_metrics['fnr']:.4f}")
    print(f"  Registry       : models/registry/{MODEL_VERSION}/")
    print(f"  Production     : models/production/")
    print(f"\n  ⚠  Locked test NOT evaluated yet.")
    print(f"  → Run: python3 scripts/evaluate.py")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    train()
