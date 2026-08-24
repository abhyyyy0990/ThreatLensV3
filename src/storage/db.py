"""SQLite-backed scan history store for ThreatLens V3.

Stores every completed scan (URL or Email) persistently between sessions.
Schema is intentionally minimal — no user/auth columns needed for V3.

Security note:
  - DB path is inside the project directory (never /tmp or arbitrary paths).
  - All inputs are parameterised — no string interpolation in SQL.
  - Raw content (emails) is NOT stored to avoid logging sensitive data.
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "data" / "threatlens_history.db"


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist. Idempotent."""
    conn = _get_conn()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                scan_type   TEXT NOT NULL,          -- 'url' | 'email'
                input_repr  TEXT NOT NULL,          -- URL or email subject/snippet
                verdict     TEXT NOT NULL,          -- 'Malicious' | 'Safe' | 'Suspicious'
                risk_score  INTEGER NOT NULL,       -- 0-100
                confidence  TEXT NOT NULL,          -- 'High' | 'Medium' | 'Low'
                details_json TEXT,                  -- full result JSON blob
                scanned_at  TEXT NOT NULL           -- ISO-8601 UTC
            )
        """)
        # Index for fast recency queries
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_scans_scanned_at
            ON scans (scanned_at DESC)
        """)
    conn.close()


def insert_scan(
    scan_type: str,
    input_repr: str,
    verdict: str,
    risk_score: int,
    confidence: str,
    details: dict[str, Any] | None = None,
) -> int:
    """Insert a scan result. Returns the new row id."""
    init_db()
    conn = _get_conn()
    scanned_at = datetime.now(timezone.utc).isoformat()
    details_json = json.dumps(details) if details else None
    with conn:
        cur = conn.execute(
            """
            INSERT INTO scans
                (scan_type, input_repr, verdict, risk_score, confidence, details_json, scanned_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (scan_type, input_repr[:500], verdict, risk_score, confidence, details_json, scanned_at),
        )
    row_id = cur.lastrowid
    conn.close()
    return row_id


def fetch_recent(limit: int = 50) -> list[dict[str, Any]]:
    """Return the most recent scans, newest first."""
    init_db()
    conn = _get_conn()
    rows = conn.execute(
        """
        SELECT id, scan_type, input_repr, verdict, risk_score, confidence, scanned_at
        FROM scans
        ORDER BY scanned_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def fetch_stats() -> dict[str, Any]:
    """Return aggregate statistics for the dashboard."""
    init_db()
    conn = _get_conn()
    total = conn.execute("SELECT COUNT(*) FROM scans").fetchone()[0]
    malicious = conn.execute(
        "SELECT COUNT(*) FROM scans WHERE verdict = 'Malicious'"
    ).fetchone()[0]
    safe = conn.execute(
        "SELECT COUNT(*) FROM scans WHERE verdict = 'Safe'"
    ).fetchone()[0]
    suspicious = conn.execute(
        "SELECT COUNT(*) FROM scans WHERE verdict = 'Suspicious'"
    ).fetchone()[0]
    url_count = conn.execute(
        "SELECT COUNT(*) FROM scans WHERE scan_type = 'url'"
    ).fetchone()[0]
    email_count = conn.execute(
        "SELECT COUNT(*) FROM scans WHERE scan_type = 'email'"
    ).fetchone()[0]
    conn.close()
    return {
        "total": total,
        "malicious": malicious,
        "safe": safe,
        "suspicious": suspicious,
        "url_scans": url_count,
        "email_scans": email_count,
    }
