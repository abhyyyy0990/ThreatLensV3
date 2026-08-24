"""Correlation and Graph Endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Optional
from backend.schemas.intelligence import GraphCorrelationResponse
from backend.services.graph_service import build_correlation_graph

router = APIRouter(prefix="/correlation", tags=["Correlation"])


@router.get("/graph", response_model=GraphCorrelationResponse)
async def get_graph_endpoint(
    email: Optional[str] = Query("security-update@account-verify.xyz"),
    domain: Optional[str] = Query("account-verify.xyz")
):
    """Retrieve node-edge relationship graph for entity correlation."""
    return build_correlation_graph(email_addr=email, domain=domain)
