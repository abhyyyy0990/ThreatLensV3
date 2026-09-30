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
    """Analyze a QR code matrix or decoded payload.

    Bug 1 fix: previously fabricated a malicious-looking URL from the filename
    when no payload was decoded. Now we only analyze an explicitly supplied
    payload; if none is provided the request is rejected with a 422.
    """
    if not payload and not file:
        raise HTTPException(
            status_code=422,
            detail="No QR payload provided. Supply a decoded URL string via 'payload' or an image file via 'file'."
        )
    # If a file was uploaded but no payload decoded yet, return a clear indication
    if file and not payload:
        raise HTTPException(
            status_code=422,
            detail="QR code image received but no payload could be decoded. "
                   "Ensure the image contains a readable QR matrix and pass the decoded text as 'payload'."
        )
    return analyze_qr_code(payload)


@router.post("/screenshot", response_model=ThreatResult)
async def scan_screenshot_endpoint(
    ocr_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Analyze screenshot or message OCR text.

    Bug 2 fix: previously substituted hardcoded phishing text when no OCR was
    provided, producing a fake result. Now we require actual OCR text or reject.
    """
    if not ocr_text:
        raise HTTPException(
            status_code=422,
            detail="No OCR text provided. Supply extracted text via 'ocr_text' field."
        )
    return analyze_screenshot_text(ocr_text)



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
