"""ThreatLens V3 ML inference engine.

Loads the production model once (cached) and exposes predict_url().

Design:
  - Model is loaded lazily on first call and cached in module state.
  - Returns a structured dict — never raises to the caller;
    errors are returned as a result with verdict='Error'.
  - All numeric results come from the real trained model.
  - Risk score is derived from calibrated probability (0–100 int).
  - Confidence level is derived from distance from the decision boundary.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.features import url_features
from src.ml import registry
from src.utils.logger import get_logger

log = get_logger("inference")

# Module-level cache: loaded once per process
_model_cache: dict[str, Any] | None = None
_feature_names_cache: list[str] | None = None
_metadata_cache: dict[str, Any] | None = None


def _load_model() -> tuple[Any, list[str], dict[str, Any]]:
    """Load the production model. Cached after first call."""
    global _model_cache, _feature_names_cache, _metadata_cache
    if _model_cache is None:
        model, feature_names, meta = registry.load_production()
        _model_cache = model
        _feature_names_cache = feature_names
        _metadata_cache = meta
        log.info(
            f"Production model loaded: {meta.get('algorithm')} v{meta.get('version')}"
        )
    return _model_cache, _feature_names_cache, _metadata_cache


def _score_to_risk(prob: float) -> int:
    """Convert calibrated probability (0–1) to risk score (0–100 int)."""
    return min(100, max(0, round(prob * 100)))


def _risk_to_confidence(prob: float, threshold: float) -> str:
    """Derive confidence level from distance of probability from threshold."""
    distance = abs(prob - threshold)
    if distance >= 0.25:
        return "High"
    if distance >= 0.10:
        return "Medium"
    return "Low"


def _verdict_from_prob(prob: float, threshold: float) -> str:
    """Map calibrated probability to human verdict.

    Bug 5 fix: the suspicious zone was threshold*0.6 which at threshold=0.39
    gives a lower bound of 0.234 — too wide, causing obvious phishing URLs
    that score ~0.28 to be called Safe.  Tighten the zone to the 15 percentage
    points below threshold so only borderline cases read Suspicious.
    """
    if prob >= threshold:
        return "Malicious"
    if prob >= max(threshold - 0.15, 0.0):  # narrower cautionary zone
        return "Suspicious"
    return "Safe"


def predict_url(url: str) -> dict[str, Any]:
    """Run the production ML model on a single URL.

    Args:
        url: Raw URL string to analyse.

    Returns:
        Dict with keys:
          url, verdict, risk_score, confidence, label,
          probability, threshold, model_version, algorithm,
          features, feature_version, error (if any)
    """
    if not url or not url.strip():
        return {
            "url": url,
            "verdict": "Error",
            "risk_score": 0,
            "confidence": "N/A",
            "label": 0,
            "probability": 0.0,
            "threshold": None,
            "model_version": None,
            "algorithm": None,
            "features": {},
            "feature_version": url_features.FEATURE_VERSION,
            "error": "Empty URL provided.",
        }

    url = url.strip()

    # ── Feature extraction ─────────────────────────────────────────────
    try:
        feat_dict = url_features.extract(url)
    except Exception as exc:
        log.error(f"Feature extraction failed for {url!r}: {exc}")
        return {
            "url": url,
            "verdict": "Error",
            "risk_score": 0,
            "confidence": "N/A",
            "label": 0,
            "probability": 0.0,
            "threshold": None,
            "model_version": None,
            "algorithm": None,
            "features": {},
            "feature_version": url_features.FEATURE_VERSION,
            "error": f"Feature extraction error: {exc}",
        }

    # ── Model inference ────────────────────────────────────────────────
    try:
        model, feature_names, meta = _load_model()
        threshold = float(meta.get("selected_threshold", 0.39))

        import numpy as np

        # feature_names is the ordered list from feature_schema.json
        X = np.array([[feat_dict.get(f, 0.0) for f in feature_names]])

        prob = float(model.predict_proba(X)[0][1])
        label = int(prob >= threshold)
        verdict = _verdict_from_prob(prob, threshold)
        risk_score = _score_to_risk(prob)
        confidence = _risk_to_confidence(prob, threshold)

    except Exception as exc:
        log.error(f"Model inference failed: {exc}")
        return {
            "url": url,
            "verdict": "Error",
            "risk_score": 0,
            "confidence": "N/A",
            "label": 0,
            "probability": 0.0,
            "threshold": None,
            "model_version": _metadata_cache.get("version") if _metadata_cache else None,
            "algorithm": _metadata_cache.get("algorithm") if _metadata_cache else None,
            "features": feat_dict,
            "feature_version": url_features.FEATURE_VERSION,
            "error": f"Model inference error: {exc}",
        }

    return {
        "url": url,
        "verdict": verdict,
        "risk_score": risk_score,
        "confidence": confidence,
        "label": label,
        "probability": round(prob, 4),
        "threshold": threshold,
        "model_version": meta.get("version"),
        "algorithm": meta.get("algorithm"),
        "features": feat_dict,
        "feature_version": url_features.FEATURE_VERSION,
        "error": None,
    }
