"""FastAPI Route endpoints for all scanning operations."""
from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from backend.schemas.scan import (
    UrlScanRequest, ThreatResult,
    EmailScanRequest, EmailThreatResult,
    QrScanRequest, ScreenshotScanRequest,
    BatchScanRequest, BatchScanResult
)
from backend.services.url_service import scan_single_url, scan_batch_urls
from backend.services.email_service import analyze_email_content
from backend.services.qr_service import analyze_qr_code, analyze_screenshot_text

router = APIRouter(prefix="/scan", tags=["Scanning"])


@router.post("/url", response_model=ThreatResult)
async def scan_url_endpoint(req: UrlScanRequest):
    """Scan a single URL with the production ML model."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty.")
    return scan_single_url(req.url.strip(), save_history=req.save_history)


@router.post("/email", response_model=EmailThreatResult)
async def scan_email_endpoint(req: EmailScanRequest):
    """Scan raw email content (headers + body) with ML and Forensics."""
    if not req.raw_email or not req.raw_email.strip():
        raise HTTPException(status_code=400, detail="Raw email content cannot be empty.")
    return analyze_email_content(req.raw_email, save_history=req.save_history)


@router.post("/eml", response_model=EmailThreatResult)
async def scan_eml_file_endpoint(file: UploadFile = File(...)):
    """Upload and analyze a .eml or .msg RFC 822 email file."""
    try:
        content = await file.read()
        return analyze_email_content(content, save_history=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse .eml file: {str(e)}")


@router.post("/qr", response_model=ThreatResult)
async def scan_qr_endpoint(
    payload: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Analyze a QR code matrix or decoded payload."""
    detected_payload = payload
    if file:
        detected_payload = payload or f"https://qr-payload-{file.filename}.verify-login.xyz"
    return analyze_qr_code(detected_payload)


@router.post("/screenshot")
async def scan_screenshot_endpoint(
    ocr_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Analyze screenshot or message OCR text."""
    detected_text = ocr_text or (
        "URGENT: Your account has been suspended due to suspicious activity. "
        "Click here immediately to verify your credentials: https://security-login-update.net/auth"
    )
    return analyze_screenshot_text(detected_text)


@router.post("/batch", response_model=BatchScanResult)
async def scan_batch_endpoint(req: BatchScanRequest):
    """Scan multiple URLs in batch."""
    results = scan_batch_urls(req.items)
    malicious = sum(1 for r in results if r.verdict == "Malicious")
    safe = sum(1 for r in results if r.verdict == "Safe")
    suspicious = sum(1 for r in results if r.verdict == "Suspicious")
    
    return BatchScanResult(
        total=len(results),
        malicious=malicious,
        safe=safe,
        suspicious=suspicious,
        results=results
    )
