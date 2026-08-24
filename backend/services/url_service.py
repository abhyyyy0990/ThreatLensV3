"""URL scanning service wrapping core ThreatLens ML inference and feature extraction."""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.scanners import url_scanner
from backend.schemas.scan import ThreatResult


def scan_single_url(url: str, save_history: bool = True) -> ThreatResult:
    """Scan a URL through the production ML pipeline."""
    raw = url_scanner.scan_url(url, save_history=save_history)
    scan_id = f"TL-URL-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    return ThreatResult(
        scan_id=scan_id,
        scanner_type="url",
        url=raw.get("url", url),
        verdict=raw.get("verdict", "Error"),
        risk_score=raw.get("risk_score", 0),
        confidence=raw.get("confidence", "Low"),
        probability=raw.get("probability", 0.0),
        threshold=raw.get("threshold"),
        model_version=raw.get("model_version"),
        algorithm=raw.get("algorithm"),
        feature_version=raw.get("feature_version"),
        features_by_family=raw.get("features_by_family", {}),
        raw_features=raw.get("raw_features", {}),
        suspicious_flags=raw.get("suspicious_flags", []),
        error=raw.get("error"),
        timestamp=now_iso,
    )


def scan_batch_urls(urls: list[str]) -> list[ThreatResult]:
    """Scan a list of URLs."""
    results = []
    for u in urls:
        u_clean = u.strip()
        if u_clean:
            results.append(scan_single_url(u_clean, save_history=True))
    return results
