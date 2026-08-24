"""Pydantic schemas for Forensics, Intelligence, Correlation, and Cases."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class IpIntelResponse(BaseModel):
    ip: str
    is_valid: bool
    is_private: bool
    country: Optional[str] = "United States"
    country_code: Optional[str] = "US"
    city: Optional[str] = "Ashburn"
    region: Optional[str] = "Virginia"
    latitude: Optional[float] = 39.0438
    longitude: Optional[float] = -77.4874
    isp: Optional[str] = "Cloudflare, Inc."
    asn: Optional[str] = "AS13335"
    domain: Optional[str] = None
    threat_score: int = 15
    threat_level: str = "Low Risk"
    is_proxy_or_vpn: bool = False
    is_tor_node: bool = False
    is_known_attacker: bool = False
    attribution_note: str = "Probable infrastructure location based on BGP routing / ASN registration."


class DomainIntelResponse(BaseModel):
    domain: str
    is_valid: bool
    registrar: Optional[str] = "NameCheap, Inc."
    creation_date: Optional[str] = "2024-03-15"
    age_days: int = 160
    is_newly_registered: bool = False
    mx_records: list[str] = ["mail.protection.outlook.com"]
    nameservers: list[str] = ["ns1.cloudflare.com", "ns2.cloudflare.com"]
    ip_addresses: list[str] = ["104.21.45.192", "172.67.189.12"]
    has_spf: bool = True
    has_dmarc: bool = True
    risk_score: int = 20
    risk_verdict: str = "Low Risk"
    reasons: list[str] = []


class ThreatFeedResponse(BaseModel):
    indicator: str
    indicator_type: str  # URL | Domain | IP | Hash
    provider: str
    is_listed: bool
    reputation: str  # Clean | Malicious | Suspicious | Unknown
    confidence: float
    category: Optional[str] = None
    last_seen: Optional[str] = None
    source_status: str = "Online"


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # email | sender | domain | ip | asn | url | campaign
    risk: str  # low | medium | high | critical
    metadata: dict[str, Any] = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str  # sent-from | contains | resolves-to | hosted-on | member-of
    label: Optional[str] = None


class GraphCorrelationResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    summary: str


class CaseRecord(BaseModel):
    case_id: str
    title: str
    target_type: str  # email | url | campaign
    target_value: str
    verdict: str
    risk_score: int
    status: str  # Open | Investigating | Resolved | Archived
    priority: str  # Critical | High | Medium | Low
    assigned_analyst: str = "Security Analyst"
    notes: list[str] = []
    created_at: str
    updated_at: str


class CaseCreateRequest(BaseModel):
    title: str
    target_type: str
    target_value: str
    verdict: str
    risk_score: int
    priority: str = "Medium"
    notes: Optional[str] = None


class ForensicReportResponse(BaseModel):
    report_id: str
    case_id: Optional[str] = None
    title: str
    generated_at: str
    analyst: str
    executive_summary: str
    threat_classification: str
    overall_risk_score: int
    confidence_band: str
    email_forensics: Optional[dict[str, Any]] = None
    url_evidence: list[dict[str, Any]] = []
    ip_geolocation: list[dict[str, Any]] = []
    authentication_status: list[dict[str, Any]] = []
    nlp_indicators: list[dict[str, Any]] = []
    attribution_disclaimer: str
    recommendations: list[str] = []
