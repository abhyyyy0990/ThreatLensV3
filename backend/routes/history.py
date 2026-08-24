"""History and Stats Endpoints."""
from __future__ import annotations

import sys
from pathlib import Path
from fastapi import APIRouter, Query

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.storage import db

router = APIRouter(tags=["History & Stats"])


@router.get("/history")
async def get_history_endpoint(limit: int = Query(50, ge=1, le=500)):
    """Retrieve recent scan history from SQLite database."""
    return db.fetch_recent(limit=limit)


@router.get("/stats")
async def get_stats_endpoint():
    """Retrieve aggregate scan statistics."""
    return db.fetch_stats()
