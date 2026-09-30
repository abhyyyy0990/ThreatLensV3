"""Email Header Forensics and Spoofing Analysis Service."""
from __future__ import annotations

import re
from typing import Any
from backend.schemas.scan import AuthResult


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
            "description": f"Sender domain '{from_domain}' differs from Reply-To '{reply_to_domain}'. Often used to divert responses."
        })

    # 2. From vs Return-Path Mismatch
    if return_path_domain and from_domain and (return_path_domain != from_domain):
        flags.append("Return-Path domain mismatch with From header")
        anomalies.append({
            "check": "Return-Path Mismatch",
            "severity": "Medium",
            "description": f"Sender domain '{from_domain}' differs from Return-Path '{return_path_domain}'."
        })

    # 3. Display Name Impersonation (e.g. 'PayPal Security <attacker@gmail.com>')
    display_name = parsed_data.from_display_name.lower()
    known_brands = ["paypal", "microsoft", "google", "apple", "amazon", "chase", "wells fargo", "bank of america", "dhl", "fedex", "netflix", "internal it", "support"]
    for brand in known_brands:
        if brand in display_name and brand not in from_domain:
            flags.append(f"Executive/Brand impersonation in display name ('{parsed_data.from_display_name}')")
            anomalies.append({
                "check": "Display Name Spoofing",
                "severity": "Critical",
                "description": f"Display name contains '{brand}' but domain is '{from_domain}'."
            })
            break

    # 4. Missing Message-ID or Date
    if not parsed_data.message_id:
        flags.append("Missing Message-ID header (anomalous mail client)")
        anomalies.append({
            "check": "Missing Message-ID",
            "severity": "Low",
            "description": "Standard RFC 5322 requires Message-ID; absence suggests forged or custom script generator."
        })

    # 5. Free Webmail as Corporate Sender
    free_providers = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "protonmail.com"]
    if from_domain in free_providers and any(w in display_name for w in ["support", "security", "billing", "hr", "payroll", "admin"]):
        flags.append("Free webmail address used for official corporate role")
        anomalies.append({
            "check": "Free Mail Service Spoof",
            "severity": "High",
            "description": f"Account claiming role '{parsed_data.from_display_name}' sent from free provider '{from_domain}'."
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
        # Bug 3 fix: presence of DKIM-Signature header ≠ valid signature.
        # Without authentication-results confirming pass/fail we can only say
        # the header exists but we cannot verify it.
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
