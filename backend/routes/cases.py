"""Case Management and Forensic Reporting Endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Body
from typing import Optional, Any
from backend.schemas.intelligence import CaseRecord, CaseCreateRequest, ForensicReportResponse
from backend.services.case_service import list_cases, create_case, update_case_status
from backend.services.report_service import generate_forensic_report

router = APIRouter(prefix="/cases", tags=["Cases & Reports"])


@router.get("", response_model=list[CaseRecord])
async def get_cases_endpoint():
    """List all open and investigated cases."""
    return list_cases()


@router.post("", response_model=CaseRecord)
async def create_case_endpoint(req: CaseCreateRequest):
    """Create a new case triage record."""
    return create_case(req)


@router.post("/{case_id}/status")
async def update_status_endpoint(
    case_id: str,
    status: str = Body(..., embed=True),
    note: Optional[str] = Body(None, embed=True)
):
    """Update case lifecycle status and append notes."""
    ok = update_case_status(case_id, status, note)
    if not ok:
        raise HTTPException(status_code=404, detail="Case not found.")
    return {"status": "success", "case_id": case_id, "new_status": status}


@router.post("/report", response_model=ForensicReportResponse)
async def generate_report_endpoint(
    target_value: str = Body(..., embed=True),
    target_type: str = Body("email", embed=True),
    case_id: Optional[str] = Body(None, embed=True),
    scan_data: Optional[dict[str, Any]] = Body(None, embed=True)
):
    """Generate a printable forensic report."""
    return generate_forensic_report(
        target_value=target_value,
        target_type=target_type,
        case_id=case_id,
        scan_data=scan_data
    )
