"""ThreatLens threshold tuning utilities.

Tunes the binary decision threshold on VALIDATION data only.
Never touches the locked test set.

Strategy:
  Sweep thresholds 0.05 – 0.95 in steps of 0.01.
  Record precision, recall, F1, FPR, FNR at each step.
  Default selection criterion: maximise F1.
  For cybersecurity contexts where false negatives are more costly,
  an alternative criterion (e.g. maximise recall s.t. precision > X)
  can be used by calling tune() with criterion="recall_floor".
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics import f1_score, precision_score, recall_score


def tune(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    criterion: str = "f1",
    recall_floor: float = 0.90,
    start: float = 0.05,
    stop: float = 0.95,
    step: float = 0.01,
) -> dict[str, Any]:
    """Sweep decision thresholds and return the best one.

    Args:
        y_true:       Ground-truth labels.
        y_prob:       Positive-class probabilities from the calibrated model.
        criterion:    "f1"          → threshold maximising F1 (default).
                      "recall_floor" → highest threshold where recall >= recall_floor.
        recall_floor: Minimum recall required (only used with "recall_floor").
        start / stop / step: Sweep range.

    Returns:
        Dict with keys:
          selected_threshold, criterion, best_f1, best_recall, best_precision,
          best_fpr, best_fnr, sweep_table.
    """
    thresholds = np.arange(start, stop + step / 2, step)
    sweep: list[dict[str, float]] = []

    for t in thresholds:
        y_pred = (y_prob >= t).astype(int)
        p  = float(precision_score(y_true, y_pred, zero_division=0))
        r  = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))

        # FPR / FNR
        tp = int(((y_pred == 1) & (y_true == 1)).sum())
        fp = int(((y_pred == 1) & (y_true == 0)).sum())
        fn = int(((y_pred == 0) & (y_true == 1)).sum())
        tn = int(((y_pred == 0) & (y_true == 0)).sum())
        fpr = fp / max(fp + tn, 1)
        fnr = fn / max(fn + tp, 1)

        sweep.append(
            {
                "threshold": round(float(t), 4),
                "precision": round(p, 6),
                "recall": round(r, 6),
                "f1": round(f1, 6),
                "fpr": round(fpr, 6),
                "fnr": round(fnr, 6),
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "tn": tn,
            }
        )

    # Select threshold
    if criterion == "f1":
        best = max(sweep, key=lambda x: x["f1"])
    elif criterion == "recall_floor":
        candidates = [s for s in sweep if s["recall"] >= recall_floor]
        if candidates:
            # Highest threshold (most conservative) meeting recall floor
            best = max(candidates, key=lambda x: x["threshold"])
        else:
            # Fallback to best F1 if floor is unachievable
            best = max(sweep, key=lambda x: x["f1"])
            criterion = "f1_fallback"
    else:
        raise ValueError(f"Unknown criterion: {criterion!r}")

    return {
        "selected_threshold": best["threshold"],
        "criterion": criterion,
        "best_f1": best["f1"],
        "best_recall": best["recall"],
        "best_precision": best["precision"],
        "best_fpr": best["fpr"],
        "best_fnr": best["fnr"],
        "sweep_table": sweep,
    }
