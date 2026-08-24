"""Case Management Service with SQLite Persistence."""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
import uuid
from backend.config import DB_PATH
from backend.schemas.intelligence import CaseRecord, CaseCreateRequest


def _init_cases_table():
    conn = sqlite3.connect(str(DB_PATH))
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cases (
                case_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_value TEXT NOT NULL,
                verdict TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                assigned_analyst TEXT NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
    conn.close()


def list_cases() -> list[CaseRecord]:
    """Retrieve all open and active forensic cases."""
    _init_cases_table()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM cases ORDER BY created_at DESC").fetchall()
    conn.close()

    cases = []
    for r in rows:
        notes_list = [n.strip() for n in r["notes"].split("||")] if r["notes"] else []
        cases.append(CaseRecord(
            case_id=r["case_id"],
            title=r["title"],
            target_type=r["target_type"],
            target_value=r["target_value"],
            verdict=r["verdict"],
            risk_score=r["risk_score"],
            status=r["status"],
            priority=r["priority"],
            assigned_analyst=r["assigned_analyst"],
            notes=notes_list,
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        ))
    
    # If no cases exist yet, seed a default demonstration case
    if not cases:
        default_case = create_case(CaseCreateRequest(
            title="Credential Phishing Attack on Executive Accounts",
            target_type="email",
            target_value="Urgent: Security Verification Required <security-update@account-verify.xyz>",
            verdict="Malicious",
            risk_score=88,
            priority="Critical",
            notes="Initial triage completed. High urgency cues and brand impersonation detected in header."
        ))
        cases.append(default_case)

    return cases


def create_case(req: CaseCreateRequest) -> CaseRecord:
    """Create a new case record."""
    _init_cases_table()
    case_num = uuid.uuid4().hex[:6].upper()
    case_id = f"TL-2026-{case_num}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    notes_str = req.notes or ""
    
    conn = sqlite3.connect(str(DB_PATH))
    with conn:
        conn.execute("""
            INSERT INTO cases 
            (case_id, title, target_type, target_value, verdict, risk_score, status, priority, assigned_analyst, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case_id,
            req.title,
            req.target_type,
            req.target_value,
            req.verdict,
            req.risk_score,
            "Open",
            req.priority,
            "Lead SOC Analyst",
            notes_str,
            now_iso,
            now_iso
        ))
    conn.close()

    return CaseRecord(
        case_id=case_id,
        title=req.title,
        target_type=req.target_type,
        target_value=req.target_value,
        verdict=req.verdict,
        risk_score=req.risk_score,
        status="Open",
        priority=req.priority,
        assigned_analyst="Lead SOC Analyst",
        notes=[notes_str] if notes_str else [],
        created_at=now_iso,
        updated_at=now_iso
    )


def update_case_status(case_id: str, new_status: str, new_note: str = None) -> bool:
    """Update status and add investigation note to case."""
    _init_cases_table()
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT notes FROM cases WHERE case_id = ?", (case_id,)).fetchone()
    if not row:
        conn.close()
        return False
        
    existing_notes = row["notes"] or ""
    if new_note:
        updated_notes = f"{existing_notes}||{new_note}" if existing_notes else new_note
    else:
        updated_notes = existing_notes

    with conn:
        conn.execute("""
            UPDATE cases SET status = ?, notes = ?, updated_at = ? WHERE case_id = ?
        """, (new_status, updated_notes, now_iso, case_id))
    conn.close()
    return True
