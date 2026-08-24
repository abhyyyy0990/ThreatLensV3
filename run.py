"""ThreatLens V3 Server Entry Point."""
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("  ThreatLens V3 — Cyber Threat & Forensic Intelligence")
    print("  Serving React Frontend at: http://localhost:8000")
    print("  FastAPI Backend API at:    http://localhost:8000/api")
    print("  Interactive API Docs at:   http://localhost:8000/api/docs")
    print("=" * 60)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
