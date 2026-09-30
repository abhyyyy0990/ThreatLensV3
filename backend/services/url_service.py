"""URL scanning service wrapping core ThreatLens ML inference and feature extraction."""
from __future__ import annotations

import sys
import logging
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.scanners import url_scanner
from backend.schemas.scan import ThreatResult
from backend.services.intel_service import query_gsb_for_url

logger = logging.getLogger(__name__)


def scan_single_url(url: str, save_history: bool = True) -> ThreatResult:
    """
    Scan a URL through the production ML pipeline, then fuse with GSB result.

    Fusion logic:
    - If GSB is live AND flags the URL → verdict is forced to "Malicious",
      risk_score is maximised at max(ml_score, 90), and a flag is appended.
    - If GSB is live AND clears the URL → ML verdict is authoritative.
    - If GSB is simulated (no key / error) → ML verdict is authoritative,
      GSB status is noted in suspicious_flags for transparency.
    """
    raw = url_scanner.scan_url(url, save_history=save_history)
    scan_id = f"TL-URL-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    verdict = raw.get("verdict", "Error")
    risk_score = raw.get("risk_score", 0)
    suspicious_flags: list[str] = list(raw.get("suspicious_flags", []))

    # ── GSB fusion ────────────────────────────────────────────────────────────
    try:
        gsb = query_gsb_for_url(url)

        if gsb["gsb_live"]:
            if gsb["gsb_listed"]:
                # GSB confirmed threat — always override ML upward
                verdict = "Malicious"
                risk_score = max(risk_score, 90)
                threat_label = gsb["gsb_threat_type"] or "Confirmed Threat"
                suspicious_flags.insert(0, f"[GSB LIVE] {threat_label}")
                logger.info("GSB flagged URL as malicious: %s | %s", url, threat_label)
            else:
                # GSB live-cleared this URL.
                # Override ML downward ONLY when ML probability is ambiguous (< 0.75).
                # High-confidence ML detections (>= 0.75) are kept — new phishing domains
                # are often absent from GSB for hours/days after being stood up.
                ml_prob = raw.get("probability", 0.0)
                if verdict == "Malicious" and ml_prob < 0.75:
                    verdict = "Safe"
                    risk_score = min(risk_score, 30)
                    suspicious_flags = [f for f in suspicious_flags if "[GSB" not in f]
                    logger.info(
                        "GSB live-cleared ambiguous ML result (prob=%.2f): %s", ml_prob, url
                    )
                elif verdict in ("Malicious", "Suspicious"):
                    # ML is confident or Suspicious — trust ML, just note GSB cleared
                    suspicious_flags.append("[GSB LIVE] Not yet in GSB database — ML verdict retained")
                    logger.debug("GSB cleared but ML confident (prob=%.2f), keeping verdict: %s", ml_prob, url)
        else:
            # Degraded — note in flags so analysts know check wasn't live
            if not any("[GSB" in f for f in suspicious_flags):
                suspicious_flags.append(f"[GSB] {gsb['gsb_status']}")

    except Exception as e:  # noqa: BLE001
        logger.warning("GSB fusion error for %s: %s", url, e)
        suspicious_flags.append("[GSB] Check failed — ML verdict only")


    return ThreatResult(
        scan_id=scan_id,
        scanner_type="url",
        url=raw.get("url", url),
        verdict=verdict,
        risk_score=risk_score,
        confidence=raw.get("confidence", "Low"),
        probability=raw.get("probability", 0.0),
        threshold=raw.get("threshold"),
        model_version=raw.get("model_version"),
        algorithm=raw.get("algorithm"),
        feature_version=raw.get("feature_version"),
        features_by_family=raw.get("features_by_family", {}),
        raw_features=raw.get("raw_features", {}),
        suspicious_flags=suspicious_flags,
        error=raw.get("error"),
        timestamp=now_iso,
    )


def scan_batch_urls(urls: list[str]) -> list[ThreatResult]:
    """Scan a list of URLs through ML + GSB fusion."""
    results = []
    for u in urls:
        u_clean = u.strip()
        if u_clean:
            results.append(scan_single_url(u_clean, save_history=True))
    return results
