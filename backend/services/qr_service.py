"""QR Code and Screenshot / OCR Message Analysis Services."""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from backend.services.url_service import scan_single_url
from backend.schemas.scan import ThreatResult


def analyze_qr_code(payload: str = None, filename: str = None) -> ThreatResult:
    """Analyze a decoded QR code payload (URL or text)."""
    clean_payload = (payload or "").strip()
    
    # If payload is a URL, pipe directly through the production ML pipeline
    if clean_payload.startswith(("http://", "https://", "www.")) or "." in clean_payload:
        if not clean_payload.startswith("http"):
            clean_payload = "http://" + clean_payload
        result = scan_single_url(clean_payload, save_history=True)
        result.scanner_type = "qr"
        result.suspicious_flags.append("Decoded from QR code image matrix")
        return result
    else:
        # Text/Contact QR payload
        scan_id = f"TL-QR-{uuid.uuid4().hex[:8].upper()}"
        return ThreatResult(
            scan_id=scan_id,
            scanner_type="qr",
            url=clean_payload or "text://plain-qr-payload",
            verdict="Safe",
            risk_score=10,
            confidence="High",
            probability=0.10,
            suspicious_flags=["Non-URL plain text QR payload"],
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


def analyze_screenshot_text(text: str = None, filename: str = None) -> dict:
    """Analyze OCR extracted text from screenshot or message."""
    clean_text = (text or "").strip()
    scan_id = f"TL-IMG-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Extract any embedded URLs
    url_pattern = re.compile(r"(?:https?://|www\.)[a-zA-Z0-9\-\._~:/\?#\[\]@!$&'\(\)\*\+,;=%]+", re.IGNORECASE)
    found_urls = url_pattern.findall(clean_text)
    
    scanned_urls = []
    for u in found_urls:
        if not u.startswith("http"):
            u = "http://" + u
        scanned_urls.append(scan_single_url(u, save_history=False))

    # Social engineering / urgency checks
    flags = []
    if any(w in clean_text.lower() for w in ["password", "verify", "suspended", "urgent", "bitcoin", "gift card", "bank", "transfer", "whatsapp", "telegram"]):
        flags.append("Social engineering / phishing cues detected in image OCR text")

    if any(r.verdict == "Malicious" for r in scanned_urls):
        verdict = "Malicious"
        risk_score = 85
    elif flags or any(r.verdict == "Suspicious" for r in scanned_urls):
        verdict = "Suspicious"
        risk_score = 50
    else:
        verdict = "Safe"
        risk_score = 15

    return {
        "scan_id": scan_id,
        "scanner_type": "screenshot",
        "extracted_text": clean_text,
        "verdict": verdict,
        "risk_score": risk_score,
        "confidence": "High" if scanned_urls else "Medium",
        "extracted_urls": found_urls,
        "url_results": [r.model_dump() for r in scanned_urls],
        "suspicious_flags": flags,
        "timestamp": now_iso,
    }
