"""NLP and Intent Threat Signals Analyzer for Email content."""
from __future__ import annotations

import re
from backend.schemas.scan import NlpSignal


_URGENCY_PATTERNS = [
    r"\b(?:urgent|immediately|action required|within \d+ hours|account suspended|suspended|terminated|act now|expir(?:es?|ing)|immediate response|warning|critical alert)\b",
    r"\b(?:final notice|last chance|deactivation|unauthorized access|security alert|take action)\b"
]

_CREDENTIAL_PATTERNS = [
    r"\b(?:verify your (?:account|identity|password|credentials)|confirm your password|log ?in to your|sign ?in to|update your (?:security|profile|login)|reset your password|enter your credentials)\b",
    r"\b(?:click here to (?:login|verify|unlock)|authenticate|validate your account)\b"
]

_FINANCIAL_PATTERNS = [
    r"\b(?:invoice|payment (?:overdue|due|pending)|wire transfer|bank account|routing number|billing problem|tax refund|crypto|bitcoin|gift card|direct deposit|payroll update)\b",
    r"\b(?:remittance|receipt attached|funds transfer|unpaid balance|outstanding payment)\b"
]

_IMPERSONATION_PATTERNS = [
    r"\b(?:ceo|cfo|executive|it desk|help ?desk|system administrator|security team|payroll department|human resources|office of the|director)\b",
    r"\b(?:are you at your desk|available for a quick task|need you to handle this confidentially|confidential request)\b"
]

_FEAR_THREAT_PATTERNS = [
    r"\b(?:law enforcement|legal action|court summons|police|arrest warrant|penalties|prosecution|fine|penalty)\b"
]


def analyze_email_nlp(subject: str, body: str) -> list[NlpSignal]:
    """Analyze subject and body text for social engineering and attack vector patterns."""
    text = f"{subject}\n{body}".lower()
    signals = []

    # 1. Urgency / Coercion
    urgency_hits = []
    for p in _URGENCY_PATTERNS:
        urgency_hits.extend(re.findall(p, text, re.IGNORECASE))
    
    if urgency_hits:
        signals.append(NlpSignal(
            category="Urgency & Pressure",
            detected=True,
            confidence="High" if len(urgency_hits) >= 2 else "Medium",
            details=f"Detected urgent coercion triggers: {', '.join(list(set(urgency_hits))[:4])}."
        ))
    else:
        signals.append(NlpSignal(
            category="Urgency & Pressure",
            detected=False,
            confidence="High",
            details="No artificial urgency or pressure language detected."
        ))

    # 2. Credential Harvesting
    cred_hits = []
    for p in _CREDENTIAL_PATTERNS:
        cred_hits.extend(re.findall(p, text, re.IGNORECASE))
    
    if cred_hits:
        signals.append(NlpSignal(
            category="Credential Harvesting",
            detected=True,
            confidence="High",
            details=f"Explicit prompts to submit or verify credentials found: {', '.join(list(set(cred_hits))[:3])}."
        ))
    else:
        signals.append(NlpSignal(
            category="Credential Harvesting",
            detected=False,
            confidence="High",
            details="No credential harvesting prompts detected."
        ))

    # 3. Financial & Payment Diversion
    fin_hits = []
    for p in _FINANCIAL_PATTERNS:
        fin_hits.extend(re.findall(p, text, re.IGNORECASE))
    
    if fin_hits:
        signals.append(NlpSignal(
            category="Financial / BEC Fraud",
            detected=True,
            confidence="High" if len(fin_hits) >= 2 else "Medium",
            details=f"Financial solicitation/invoice terminology detected: {', '.join(list(set(fin_hits))[:4])}."
        ))
    else:
        signals.append(NlpSignal(
            category="Financial / BEC Fraud",
            detected=False,
            confidence="High",
            details="No payment diversion or financial fraud patterns detected."
        ))

    # 4. Executive / Authority Impersonation — Bug 7 fix: always emit the signal
    imp_hits = []
    for p in _IMPERSONATION_PATTERNS:
        imp_hits.extend(re.findall(p, text, re.IGNORECASE))

    signals.append(NlpSignal(
        category="Executive Impersonation",
        detected=bool(imp_hits),
        confidence="Medium",
        details=(
            f"Authority keywords or confidential task solicitation found: {', '.join(list(set(imp_hits))[:3])}."
            if imp_hits else "No executive impersonation or authority manipulation patterns detected."
        )
    ))

    # 5. Fear & Threat Language — Bug 7 fix: always emit the signal
    fear_hits = []
    for p in _FEAR_THREAT_PATTERNS:
        fear_hits.extend(re.findall(p, text, re.IGNORECASE))

    signals.append(NlpSignal(
        category="Legal / Fear Tactics",
        detected=bool(fear_hits),
        confidence="High",
        details=(
            f"Intimidation or legal threat language detected: {', '.join(list(set(fear_hits))[:3])}."
            if fear_hits else "No fear-inducing or legal threat language detected."
        )
    ))

    return signals
