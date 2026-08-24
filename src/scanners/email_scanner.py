"""ThreatLens Email Scanner.

Extracts URLs from raw email text, scans each with the URL scanner,
and returns an aggregated result.

Design:
  - Input: raw email text (headers + body) pasted by the user.
  - URL extraction: regex-based, covers http/https, bare domains.
  - Each URL is scanned independently via url_scanner.scan_url().
  - Aggregate verdict: worst-case (any Malicious → Malicious).
  - Modular: header parsing and URL scanning are separate functions
    so full .eml/.msg parsing can be added later without redesign.
  - Raw email body is NOT stored in history to avoid logging PII.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.scanners import url_scanner
from src.storage import db
from src.utils.logger import get_logger

log = get_logger("email_scanner")

# ── URL extraction pattern ────────────────────────────────────────────
# Matches http(s):// URLs. Also catches bare domain-like strings.
_URL_RE = re.compile(
    r"(?:https?://)"                  # Must start with http:// or https://
    r"(?:[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+)",
    re.IGNORECASE,
)

# Email header patterns
_HEADER_RE = re.compile(
    r"^(From|To|Subject|Date|Reply-To|Return-Path|X-Mailer|Message-ID)"
    r"\s*:\s*(.+)$",
    re.IGNORECASE | re.MULTILINE,
)


def extract_headers(raw_email: str) -> dict[str, str]:
    """Extract common headers from raw email text.

    Args:
        raw_email: Raw email text (may or may not include headers).

    Returns:
        Dict of header_name → value for recognised headers.
    """
    headers: dict[str, str] = {}
    for match in _HEADER_RE.finditer(raw_email[:4096]):
        name = match.group(1).capitalize()
        value = match.group(2).strip()
        headers[name] = value
    return headers


def extract_urls(raw_email: str) -> list[str]:
    """Extract unique URLs from raw email text.

    Args:
        raw_email: Raw email text (may include HTML body, headers, links).

    Returns:
        Deduplicated list of URL strings, preserving first-seen order.
    """
    found = _URL_RE.findall(raw_email)
    # Deduplicate preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for url in found:
        cleaned = url.rstrip(".,;:\"'>")
        if cleaned not in seen:
            seen.add(cleaned)
            unique.append(cleaned)
    return unique


def _aggregate_verdict(url_results: list[dict[str, Any]]) -> tuple[str, int, str]:
    """Derive overall verdict, risk score and confidence from per-URL results.

    Policy:
      - Any Malicious → overall Malicious, max risk score
      - Any Suspicious → overall Suspicious, max risk score
      - All Safe → Safe, max risk score
      - No URLs → Safe, 0

    Returns:
        (verdict, risk_score, confidence)
    """
    if not url_results:
        return "Safe", 0, "High"

    verdicts = [r["verdict"] for r in url_results]
    scores = [r["risk_score"] for r in url_results]
    max_score = max(scores) if scores else 0

    if "Malicious" in verdicts:
        return "Malicious", max_score, "High"
    if "Suspicious" in verdicts:
        return "Suspicious", max_score, "Medium"
    return "Safe", max_score, "High"


def scan_email(raw_email: str, save_history: bool = True) -> dict[str, Any]:
    """Scan a raw email for malicious URLs.

    Args:
        raw_email:    Pasted raw email text (headers + body).
        save_history: If True, persist an aggregate result to SQLite.
                      The raw email body is NOT stored.

    Returns:
        Dict with:
          headers, extracted_urls (list), url_results (list of scan dicts),
          verdict, risk_score, confidence, error (None or str)
    """
    if not raw_email or not raw_email.strip():
        return {
            "headers": {},
            "extracted_urls": [],
            "url_results": [],
            "verdict": "Error",
            "risk_score": 0,
            "confidence": "N/A",
            "error": "Empty email content provided.",
        }

    headers = extract_headers(raw_email)
    urls = extract_urls(raw_email)

    log.info(f"Email scan: {len(urls)} URLs extracted from {len(raw_email)} chars")

    # Scan each URL (save_history=False here — we save an aggregate below)
    url_results: list[dict[str, Any]] = []
    for url in urls:
        result = url_scanner.scan_url(url, save_history=False)
        url_results.append(result)

    verdict, risk_score, confidence = _aggregate_verdict(url_results)

    # ── Persist aggregate to history ─────────────────────────────────
    if save_history:
        subject = headers.get("Subject", "")
        from_field = headers.get("From", "")
        # Safe repr: subject + from — no body content stored
        input_repr = f"Email: {subject or '(no subject)'} | From: {from_field or '(unknown)'}"
        try:
            db.insert_scan(
                scan_type="email",
                input_repr=input_repr[:500],
                verdict=verdict,
                risk_score=risk_score,
                confidence=confidence,
                details={
                    "url_count": len(urls),
                    "malicious_urls": sum(
                        1 for r in url_results if r["verdict"] == "Malicious"
                    ),
                    "subject": subject[:200],
                    "from": from_field[:200],
                },
            )
        except Exception as exc:
            log.warning(f"Failed to save email scan history: {exc}")

    return {
        "headers": headers,
        "extracted_urls": urls,
        "url_results": url_results,
        "verdict": verdict,
        "risk_score": risk_score,
        "confidence": confidence,
        "error": None,
    }
