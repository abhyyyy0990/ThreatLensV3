"""Email Header Forensics and Spoofing Analysis Service."""
from __future__ import annotations

import re
import math
import datetime
from collections import Counter
from typing import Any
from email.utils import parsedate_to_datetime
from backend.schemas.scan import AuthResult


# ── Known brand domains used for typosquat detection ─────────────────────────
_BRAND_DOMAINS = [
    "paypal.com", "microsoft.com", "google.com", "apple.com", "amazon.com",
    "chase.com", "wellsfargo.com", "bankofamerica.com", "dhl.com", "fedex.com",
    "netflix.com", "facebook.com", "instagram.com", "twitter.com", "linkedin.com",
    "dropbox.com", "adobe.com", "zoom.us", "docusign.com", "irs.gov",
    "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com", "yesbank.in",
]

# ── Display name brand keywords ───────────────────────────────────────────────
_BRAND_KEYWORDS = [
    "paypal", "microsoft", "google", "apple", "amazon", "chase", "wells fargo",
    "bank of america", "dhl", "fedex", "netflix", "facebook", "instagram",
    "linkedin", "dropbox", "adobe", "zoom", "docusign", "irs", "sbi", "hdfc",
    "icici", "axis bank", "yes bank", "internal it", "support", "security team",
    "help desk", "helpdesk", "noreply", "no-reply",
]


# ── Helper: Levenshtein distance (no external deps) ───────────────────────────
def _levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        return _levenshtein(b, a)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for ca in a:
        curr = [prev[0] + 1]
        for j, cb in enumerate(b):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (0 if ca == cb else 1)))
        prev = curr
    return prev[-1]


# ── Helper: Shannon entropy of a string ──────────────────────────────────────
def _shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    counts = Counter(s)
    total = len(s)
    return -sum((c / total) * math.log2(c / total) for c in counts.values())


# ── Helper: Check for non-ASCII / punycode (homograph attack) ────────────────
def _has_unicode_domain(domain: str) -> bool:
    return any(ord(c) > 127 for c in domain) or domain.startswith("xn--")


# ── Helper: Check if email was sent at suspicious hour (midnight–5am UTC) ────
def _is_suspicious_send_time(date_str: str) -> tuple[bool, str]:
    """Returns (is_suspicious, human_readable_time)."""
    if not date_str:
        return False, ""
    try:
        dt = parsedate_to_datetime(date_str)
        utc_dt = dt.astimezone(datetime.timezone.utc)
        hr = utc_dt.hour
        time_str = utc_dt.strftime("%H:%M UTC")
        return (0 <= hr < 5), time_str
    except Exception:
        return False, ""


def extract_domain(email_addr: str) -> str:
    """Extract domain portion of an email address."""
    if "@" in email_addr:
        return email_addr.split("@", 1)[1].strip().lower().rstrip(">")
    return ""


def analyze_header_forensics(parsed_data) -> dict[str, Any]:
    """Perform deterministic header spoofing and consistency checks."""
    flags = []
    anomalies = []

    from_addr = parsed_data.from_email
    from_domain = extract_domain(from_addr)
    reply_to = parsed_data.reply_to
    reply_to_domain = extract_domain(reply_to)
    return_path = parsed_data.return_path
    return_path_domain = extract_domain(return_path)

    # 1. From vs Reply-To Mismatch
    if reply_to_domain and from_domain and (reply_to_domain != from_domain):
        flags.append("Reply-To domain mismatch with sender domain")
        anomalies.append({
            "check": "Reply-To Mismatch",
            "severity": "High",
            "description": (
                f"Sender domain '{from_domain}' differs from Reply-To '{reply_to_domain}'. "
                "Responses will go to a different domain — classic BEC tactic."
            )
        })

    # 2. From vs Return-Path Mismatch
    if return_path_domain and from_domain and (return_path_domain != from_domain):
        flags.append("Return-Path domain mismatch with From header")
        anomalies.append({
            "check": "Return-Path Mismatch",
            "severity": "Medium",
            "description": f"Sender domain '{from_domain}' differs from Return-Path '{return_path_domain}'."
        })

    # 3. Display Name Spoofing (e.g. 'PayPal Security <attacker@gmail.com>')
    display_name = parsed_data.from_display_name.lower()
    for brand in _BRAND_KEYWORDS:
        if brand in display_name and brand.split()[0] not in from_domain:
            flags.append(f"Display name spoofing: '{parsed_data.from_display_name}' ≠ {from_domain}")
            anomalies.append({
                "check": "Display Name Spoofing",
                "severity": "Critical",
                "description": (
                    f"Display name contains '{brand}' but actual sending domain is '{from_domain}'. "
                    "Attacker is impersonating a trusted brand/person."
                )
            })
            break

    # 4. Missing Message-ID or Date
    if not parsed_data.message_id:
        flags.append("Missing Message-ID header (anomalous mail client)")
        anomalies.append({
            "check": "Missing Message-ID",
            "severity": "Low",
            "description": "RFC 5322 requires Message-ID; absence suggests forged or script-generated email."
        })

    # 5. Free Webmail Spoofing Corporate Role
    free_providers = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "protonmail.com"]
    corporate_keywords = ["support", "security", "billing", "hr", "payroll", "admin", "helpdesk", "noreply"]
    if from_domain in free_providers and any(w in display_name for w in corporate_keywords):
        flags.append("Free webmail address used for official corporate role")
        anomalies.append({
            "check": "Free Mail Service Spoof",
            "severity": "High",
            "description": f"Account claiming role '{parsed_data.from_display_name}' sent from free provider '{from_domain}'."
        })

    # 6. ── NEW: Typosquat / Lookalike Domain Detection ────────────────────────
    if from_domain:
        # Strip subdomain for comparison (mail.paypa1.com → paypa1.com)
        domain_parts = from_domain.split(".")
        base_domain = ".".join(domain_parts[-2:]) if len(domain_parts) >= 2 else from_domain
        for brand_domain in _BRAND_DOMAINS:
            if base_domain == brand_domain:
                break  # Exact match — it's the real brand, no flag
            dist = _levenshtein(base_domain, brand_domain)
            if 1 <= dist <= 2:
                flags.append(f"Typosquat/lookalike domain detected: '{base_domain}' ≈ '{brand_domain}'")
                anomalies.append({
                    "check": "Typosquat Domain",
                    "severity": "Critical",
                    "description": (
                        f"Sender domain '{base_domain}' is 1–2 characters away from the legitimate "
                        f"'{brand_domain}'. This is a classic lookalike/typosquat phishing domain."
                    )
                })
                break

    # 7. ── NEW: Homograph / Unicode Domain Attack ─────────────────────────────
    if from_domain and _has_unicode_domain(from_domain):
        flags.append(f"Homograph/Unicode attack: domain '{from_domain}' contains non-ASCII characters")
        anomalies.append({
            "check": "Homograph Attack",
            "severity": "Critical",
            "description": (
                f"Sender domain '{from_domain}' uses non-ASCII or punycode characters. "
                "Attackers use visually identical Unicode letters (e.g. Cyrillic 'а' vs Latin 'a') "
                "to impersonate legitimate domains."
            )
        })

    # 8. ── NEW: Suspicious Send Time (midnight–5am UTC) ──────────────────────
    is_odd, send_time = _is_suspicious_send_time(parsed_data.date)
    if is_odd:
        flags.append(f"Email sent at suspicious hour ({send_time}) — likely automated spam campaign")
        anomalies.append({
            "check": "Suspicious Send Time",
            "severity": "Medium",
            "description": (
                f"Email was sent at {send_time} (midnight–5am UTC). "
                "Automated phishing/spam campaigns frequently send during off-hours."
            )
        })

    # 9. ── NEW: High-Entropy Sender Address (bot-generated local-part) ────────
    local_part = from_addr.split("@")[0] if "@" in from_addr else from_addr
    entropy = _shannon_entropy(local_part)
    if len(local_part) >= 8 and entropy > 4.0:
        flags.append(f"High-entropy sender address '{local_part}' (entropy={entropy:.2f}) — likely bot-generated")
        anomalies.append({
            "check": "High-Entropy Sender",
            "severity": "Medium",
            "description": (
                f"Local-part '{local_part}' has Shannon entropy of {entropy:.2f} bits/char "
                "(threshold: 4.0). Randomised addresses are a strong indicator of automated "
                "spam or phishing toolkits."
            )
        })

    return {
        "flags": flags,
        "anomalies": anomalies,
        "from_domain": from_domain,
        "reply_to_domain": reply_to_domain,
        "return_path_domain": return_path_domain,
    }


def analyze_email_authentication(headers: dict[str, str], from_domain: str) -> list[AuthResult]:
    """Parse and explain SPF, DKIM, and DMARC status from headers."""
    auth_results = []

    auth_header = headers.get("Authentication-Results", "") or headers.get("authentication-results", "")
    spf_header = headers.get("Received-SPF", "") or headers.get("received-spf", "")
    dkim_header = headers.get("DKIM-Signature", "") or headers.get("dkim-signature", "")

    # 1. SPF Analysis
    spf_status = "UNVERIFIED"
    spf_details = "No Received-SPF or Authentication-Results header found."
    spf_expl = "SPF verification was not recorded by the receiving MTA."

    if "spf=pass" in auth_header.lower() or spf_header.lower().startswith("pass"):
        spf_status = "PASS"
        spf_details = f"Designated mail server is authorized for {from_domain or 'sender domain'}."
        spf_expl = "Sender IP matches the published DNS SPF record."
    elif "spf=fail" in auth_header.lower() or "fail" in spf_header.lower():
        spf_status = "FAIL"
        spf_details = f"Unauthorized relay server attempted to send on behalf of {from_domain}."
        spf_expl = "Mail server IP is explicitly not authorized in the domain's SPF record."
    elif "spf=softfail" in auth_header.lower() or "softfail" in spf_header.lower():
        spf_status = "SOFTFAIL"
        spf_details = "Sender IP is questionable under the ~all SPF mechanism."
        spf_expl = "Domain SPF record designated this IP as not permitted, but not strictly rejected."
    elif "spf=neutral" in auth_header.lower():
        spf_status = "NEUTRAL"
        spf_details = "Domain SPF policy makes no definitive statement (?all)."
        spf_expl = "The domain owner has not declared authorized servers."
    elif auth_header or spf_header:
        spf_status = "PASS" if "pass" in (auth_header + spf_header).lower() else "NONE"
        spf_details = "SPF header recorded."
        spf_expl = "Evaluated based on mail transfer agent headers."

    auth_results.append(AuthResult(protocol="SPF", status=spf_status, details=spf_details, explanation=spf_expl))

    # 2. DKIM Analysis
    dkim_status = "UNVERIFIED"
    dkim_details = "No DKIM signature present."
    dkim_expl = "The message lacks cryptographic digital signature."

    if "dkim=pass" in auth_header.lower():
        dkim_status = "PASS"
        dkim_details = "Cryptographic signature validated against sender public key."
        dkim_expl = "Message body and critical headers were verified unaltered in transit."
    elif "dkim=fail" in auth_header.lower():
        dkim_status = "FAIL"
        dkim_details = "Signature failed validation or body hash mismatch."
        dkim_expl = "Content was modified in transit or signed with invalid key."
    elif dkim_header:
        dkim_status = "UNVERIFIED"
        dkim_details = "DKIM-Signature header present but not verified by gateway."
        dkim_expl = "Signature cannot be validated without Authentication-Results confirmation."

    auth_results.append(AuthResult(protocol="DKIM", status=dkim_status, details=dkim_details, explanation=dkim_expl))

    # 3. DMARC Analysis
    dmarc_status = "UNVERIFIED"
    dmarc_details = "No DMARC policy result found."
    dmarc_expl = "Receiving gateway did not record DMARC alignment check."

    if "dmarc=pass" in auth_header.lower():
        dmarc_status = "PASS"
        dmarc_details = f"DMARC policy aligned with {from_domain}."
        dmarc_expl = "SPF or DKIM passed in alignment with the visible From header."
    elif "dmarc=fail" in auth_header.lower():
        dmarc_status = "FAIL"
        dmarc_details = f"DMARC alignment failed for {from_domain}."
        dmarc_expl = "Both SPF and DKIM failed alignment with the From address domain."
    elif spf_status == "PASS" and dkim_status == "PASS":
        dmarc_status = "PASS"
        dmarc_details = "Inferred alignment from passing SPF & DKIM."
        dmarc_expl = "Both underlying protocols passed authentication."

    auth_results.append(AuthResult(protocol="DMARC", status=dmarc_status, details=dmarc_details, explanation=dmarc_expl))
    return auth_results
