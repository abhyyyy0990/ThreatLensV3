#!/usr/bin/env python3
"""ThreatLens Phase 1 — Locked Test Evaluation Script.

Run (ONLY ONCE after training is finalised):
    python3 scripts/evaluate.py

This script evaluates the production model on the locked test set.

RULES:
- The locked test set must NEVER be used before this final evaluation.
- Do not use this script to tune anything.
- Do not re-run this script to iteratively improve a model.
- Once run, results are recorded as the authoritative locked-test metrics.

Outputs:
- reports/model/final_evaluation_report.json
- Printed evaluation report
- Updates MODEL_CARD.md with real locked-test metrics
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.features import url_features
from src.ml import evaluate as eval_mod
from src.ml import registry
from src.utils.logger import get_logger

log = get_logger("evaluate")

SPLITS_DIR   = ROOT / "data" / "splits"
REPORTS_DIR  = ROOT / "reports" / "model"
MODEL_CARD   = ROOT / "MODEL_CARD.md"


def _extract_features(df: pd.DataFrame, feature_schema: list[str]) -> np.ndarray:
    """Extract features using the exact schema from the saved model."""
    records = [url_features.extract(url) for url in df["url"]]
    feat_df = pd.DataFrame(records)
    # Only use columns that were in training schema, in the same order
    missing = [c for c in feature_schema if c not in feat_df.columns]
    if missing:
        raise ValueError(f"Feature mismatch — columns missing: {missing}")
    return feat_df[feature_schema].to_numpy(dtype=float)


def evaluate() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Load production model ─────────────────────────────────────────
    log.info("Loading production model ...")
    try:
        model, feature_schema, metadata = registry.load_production()
    except FileNotFoundError as exc:
        log.error(str(exc))
        sys.exit(1)

    selected_threshold = float(metadata.get("selected_threshold", 0.5))
    log.info(f"  Model version  : {metadata.get('version')}")
    log.info(f"  Algorithm      : {metadata.get('algorithm')}")
    log.info(f"  Calibration    : {metadata.get('calibration_method')}")
    log.info(f"  Threshold      : {selected_threshold}")
    log.info(f"  Feature version: {metadata.get('feature_version')}")

    # ── Verify feature version matches ───────────────────────────────
    if metadata.get("feature_version") != url_features.FEATURE_VERSION:
        log.warning(
            f"Feature version mismatch: model trained with "
            f"{metadata.get('feature_version')}, "
            f"current extractor is {url_features.FEATURE_VERSION}."
        )

    # ── Load locked test split ────────────────────────────────────────
    test_path = SPLITS_DIR / "test.csv"
    if not test_path.exists():
        log.error(
            "Locked test split not found. Run scripts/prepare_data.py first."
        )
        sys.exit(1)

    log.info("Loading locked test split ...")
    df_test = pd.read_csv(test_path)
    log.info(
        f"  Test: {len(df_test):,} rows  "
        f"(pos={int((df_test.binary_label==1).sum()):,}  "
        f"neg={int((df_test.binary_label==0).sum()):,})"
    )
    y_test = df_test["binary_label"].to_numpy(dtype=int)

    # ── Feature extraction ────────────────────────────────────────────
    log.info("Extracting features from locked test set ...")
    X_test = _extract_features(df_test, feature_schema)

    # ── Inference ─────────────────────────────────────────────────────
    log.info("Running inference on locked test set ...")
    y_prob_test = model.predict_proba(X_test)[:, 1]

    # ── Compute metrics ───────────────────────────────────────────────
    y_pred_test = (y_prob_test >= selected_threshold).astype(int)
    metrics = eval_mod.compute_metrics(y_test, y_pred_test, y_prob_test, threshold=selected_threshold)
    log.info(eval_mod.format_report(metrics, "LOCKED TEST EVALUATION — FINAL"))

    # ── Save report ───────────────────────────────────────────────────
    report = {
        "evaluation_type": "locked_test_final",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "model_version": metadata.get("version"),
        "algorithm": metadata.get("algorithm"),
        "calibration_method": metadata.get("calibration_method"),
        "feature_version": metadata.get("feature_version"),
        "dataset_version": metadata.get("dataset_version"),
        "selected_threshold": selected_threshold,
        "locked_test_metrics": metrics,
        "warning": (
            "This is the authoritative final evaluation. "
            "Do not re-run to improve metrics — that would invalidate the holdout."
        ),
    }
    report_path = REPORTS_DIR / "final_evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    log.info(f"Final evaluation report saved: {report_path}")

    # ── Update MODEL_CARD.md ──────────────────────────────────────────
    _update_model_card(metadata, metrics)

    # ── Print summary ─────────────────────────────────────────────────
    m = metrics
    print(f"\n{'='*60}")
    print("  LOCKED TEST — FINAL EVALUATION RESULTS")
    print(f"{'='*60}")
    print(f"  Model          : {metadata.get('algorithm')} {metadata.get('version')}")
    print(f"  Calibration    : {metadata.get('calibration_method')}")
    print(f"  Threshold      : {selected_threshold:.3f}")
    print(f"  N samples      : {m['n_samples']:,}")
    print(f"  Accuracy       : {m['accuracy']:.4f}")
    print(f"  Precision      : {m['precision']:.4f}")
    print(f"  Recall         : {m['recall']:.4f}")
    print(f"  F1             : {m['f1']:.4f}")
    print(f"  ROC-AUC        : {m['roc_auc']:.4f}")
    print(f"  PR-AUC         : {m['pr_auc']:.4f}")
    print(f"  Specificity    : {m['specificity']:.4f}")
    print(f"  FPR            : {m['fpr']:.4f}")
    print(f"  FNR            : {m['fnr']:.4f}")
    print(f"  TP={m['tp']}  FP={m['fp']}  FN={m['fn']}  TN={m['tn']}")
    print(f"  Report         : {report_path}")
    print(f"{'='*60}\n")


def _update_model_card(metadata: dict, test_metrics: dict) -> None:
    """Append real locked-test results to MODEL_CARD.md."""
    section = f"""
## Evaluated Model: {metadata.get('algorithm')} {metadata.get('version')}

**Evaluated:** {datetime.now(timezone.utc).isoformat()}
**Dataset version:** {metadata.get('dataset_version')}
**Feature version:** {metadata.get('feature_version')}
**Threshold:** {metadata.get('selected_threshold')}
**Calibration:** {metadata.get('calibration_method')}

### Locked Test Results

| Metric      | Value    |
|-------------|----------|
| Accuracy    | {test_metrics['accuracy']:.4f} |
| Precision   | {test_metrics['precision']:.4f} |
| Recall      | {test_metrics['recall']:.4f} |
| F1          | {test_metrics['f1']:.4f} |
| ROC-AUC     | {test_metrics['roc_auc']:.4f} |
| PR-AUC      | {test_metrics['pr_auc']:.4f} |
| Specificity | {test_metrics['specificity']:.4f} |
| FPR         | {test_metrics['fpr']:.4f} |
| FNR         | {test_metrics['fnr']:.4f} |

Confusion matrix: TP={test_metrics['tp']}  FP={test_metrics['fp']}  FN={test_metrics['fn']}  TN={test_metrics['tn']}

"""
    with open(MODEL_CARD, "a") as f:
        f.write(section)
    log.info(f"MODEL_CARD.md updated with locked-test results")


if __name__ == "__main__":
    evaluate()
