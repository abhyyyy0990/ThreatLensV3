"""Intelligence and Threat Feeds Router."""
from __future__ import annotations

from fastapi import APIRouter, Query
from backend.schemas.intelligence import IpIntelResponse, DomainIntelResponse, ThreatFeedResponse
from backend.services.intel_service import get_ip_intelligence, get_domain_intelligence, check_threat_feeds

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
