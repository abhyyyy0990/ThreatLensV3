"""ThreatLens probability calibration utilities.

Evaluates and applies post-hoc calibration to model probabilities.

Methods compared:
  - Platt scaling    (sigmoid, parametric)
  - Isotonic regression (non-parametric, monotone)

Calibration is always fitted on VALIDATION data.
The locked test set is never used for calibration fitting.

Calibration evaluation uses Expected Calibration Error (ECE).

Note: sklearn ≥1.2 removed cv='prefit' from CalibratedClassifierCV.
This module implements calibration directly using lower-level estimators
(IsotonicRegression and LogisticRegression) for version-stable behaviour.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression as _LR


def _expected_calibration_error(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10,
) -> float:
    """Compute Expected Calibration Error (ECE).

    Args:
        y_true: Ground-truth binary labels.
        y_prob: Predicted positive-class probabilities.
        n_bins: Number of confidence bins.

    Returns:
        ECE as a float in [0, 1]. Lower is better.
    """
    fraction_of_positives, mean_predicted_value = calibration_curve(
        y_true, y_prob, n_bins=n_bins, strategy="uniform"
    )
    bin_sizes = np.histogram(y_prob, bins=n_bins, range=(0, 1))[0]
    total = len(y_prob)
    ece = float(
        np.sum(
            np.abs(fraction_of_positives - mean_predicted_value)
            * bin_sizes[: len(fraction_of_positives)]
            / total
        )
    )
    return round(ece, 6)


def calibration_data(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10,
) -> dict[str, Any]:
    """Return reliability-diagram data + ECE for plotting / reporting.

    Args:
        y_true: Ground-truth binary labels.
        y_prob: Predicted positive-class probabilities.
        n_bins: Number of calibration bins.

    Returns:
        Dict with fraction_of_positives, mean_predicted_value, ece.
    """
    fop, mpv = calibration_curve(y_true, y_prob, n_bins=n_bins, strategy="uniform")
    ece = _expected_calibration_error(y_true, y_prob, n_bins)
    return {
        "fraction_of_positives": fop.tolist(),
        "mean_predicted_value": mpv.tolist(),
        "ece": ece,
    }


class _CalibratedWrapper:
    """Lightweight wrapper applying a post-hoc calibration mapping.

    Stores the base estimator and a learned probability calibrator.
    Exposes predict_proba so it can be used as a drop-in model.
    """

    def __init__(self, base_estimator: Any, calibrator: Any, method: str) -> None:
        self._base = base_estimator
        self._cal = calibrator
        self.method = method

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        raw_prob = self._base.predict_proba(X)[:, 1]
        cal_prob = self._cal.predict(raw_prob).clip(0.0, 1.0)
        return np.column_stack([1 - cal_prob, cal_prob])

    def predict(self, X: np.ndarray) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


class _PlattWrapper:
    """Wraps a fitted 1-feature LogisticRegression as a calibrator."""

    def __init__(self, lr: _LR) -> None:
        self._lr = lr

    def predict(self, p: np.ndarray) -> np.ndarray:
        return self._lr.predict_proba(p.reshape(-1, 1))[:, 1]


def compare_calibration(
    base_estimator: Any,
    X_val: np.ndarray,
    y_val: np.ndarray,
    cv: int = 5,
) -> dict[str, Any]:
    """Fit Platt and Isotonic calibration on validation data.

    Both methods use *base_estimator* (already trained) to produce raw
    probabilities on the validation set, then fit a calibration mapping
    from raw probability → calibrated probability.

    Implementation note:
        sklearn ≥1.2 removed cv='prefit' from CalibratedClassifierCV.
        This implementation uses IsotonicRegression and LogisticRegression
        directly — the same underlying methods that CalibratedClassifierCV
        uses internally.

    Args:
        base_estimator: A trained sklearn-compatible classifier.
        X_val:          Validation feature matrix.
        y_val:          Validation labels.
        cv:             Ignored (kept for API symmetry).

    Returns:
        Dict with:
          "platt"    → {"method", "ece", "calibrated_model"}
          "isotonic" → {"method", "ece", "calibrated_model"}
          "recommended" → name of the better method
    """
    # Get raw probabilities from the already-trained base estimator
    raw_prob_val = base_estimator.predict_proba(X_val)[:, 1]

    results: dict[str, Any] = {}

    # ── Platt scaling: fit a 1-feature LR on raw probabilities ───────
    platt_lr = _LR(C=1.0, solver="lbfgs", max_iter=500)
    platt_lr.fit(raw_prob_val.reshape(-1, 1), y_val)
    platt_wrapped = _CalibratedWrapper(
        base_estimator, _PlattWrapper(platt_lr), "sigmoid"
    )
    y_prob_platt = platt_wrapped.predict_proba(X_val)[:, 1]
    ece_platt = _expected_calibration_error(y_val, y_prob_platt)
    results["platt"] = {
        "method": "sigmoid",
        "ece": ece_platt,
        "calibrated_model": platt_wrapped,
    }

    # ── Isotonic regression ───────────────────────────────────────────
    iso = IsotonicRegression(out_of_bounds="clip")
    iso.fit(raw_prob_val, y_val)
    iso_wrapped = _CalibratedWrapper(base_estimator, iso, "isotonic")
    y_prob_iso = iso_wrapped.predict_proba(X_val)[:, 1]
    ece_iso = _expected_calibration_error(y_val, y_prob_iso)
    results["isotonic"] = {
        "method": "isotonic",
        "ece": ece_iso,
        "calibrated_model": iso_wrapped,
    }

    # Recommend the method with lower ECE
    recommended = (
        "platt" if results["platt"]["ece"] <= results["isotonic"]["ece"] else "isotonic"
    )
    results["recommended"] = recommended
    return results
