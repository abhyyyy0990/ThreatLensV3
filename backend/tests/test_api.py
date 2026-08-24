"""Automated integration tests for FastAPI backend."""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app


@pytest.mark.anyio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"


@pytest.mark.anyio
async def test_url_scan_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/scan/url", json={"url": "http://google.com", "save_history": False})
        assert res.status_code == 200
        data = res.json()
        assert "verdict" in data
        assert "risk_score" in data
        assert "probability" in data
        assert data["verdict"] in ["Safe", "Malicious", "Suspicious"]


@pytest.mark.anyio
async def test_email_scan_endpoint():
    raw_email = """From: security-update@account-verify.xyz
Subject: Urgent: Verify Your Account
To: target@company.com

Dear user, please click http://malicious-login-portal.net/auth to verify your credentials.
"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/scan/email", json={"raw_email": raw_email, "save_history": False})
        assert res.status_code == 200
        data = res.json()
        assert data["verdict"] in ["Malicious", "Suspicious", "Safe"]
        assert len(data["extracted_urls"]) >= 1
        assert "auth_results" in data
        assert "nlp_signals" in data
        assert "relay_path" in data


@pytest.mark.anyio
async def test_model_info_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/model/info")
        assert res.status_code == 200
        data = res.json()
        assert "algorithm" in data
        assert "locked_test_metrics" in data


@pytest.mark.anyio
async def test_history_and_stats_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_stats = await ac.get("/api/stats")
        assert res_stats.status_code == 200
        res_hist = await ac.get("/api/history?limit=5")
        assert res_hist.status_code == 200


@pytest.mark.anyio
async def test_intelligence_and_cases_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_ip = await ac.get("/api/intelligence/ip/185.220.101.5")
        assert res_ip.status_code == 200
        assert res_ip.json()["country"] == "Netherlands"

        res_dom = await ac.get("/api/intelligence/domain/login-verify.xyz")
        assert res_dom.status_code == 200

        res_cases = await ac.get("/api/cases")
        assert res_cases.status_code == 200
