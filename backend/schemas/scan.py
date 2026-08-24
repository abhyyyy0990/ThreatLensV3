"""Pydantic schemas for scanning requests and responses."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class UrlScanRequest(BaseModel):
    url: str = Field(..., description="URL string to scan")
    save_history: bool = Field(True, description="Whether to store in history database")


class ThreatResult(BaseModel):
    scan_id: Optional[str] = None
    scanner_type: str = "url"
    url: str
    verdict: str  # Malicious | Safe | Suspicious | Error
    risk_score: int  # 0 - 100
    confidence: str  # High | Medium | Low
    probability: float
    threshold: Optional[float] = None
    model_version: Optional[str] = None
    algorithm: Optional[str] = None
    feature_version: Optional[str] = None
    features_by_family: dict[str, dict[str, Any]] = {}
    raw_features: dict[str, Any] = {}
    suspicious_flags: list[str] = []
    error: Optional[str] = None
    timestamp: Optional[str] = None


class EmailScanRequest(BaseModel):
    raw_email: str = Field(..., description="Pasted raw email content (headers + body)")
    save_history: bool = Field(True, description="Whether to store in history database")


class NlpSignal(BaseModel):
    category: str
    detected: bool
    confidence: str
    details: str


class AuthResult(BaseModel):
    protocol: str  # SPF | DKIM | DMARC
    status: str  # PASS | FAIL | SOFTFAIL | NEUTRAL | NONE | UNVERIFIED
    details: str
    explanation: str


class SmtpHop(BaseModel):
    hop_index: int
    from_host: str
    by_host: str
    ip: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    asn: Optional[str] = None
    timestamp: Optional[str] = None
    delay_seconds: int = 0
    is_suspicious: bool = False


class EmailThreatResult(BaseModel):
    scan_id: Optional[str] = None
    scanner_type: str = "email"
    subject: Optional[str] = None
    sender: Optional[str] = None
    reply_to: Optional[str] = None
    return_path: Optional[str] = None
    headers: dict[str, str] = {}
    verdict: str
    risk_score: int
    confidence: str
    url_count: int = 0
    extracted_urls: list[str] = []
    url_results: list[ThreatResult] = []
    suspicious_flags: list[str] = []
    nlp_signals: list[NlpSignal] = []
    auth_results: list[AuthResult] = []
    relay_path: list[SmtpHop] = []
    attachments_metadata: list[dict[str, Any]] = []
    error: Optional[str] = None
    timestamp: Optional[str] = None


class QrScanRequest(BaseModel):
    payload: Optional[str] = None
    image_base64: Optional[str] = None


class ScreenshotScanRequest(BaseModel):
    image_base64: Optional[str] = None
    ocr_text: Optional[str] = None


class BatchScanRequest(BaseModel):
    items: list[str] = Field(..., description="List of URLs or strings to scan")


class BatchScanResult(BaseModel):
    total: int
    malicious: int
    safe: int
    suspicious: int
    results: list[ThreatResult]
