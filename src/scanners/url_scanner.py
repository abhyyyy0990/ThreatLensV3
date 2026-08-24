"""ThreatLens URL Scanner.

Wraps the ML inference engine and returns a clean ThreatResult-shaped dict
suitable for display in the UI and storage in the scan history.

Every scan returns a consistent structure — error results also conform
to the same schema so callers never need to special-case missing keys.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.engine import inference
from src.storage import db
from src.utils.logger import get_logger

log = get_logger("url_scanner")

# ── Feature family groupings for display ──────────────────────────────
_FEATURE_FAMILIES: dict[str, list[str]] = {
    "Lexical": [
        "url_len", "hostname_len", "path_len", "query_len", "fragment_len",
        "registered_domain_len", "dot_count", "hyphen_count", "underscore_count",
        "at_count", "percent_count", "equals_count", "question_count",
        "ampersand_count", "slash_count", "tilde_count", "digit_count",
        "letter_count", "digit_ratio", "letter_ratio", "special_char_count",
        "special_char_ratio",
    ],
    "Structural": [
        "has_https", "has_http", "is_ip", "has_punycode", "subdomain_count",
        "path_depth", "query_param_count", "tld_suspicious", "has_credentials",
        "has_double_slash", "encoded_char_count", "non_ascii_count",
        "has_nonstandard_port", "suffix_len",
    ],
    "Entropy": [
        "url_entropy", "hostname_entropy", "path_entropy",
    ],
    "Semantic": [
        "phishing_kw_count", "has_phishing_keyword", "brand_in_subdomain",
        "has_long_subdomain", "has_many_subdomains",
    ],
}

# Suspicious feature flags for display callouts
_SUSPICIOUS_FLAGS: dict[str, str] = {
    "is_ip": "IP address used as hostname",
    "has_punycode": "Punycode/IDN domain (possible homograph attack)",
    "tld_suspicious": "Suspicious TLD",
    "has_credentials": "Credentials embedded in URL",
    "has_double_slash": "Double-slash path (redirect trick)",
    "non_ascii_count": "Non-ASCII characters in URL",
    "has_nonstandard_port": "Non-standard port number",
    "has_phishing_keyword": "Phishing keywords detected",
    "brand_in_subdomain": "Known brand name in subdomain",
    "has_many_subdomains": "Excessive subdomain depth",
    "has_long_subdomain": "Unusually long subdomain",
}


def scan_url(url: str, save_history: bool = True) -> dict[str, Any]:
    """Scan a single URL through the ML pipeline.

    Args:
        url:          The URL to scan.
        save_history: If True, persist the result to SQLite.

    Returns:
        ThreatResult dict:
          url, verdict, risk_score, confidence, probability, threshold,
          model_version, algorithm, feature_version, features_by_family,
          suspicious_flags, error
    """
    result = inference.predict_url(url)

    # ── Build feature families for display ────────────────────────────
    raw_features: dict[str, Any] = result.get("features", {})
    features_by_family: dict[str, dict[str, Any]] = {}
    for family, names in _FEATURE_FAMILIES.items():
        features_by_family[family] = {
            name: raw_features.get(name, 0) for name in names
        }

    # ── Identify triggered suspicious flags ───────────────────────────
    triggered_flags: list[str] = []
    for flag, description in _SUSPICIOUS_FLAGS.items():
        val = raw_features.get(flag, 0)
        if val and val != 0:
            triggered_flags.append(description)

    scan_result = {
        "url": result["url"],
        "verdict": result["verdict"],
        "risk_score": result["risk_score"],
        "confidence": result["confidence"],
        "probability": result["probability"],
        "threshold": result["threshold"],
        "model_version": result["model_version"],
        "algorithm": result["algorithm"],
        "feature_version": result["feature_version"],
        "features_by_family": features_by_family,
        "raw_features": raw_features,
        "suspicious_flags": triggered_flags,
        "error": result["error"],
    }

    # ── Persist to history (skip on error) ────────────────────────────
    if save_history and result["verdict"] not in ("Error",):
        try:
            db.insert_scan(
                scan_type="url",
                input_repr=url[:500],
                verdict=result["verdict"],
                risk_score=result["risk_score"],
                confidence=result["confidence"],
                details={
                    "probability": result["probability"],
                    "threshold": result["threshold"],
                    "model_version": result["model_version"],
                    "algorithm": result["algorithm"],
                    "flags": triggered_flags,
                },
            )
        except Exception as exc:
            log.warning(f"Failed to save scan history: {exc}")

    return scan_result
