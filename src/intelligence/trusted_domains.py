"""
Trusted domain allowlist for ThreatLens URL scanner.

Domains in this list are globally recognized, authoritative services.
When the registered domain matches an entry here AND GSB is live and clean,
the verdict is overridden to Safe with a low risk score.

Rules for inclusion:
  - Must be a globally recognized, major service provider
  - Must have a strong security team and abuse reporting process
  - Must NOT include subdomains (the scanner checks registered domain only)
  - Review and update this list periodically

IMPORTANT: This list bypasses ML for the registered domain only.
Subdomains are still fully analyzed (e.g. evil.google.com is NOT skipped).
"""
from __future__ import annotations

# Registered domain → human-readable category
TRUSTED_DOMAINS: dict[str, str] = {
    # Search & cloud
    "google.com":        "Google LLC",
    "googleapis.com":    "Google LLC",
    "googleusercontent.com": "Google LLC",
    "gstatic.com":       "Google LLC",
    "youtube.com":       "Google LLC",
    "youtu.be":          "Google LLC",

    # Microsoft
    "microsoft.com":     "Microsoft Corporation",
    "microsoftonline.com": "Microsoft Corporation",
    "office.com":        "Microsoft Corporation",
    "office365.com":     "Microsoft Corporation",
    "live.com":          "Microsoft Corporation",
    "outlook.com":       "Microsoft Corporation",
    "azure.com":         "Microsoft Corporation",
    "azurewebsites.net": "Microsoft Corporation",
    "bing.com":          "Microsoft Corporation",

    # Apple
    "apple.com":         "Apple Inc.",
    "icloud.com":        "Apple Inc.",

    # Amazon
    "amazon.com":        "Amazon.com Inc.",
    "amazonaws.com":     "Amazon Web Services",
    "aws.amazon.com":    "Amazon Web Services",

    # Meta
    "facebook.com":      "Meta Platforms Inc.",
    "instagram.com":     "Meta Platforms Inc.",
    "whatsapp.com":      "Meta Platforms Inc.",

    # Developer & productivity
    "github.com":        "GitHub Inc.",
    "gitlab.com":        "GitLab Inc.",
    "stackoverflow.com": "Stack Overflow",
    "npmjs.com":         "npm Inc.",
    "pypi.org":          "Python Software Foundation",

    # CDN & infra
    "cloudflare.com":    "Cloudflare Inc.",
    "fastly.com":        "Fastly Inc.",

    # Banking (major)
    "paypal.com":        "PayPal Holdings Inc.",
    "stripe.com":        "Stripe Inc.",

    # Communication
    "slack.com":         "Slack Technologies",
    "zoom.us":           "Zoom Video Communications",
    "teams.microsoft.com": "Microsoft Corporation",

    # Media
    "netflix.com":       "Netflix Inc.",
    "spotify.com":       "Spotify AB",
    "twitter.com":       "X Corp",
    "x.com":             "X Corp",
    "linkedin.com":      "LinkedIn Corporation",

    # Government & standards
    "gov.in":            "Government of India",
    "nic.in":            "National Informatics Centre",
    "rbi.org.in":        "Reserve Bank of India",
}


def is_trusted_domain(registered_domain: str) -> tuple[bool, str]:
    """
    Check if a registered domain is in the trusted allowlist.

    Args:
        registered_domain: The registered domain (e.g. 'google.com'), NOT including subdomains.

    Returns:
        (is_trusted: bool, organization: str)
        is_trusted is True only for the exact registered domain.
        Subdomains are NOT covered — 'evil.google.com' is NOT trusted.
    """
    domain = registered_domain.lower().strip()
    org = TRUSTED_DOMAINS.get(domain, "")
    return bool(org), org
