"""Unified Email Threat Detection & Forensic Analysis Service."""
from __future__ import annotations

import sys
from pathlib import Path
from datetime import datetime, timezone
import uuid
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.storage import db
from backend.services.eml_service import parse_email_bytes_or_text
from backend.services.header_forensics import analyze_header_forensics, analyze_email_authentication
from backend.services.nlp_service import analyze_email_nlp
from backend.services.smtp_path import parse_smtp_relay_path
from backend.services.url_service import scan_single_url
from backend.schemas.scan import EmailThreatResult, ThreatResult


def analyze_email_content(content: str | bytes, save_history: bool = True) -> EmailThreatResult:
    """End-to-end multi-dimensional email threat analysis."""
    parsed = parse_email_bytes_or_text(content)
    scan_id = f"TL-EML-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Header Forensics
    header_forensics = analyze_header_forensics(parsed)
    suspicious_flags = list(header_forensics["flags"])

    # 2. Authentication Analysis (SPF/DKIM/DMARC)
    auth_results = analyze_email_authentication(parsed.headers, header_forensics["from_domain"])

    # 3. SMTP Relay Path
    relay_path = parse_smtp_relay_path(parsed.received_headers)

    # 4. NLP Intent Threat Analysis
    nlp_signals = analyze_email_nlp(parsed.subject, parsed.body_plain)
    for sig in nlp_signals:
        if sig.detected:
            suspicious_flags.append(f"{sig.category}: {sig.details}")

    # 5. Extract & ML Scan all URLs
    url_results: list[ThreatResult] = []
    for u in parsed.extracted_urls:
        url_res = scan_single_url(u, save_history=False)
        url_results.append(url_res)
        if url_res.verdict == "Malicious":
            suspicious_flags.append(f"Malicious embedded URL: {u[:60]}")
        elif url_res.verdict == "Suspicious":
            suspicious_flags.append(f"Suspicious embedded URL: {u[:60]}")

    # 6. Attachment Checks
    for att in parsed.attachments:
        if att.get("is_executable"):
            suspicious_flags.append(f"Dangerous executable attachment detected: {att['filename']}")

    # 7. Unified Risk Engine & Verdict Calculation
    # Calculate score based on: URL scores, Auth failures, Header spoofing, NLP signals, Attachments
    base_url_score = max([r.risk_score for r in url_results]) if url_results else 0
    
    auth_penalty = 0
    for a in auth_results:
        if a.status == "FAIL":
            auth_penalty += 25
        elif a.status == "SOFTFAIL":
            auth_penalty += 15
        elif a.status == "UNVERIFIED":
            # Missing auth header = no proof sender is legitimate
            auth_penalty += 12
    auth_penalty = min(auth_penalty, 75)  # cap total auth penalty

    # Bug 6 fix: cap header_penalty — each anomaly adds 15 pts, max 40 total
    header_penalty = min(len(header_forensics["anomalies"]) * 15, 40)
    nlp_penalty = sum(15 for s in nlp_signals if s.detected)
    att_penalty = sum(35 for a in parsed.attachments if a.get("is_executable"))

    computed_risk = max(base_url_score, min(100, int(base_url_score * 0.5 + auth_penalty + header_penalty + nlp_penalty + att_penalty)))

    
    # Verdict mapping
    if any(r.verdict == "Malicious" for r in url_results) or computed_risk >= 65 or att_penalty >= 35:
        verdict = "Malicious"
        confidence = "High"
    elif any(r.verdict == "Suspicious" for r in url_results) or computed_risk >= 35 or header_penalty > 0:
        verdict = "Suspicious"
        confidence = "Medium"
    else:
        verdict = "Safe"
        confidence = "High" if computed_risk < 20 else "Medium"

    # Persist to SQLite history (safe representation, no PII raw body)
    if save_history:
        subject_disp = parsed.subject or "(No Subject)"
        from_disp = parsed.sender or "(Unknown Sender)"
        input_repr = f"Email: {subject_disp[:80]} | From: {from_disp[:60]}"
        try:
            db.insert_scan(
                scan_type="email",
                input_repr=input_repr,
                verdict=verdict,
                risk_score=computed_risk,
                confidence=confidence,
                details={
                    "scan_id": scan_id,
                    "subject": subject_disp,
                    "from": from_disp,
                    "url_count": len(url_results),
                    "auth": [a.model_dump() for a in auth_results],
                    "flags": suspicious_flags,
                }
            )
        except Exception:
            pass

    return EmailThreatResult(
        scan_id=scan_id,
        scanner_type="email",
        subject=parsed.subject,
        sender=parsed.sender,
        reply_to=parsed.reply_to,
        return_path=parsed.return_path,
        headers=parsed.headers,
        verdict=verdict,
        risk_score=computed_risk,
        confidence=confidence,
        url_count=len(url_results),
        extracted_urls=parsed.extracted_urls,
        url_results=url_results,
        suspicious_flags=suspicious_flags,
        nlp_signals=nlp_signals,
        auth_results=auth_results,
        relay_path=relay_path,
        attachments_metadata=parsed.attachments,
        error=None,
        timestamp=now_iso,
    )
