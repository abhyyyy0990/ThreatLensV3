"""ThreatLens V3 Server Entry Point."""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("=" * 60)
    print("  ThreatLens V3 — Cyber Threat & Forensic Intelligence")
    print(f"  Serving React Frontend at: http://localhost:{port}")
    print(f"  FastAPI Backend API at:    http://localhost:{port}/api")
    print(f"  Interactive API Docs at:   http://localhost:{port}/api/docs")
    print("=" * 60)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
