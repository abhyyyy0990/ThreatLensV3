"""Configuration settings for ThreatLens V3 FastAPI Backend."""
from __future__ import annotations

import os
from pathlib import Path
from pydantic import BaseModel

# Load .env so API keys are available via os.getenv() throughout the app
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)
except ImportError:
    pass  # python-dotenv not installed — rely on shell environment

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"
DB_PATH = DATA_DIR / "threatlens_history.db"

class Settings(BaseModel):
    app_name: str = "ThreatLens Cyber Intelligence Platform"
    app_version: str = "3.0.0"
    api_prefix: str = "/api"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

settings = Settings()
