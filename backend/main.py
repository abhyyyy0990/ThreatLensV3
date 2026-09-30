"""ThreatLens V3 — FastAPI Backend Server Application."""
from __future__ import annotations

import sys
from pathlib import Path
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import settings
from backend.routes import scan, intelligence, correlation, cases, history, model, auth
from backend.dependencies.auth import get_current_user

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Email Threat Intelligence & Forensic Analysis Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Public routes (no auth required) ────────────────────────────────────────
app.include_router(auth.router, prefix="/api")

# ── Protected routes (Bearer JWT required) ───────────────────────────────────
_auth = Depends(get_current_user)
app.include_router(scan.router,          prefix="/api", dependencies=[_auth])
app.include_router(intelligence.router,  prefix="/api", dependencies=[_auth])
app.include_router(correlation.router,   prefix="/api", dependencies=[_auth])
app.include_router(cases.router,         prefix="/api", dependencies=[_auth])
app.include_router(history.router,       prefix="/api", dependencies=[_auth])
app.include_router(model.router,         prefix="/api", dependencies=[_auth])


@app.get("/api/health")
async def health_check():
    """Health check probe endpoint — public, no auth required."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "ml_model": "RandomForest v001 (Isotonic Calibrated)",
    }


# Mount frontend static distribution if built
frontend_dist = ROOT_DIR / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler returning structured error response."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": request.url.path,
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
