"""Intelligence and Threat Feeds Router."""
from __future__ import annotations

from fastapi import APIRouter, Query
from backend.schemas.intelligence import IpIntelResponse, DomainIntelResponse, ThreatFeedResponse
from backend.services.intel_service import (
    get_ip_intelligence,
    get_domain_intelligence,
    check_threat_feeds,
    query_gsb_for_url,
)
import os

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


@router.get("/ip/{ip}", response_model=IpIntelResponse)
async def ip_intelligence_endpoint(ip: str):
    """Retrieve geolocation, ASN, and infrastructure threat intelligence for an IP."""
    return get_ip_intelligence(ip)


@router.get("/domain/{domain}", response_model=DomainIntelResponse)
async def domain_intelligence_endpoint(domain: str):
    """Retrieve DNS, age, registrar, and reputation intelligence for a domain."""
    return get_domain_intelligence(domain)


@router.get("/threat-feed", response_model=list[ThreatFeedResponse])
async def threat_feed_endpoint(
    indicator: str = Query(..., description="URL, domain, or IP indicator"),
    indicator_type: str = Query("URL", description="Type of indicator")
):
    """Query connected threat intelligence provider feeds."""
    return check_threat_feeds(indicator, indicator_type)


@router.get("/feeds/status")
async def feeds_status_endpoint():
    """
    Probe each threat intelligence provider and return real-time status.
    Used by the Dashboard to display LIVE vs SIMULATED badges.
    """
    # Probe GSB with a known-safe URL to determine if the key is valid and reachable
    gsb_probe = query_gsb_for_url("https://www.google.com")
    gsb_has_key = bool(os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "").strip())
    phishtank_has_key = bool(os.getenv("PHISHTANK_API_KEY", "").strip())

    return {
        "feeds": [
            {
                "name": "Google Safe Browsing",
                "status": "LIVE" if gsb_probe["gsb_live"] else "SIMULATED",
                "live": gsb_probe["gsb_live"],
                "has_key": gsb_has_key,
            },
            {
                "name": "PhishTank",
                "status": "LIVE" if phishtank_has_key else "SIMULATED",
                "live": phishtank_has_key,
                "has_key": phishtank_has_key,
            },
        ]
    }

