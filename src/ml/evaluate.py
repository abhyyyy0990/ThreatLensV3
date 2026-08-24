"""ThreatLens ML evaluation utilities.

Computes and formats all required classification metrics.
Never accesses the locked test set — that is controlled by scripts/evaluate.py.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5,
) -> dict[str, Any]:
    """Compute the full ThreatLens metric suite for a binary classifier.

    Args:
        y_true:    Ground-truth labels (0 = benign, 1 = malicious).
        y_pred:    Predicted binary labels at *threshold*.
        y_prob:    Predicted positive-class probabilities.
        threshold: Decision threshold used to derive y_pred.

    Returns:
        Dict of metric name → value.
    """
    # Recompute binary predictions from probabilities at the given threshold
    # (callers may pass pre-thresholded labels, but we recompute to be safe)
    y_pred_at_thresh = (y_prob >= threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred_at_thresh, labels=[0, 1]).ravel()

    accuracy   = accuracy_score(y_true, y_pred_at_thresh)
    precision  = precision_score(y_true, y_pred_at_thresh, zero_division=0)
    recall     = recall_score(y_true, y_pred_at_thresh, zero_division=0)
    f1         = f1_score(y_true, y_pred_at_thresh, zero_division=0)
    specificity = tn / max(tn + fp, 1)
    fpr        = fp / max(fp + tn, 1)  # false-positive rate
    fnr        = fn / max(fn + tp, 1)  # false-negative rate

    roc_auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else float("nan")
    pr_auc  = float(average_precision_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else float("nan")

    return {
        "threshold": threshold,
        "accuracy": round(float(accuracy), 6),
        "precision": round(float(precision), 6),
        "recall": round(float(recall), 6),
        "f1": round(float(f1), 6),
        "roc_auc": round(roc_auc, 6),
        "pr_auc": round(pr_auc, 6),
        "specificity": round(float(specificity), 6),
        "fpr": round(float(fpr), 6),
        "fnr": round(float(fnr), 6),
        "tp": int(tp),
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "n_samples": int(len(y_true)),
        "n_positive": int(y_true.sum()),
        "n_negative": int((1 - y_true).sum()),
    }


def format_report(metrics: dict[str, Any], title: str = "Evaluation Report") -> str:
    """Return a human-readable text block."""
    lines = [
        f"\n{'='*56}",
        f"  {title}",
        f"{'='*56}",
        f"  Threshold  : {metrics['threshold']:.3f}",
        f"  N samples  : {metrics['n_samples']:,}  "
        f"(pos={metrics['n_positive']:,}, neg={metrics['n_negative']:,})",
        f"  Accuracy   : {metrics['accuracy']:.4f}",
        f"  Precision  : {metrics['precision']:.4f}",
        f"  Recall     : {metrics['recall']:.4f}",
        f"  F1         : {metrics['f1']:.4f}",
        f"  ROC-AUC    : {metrics['roc_auc']:.4f}",
        f"  PR-AUC     : {metrics['pr_auc']:.4f}",
        f"  Specificity: {metrics['specificity']:.4f}",
        f"  FPR        : {metrics['fpr']:.4f}",
        f"  FNR        : {metrics['fnr']:.4f}",
        f"  Confusion  : TP={metrics['tp']} FP={metrics['fp']} "
        f"FN={metrics['fn']} TN={metrics['tn']}",
        f"{'='*56}",
    ]
    return "\n".join(lines)


def save_report(metrics: dict[str, Any], path: Path) -> None:
    """Write metrics to a JSON file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(metrics, f, indent=2)
