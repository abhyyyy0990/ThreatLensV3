"""ThreatLens URL Feature Extractor — VERSION v001.

This module converts a raw URL string into a fixed-length numeric feature
vector used by the ML models.

Design rules:
- Pure computation only — no network calls, no DNS lookups.
- All features are deterministic and reproducible.
- Feature schema is versioned alongside the model artifact.
- Uses tldextract for accurate registered-domain / subdomain / TLD extraction.

Feature families:
  Lexical:    raw character statistics
  Structural: URL component properties
  Entropy:    information-theoretic features
  Semantic:   security-relevant keyword signals
"""

from __future__ import annotations

import math
import re
import unicodedata
import urllib.parse
from typing import Any

import tldextract as _tldextract_module

# ────────────────────────────────────────────────
# Module-level tldextract instance configured for OFFLINE use.
# suffix_list_urls=[] disables all network fetches and uses the
# bundled offline Public Suffix List shipped with the package.
# This is essential for air-gapped / sandbox environments and
# ensures deterministic, reproducible feature extraction with
# no network latency or connectivity failures.
# ────────────────────────────────────────────────
_extractor = _tldextract_module.TLDExtract(suffix_list_urls=[])

# ────────────────────────────────────────────────
# Version — must be bumped whenever features change.
# The training pipeline saves this alongside every model artifact so that
# inference always uses the same feature schema.
# ────────────────────────────────────────────────
FEATURE_VERSION = "v001"

# Suspicious TLDs that are disproportionately abused in phishing campaigns.
# Source: ICANN data + public threat-intelligence reports.
_SUSPICIOUS_TLDS = frozenset(
    {
        "tk", "ml", "ga", "cf", "gq",   # free Freenom TLDs
        "xyz", "top", "club", "site",
        "online", "info", "biz",
        "work", "click", "link",
        "win", "loan", "review",
        "download", "zip", "mov",        # Google 2023 gTLDs abused immediately
    }
)

# Keywords strongly associated with phishing / credential-harvesting pages.
_PHISHING_KEYWORDS = frozenset(
    {
        "login", "signin", "sign-in", "logon",
        "account", "accounts",
        "verify", "verification", "validate",
        "secure", "security",
        "update", "confirm", "password",
        "credential", "credentials",
        "banking", "banking-",
        "paypal", "apple", "google", "microsoft",
        "amazon", "netflix", "instagram",
        "support", "helpdesk",
        "webmail", "cpanel",
        "recover", "recovery",
    }
)

# Characters whose excess typically indicates obfuscation or redirects.
_SPECIAL_CHARS = set("@%=?&-_~")


def _char_entropy(s: str) -> float:
    """Shannon entropy of a string in bits per character."""
    if not s:
        return 0.0
    freq: dict[str, int] = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    n = len(s)
    return -sum((cnt / n) * math.log2(cnt / n) for cnt in freq.values())


def _is_ip_host(hostname: str) -> bool:
    """Return True if the hostname is an IPv4 or IPv6 address."""
    # IPv4
    ipv4 = re.compile(
        r"^(\d{1,3}\.){3}\d{1,3}$"
    )
    if ipv4.match(hostname):
        parts = hostname.split(".")
        return all(0 <= int(p) <= 255 for p in parts)
    # IPv6 (bracketed)
    return hostname.startswith("[") and hostname.endswith("]")


def _has_punycode(hostname: str) -> bool:
    """Return True if hostname contains punycode-encoded labels (xn--)."""
    return "xn--" in hostname.lower()


def _count_keyword_hits(text: str, keywords: frozenset) -> int:
    """Count how many distinct phishing keywords appear in *text*."""
    lower = text.lower()
    return sum(1 for kw in keywords if kw in lower)


def extract(url: str) -> dict[str, Any]:
    """Extract all v001 features from a URL string.

    Args:
        url: The raw URL string (may be malformed).

    Returns:
        A flat dict mapping feature name → numeric value.
        Returns a zero-vector with ``parse_error=1`` on parsing failure.
    """
    # ── Guard against empty / non-string input ────────────────
    if not isinstance(url, str) or not url.strip():
        return _zero_vector(parse_error=1)

    # ── Attempt to parse ──────────────────────────────────────
    try:
        parsed = urllib.parse.urlparse(url)
        ext = _extractor(url)
    except Exception:  # noqa: BLE001 – broad catch intentional for malformed input
        return _zero_vector(parse_error=1)

    # Some dataset URLs contain binary garbage in component positions
    # (e.g. non-integer port).  Access each property defensively.
    try:
        scheme = (parsed.scheme or "").lower()
    except Exception:
        scheme = ""
    try:
        hostname = (parsed.hostname or "").lower()
    except Exception:
        hostname = ""
    path = parsed.path or ""
    query = parsed.query or ""
    fragment = parsed.fragment or ""

    # tldextract components
    subdomain = ext.subdomain or ""
    domain = ext.domain or ""
    suffix = ext.suffix or ""
    # Use top_domain_under_public_suffix (replaces deprecated registered_domain)
    registered_domain = getattr(ext, "top_domain_under_public_suffix", None) or ext.registered_domain or ""

    # Full URL string (for whole-URL features)
    full = url

    # ── 1. Lexical features ───────────────────────────────────
    url_len = len(full)
    hostname_len = len(hostname)
    path_len = len(path)
    query_len = len(query)
    fragment_len = len(fragment)
    registered_domain_len = len(registered_domain)

    dot_count = full.count(".")
    hyphen_count = full.count("-")
    underscore_count = full.count("_")
    at_count = full.count("@")
    percent_count = full.count("%")
    equals_count = full.count("=")
    question_count = full.count("?")
    ampersand_count = full.count("&")
    slash_count = full.count("/")
    tilde_count = full.count("~")

    digit_count = sum(c.isdigit() for c in full)
    letter_count = sum(c.isalpha() for c in full)
    digit_ratio = digit_count / max(url_len, 1)
    letter_ratio = letter_count / max(url_len, 1)

    special_char_count = sum(1 for c in full if c in _SPECIAL_CHARS)
    special_char_ratio = special_char_count / max(url_len, 1)

    # ── 2. Structural / component features ───────────────────
    has_https = int(scheme == "https")
    has_http = int(scheme == "http")
    is_ip = int(_is_ip_host(hostname))
    has_punycode = int(_has_punycode(hostname))

    subdomain_count = len([s for s in subdomain.split(".") if s]) if subdomain else 0
    path_depth = len([p for p in path.split("/") if p])
    query_param_count = len(urllib.parse.parse_qs(query))

    # Suspicious TLD
    tld_suspicious = int(suffix.lower() in _SUSPICIOUS_TLDS)

    # URL contains authentication credentials (user:pass@)
    has_credentials = int(bool(parsed.username))

    # Double-slash in path (common redirect trick)
    has_double_slash = int("//" in path)

    # Hexadecimal or percent-encoded sequences in path/query
    encoded_char_count = len(re.findall(r"%[0-9a-fA-F]{2}", full))

    # Non-ASCII characters (punycode expansion, homograph attacks)
    non_ascii_count = sum(1 for c in full if ord(c) > 127)

    # Port is non-standard (not 80/443/None)
    # Guard with try/except: some dataset URLs contain binary garbage in the
    # port position that causes urllib.parse to raise ValueError.
    try:
        port = parsed.port
    except ValueError:
        port = None
    has_nonstandard_port = int(port is not None and port not in (80, 443))

    # ── 3. Entropy features ───────────────────────────────────
    url_entropy = _char_entropy(full)
    hostname_entropy = _char_entropy(hostname)
    path_entropy = _char_entropy(path) if path else 0.0

    # ── 4. Semantic / security keyword features ───────────────
    # Brand names (google, paypal, etc.) are phishing signals ONLY when
    # they appear in a URL that is NOT owned by that brand.
    # e.g. paypal-login.xyz  → flag  |  paypal.com → do NOT flag
    _BRAND_KEYWORDS = frozenset({
        "paypal", "apple", "google", "microsoft",
        "amazon", "netflix", "instagram",
    })
    _NON_BRAND_KEYWORDS = _PHISHING_KEYWORDS - _BRAND_KEYWORDS

    # Check non-brand phishing keywords against full URL
    phishing_kw_count = _count_keyword_hits(full, _NON_BRAND_KEYWORDS)

    # Check brand keywords only against subdomain + path (not registered domain itself)
    non_domain_part = f"{subdomain}/{path}/{query}"
    brand_hits_in_non_domain = _count_keyword_hits(non_domain_part, _BRAND_KEYWORDS)
    phishing_kw_count += brand_hits_in_non_domain

    has_phishing_keyword = int(phishing_kw_count > 0)

    # Subdomain or path contains a known brand name without owning the domain
    brand_in_subdomain = _count_keyword_hits(subdomain, _BRAND_KEYWORDS)

    # Suspicious patterns
    has_long_subdomain = int(hostname_len > 30)
    has_many_subdomains = int(subdomain_count >= 3)

    # ── 5. TLD-specific ──────────────────────────────────────
    suffix_len = len(suffix)

    # ── Assemble feature dict ─────────────────────────────────
    return {
        # meta
        "feature_version": FEATURE_VERSION,
        "parse_error": 0,
        # lexical
        "url_len": url_len,
        "hostname_len": hostname_len,
        "path_len": path_len,
        "query_len": query_len,
        "fragment_len": fragment_len,
        "registered_domain_len": registered_domain_len,
        "dot_count": dot_count,
        "hyphen_count": hyphen_count,
        "underscore_count": underscore_count,
        "at_count": at_count,
        "percent_count": percent_count,
        "equals_count": equals_count,
        "question_count": question_count,
        "ampersand_count": ampersand_count,
        "slash_count": slash_count,
        "tilde_count": tilde_count,
        "digit_count": digit_count,
        "letter_count": letter_count,
        "digit_ratio": digit_ratio,
        "letter_ratio": letter_ratio,
        "special_char_count": special_char_count,
        "special_char_ratio": special_char_ratio,
        # structural
        "has_https": has_https,
        "has_http": has_http,
        "is_ip": is_ip,
        "has_punycode": has_punycode,
        "subdomain_count": subdomain_count,
        "path_depth": path_depth,
        "query_param_count": query_param_count,
        "tld_suspicious": tld_suspicious,
        "has_credentials": has_credentials,
        "has_double_slash": has_double_slash,
        "encoded_char_count": encoded_char_count,
        "non_ascii_count": non_ascii_count,
        "has_nonstandard_port": has_nonstandard_port,
        "suffix_len": suffix_len,
        # entropy
        "url_entropy": url_entropy,
        "hostname_entropy": hostname_entropy,
        "path_entropy": path_entropy,
        # semantic
        "phishing_kw_count": phishing_kw_count,
        "has_phishing_keyword": has_phishing_keyword,
        "brand_in_subdomain": brand_in_subdomain,
        "has_long_subdomain": has_long_subdomain,
        "has_many_subdomains": has_many_subdomains,
    }


def feature_names() -> list[str]:
    """Return the ordered list of numeric feature column names for ML.

    The ``feature_version`` and ``parse_error`` meta columns are excluded
    from the ML feature set.
    """
    _META = {"feature_version", "parse_error"}
    sample = extract("http://example.com/path?q=1")
    return [k for k in sample if k not in _META]


def _zero_vector(parse_error: int = 1) -> dict[str, Any]:
    """Return an all-zero feature dict for unparseable URLs."""
    names = [
        "url_len", "hostname_len", "path_len", "query_len", "fragment_len",
        "registered_domain_len", "dot_count", "hyphen_count", "underscore_count",
        "at_count", "percent_count", "equals_count", "question_count",
        "ampersand_count", "slash_count", "tilde_count", "digit_count",
        "letter_count", "digit_ratio", "letter_ratio", "special_char_count",
        "special_char_ratio", "has_https", "has_http", "is_ip", "has_punycode",
        "subdomain_count", "path_depth", "query_param_count", "tld_suspicious",
        "has_credentials", "has_double_slash", "encoded_char_count",
        "non_ascii_count", "has_nonstandard_port", "suffix_len",
        "url_entropy", "hostname_entropy", "path_entropy",
        "phishing_kw_count", "has_phishing_keyword", "brand_in_subdomain",
        "has_long_subdomain", "has_many_subdomains",
    ]
    result: dict[str, Any] = {n: 0 for n in names}
    result["feature_version"] = FEATURE_VERSION
    result["parse_error"] = parse_error
    return result
