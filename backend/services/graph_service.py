"""Graph Correlation and Campaign Clustering Service.

Bug 8 fix: Previously always returned the same hardcoded demo graph regardless
of the input parameters (email_addr, domain, urls, ips).  This version builds
the graph from the actual supplied parameters so different inputs produce
different, accurate graphs.
"""
from __future__ import annotations

from backend.schemas.intelligence import GraphNode, GraphEdge, GraphCorrelationResponse


def build_correlation_graph(
    email_addr: str = "",
    domain: str = "",
    urls: list[str] | None = None,
    ips: list[str] | None = None
) -> GraphCorrelationResponse:
    """Build a forensic relationship graph from the supplied indicators.

    Args:
        email_addr: Sender / subject email address.
        domain:     Primary domain being correlated.
        urls:       List of URLs to add as nodes.
        ips:        List of IP addresses to add as nodes.

    Returns:
        GraphCorrelationResponse with nodes, edges, and a summary sentence.
    """
    urls = urls or []
    ips = ips or []

    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    # ── Sender / email node ──────────────────────────────────────────────────
    if email_addr:
        nodes.append(GraphNode(
            id="email_target",
            label=email_addr,
            type="sender",
            risk="high",
            metadata={"domain": domain or "unknown"}
        ))

    # ── Domain node ─────────────────────────────────────────────────────────
    if domain:
        nodes.append(GraphNode(
            id="domain_main",
            label=domain,
            type="domain",
            risk="high",
            metadata={"source": "supplied_indicator"}
        ))
        if email_addr:
            edges.append(GraphEdge(
                source="email_target",
                target="domain_main",
                relation="sent-from",
                label="Sender Domain"
            ))

    # ── IP nodes ─────────────────────────────────────────────────────────────
    for i, ip in enumerate(ips):
        node_id = f"ip_{i}"
        risk_level = "critical" if ip.startswith("185.") else "high"
        nodes.append(GraphNode(
            id=node_id,
            label=ip,
            type="ip",
            risk=risk_level,
            metadata={"source": "supplied_indicator"}
        ))
        if domain:
            edges.append(GraphEdge(
                source="domain_main",
                target=node_id,
                relation="resolves-to",
                label="DNS A Record"
            ))
        elif email_addr:
            edges.append(GraphEdge(
                source="email_target",
                target=node_id,
                relation="connected-to",
                label="SMTP Relay"
            ))

    # ── URL nodes ─────────────────────────────────────────────────────────────
    for j, u in enumerate(urls):
        url_id = f"url_{j}"
        nodes.append(GraphNode(
            id=url_id,
            label=u[:48] + ("..." if len(u) > 48 else ""),
            type="url",
            risk="critical",
            metadata={"full_url": u}
        ))
        if domain:
            edges.append(GraphEdge(
                source="domain_main",
                target=url_id,
                relation="hosts-link",
                label="Embedded URL"
            ))
        elif email_addr:
            edges.append(GraphEdge(
                source="email_target",
                target=url_id,
                relation="contains-link",
                label="Embedded URL"
            ))

    # ── Empty input guard ────────────────────────────────────────────────────
    if not nodes:
        nodes.append(GraphNode(
            id="placeholder",
            label="No indicators supplied",
            type="domain",
            risk="low",
            metadata={}
        ))

    summary = (
        f"Correlation network mapped {len(nodes)} interconnected indicator entities "
        f"({len(ips)} IPs, {len(urls)} URLs) across the submitted investigation scope."
    )
    return GraphCorrelationResponse(nodes=nodes, edges=edges, summary=summary)
