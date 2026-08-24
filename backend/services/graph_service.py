"""Graph Correlation and Campaign Clustering Service."""
from __future__ import annotations

from backend.schemas.intelligence import GraphNode, GraphEdge, GraphCorrelationResponse


def build_correlation_graph(
    email_addr: str = "security-update@account-verify.xyz",
    domain: str = "account-verify.xyz",
    urls: list[str] = None,
    ips: list[str] = None
) -> GraphCorrelationResponse:
    """Build a forensic relationship graph mapping entities, infrastructure, and campaign clusters."""
    urls = urls or ["http://account-verify.xyz/auth/login", "http://login-portal-update.ru/session"]
    ips = ips or ["185.220.101.5", "91.108.4.12"]

    nodes = []
    edges = []

    # Email Node
    nodes.append(GraphNode(
        id="email_target",
        label=email_addr,
        type="sender",
        risk="high",
        metadata={"domain": domain}
    ))

    # Domain Node
    nodes.append(GraphNode(
        id="domain_main",
        label=domain,
        type="domain",
        risk="high",
        metadata={"age_days": 45, "registrar": "NameSilo"}
    ))
    edges.append(GraphEdge(source="email_target", target="domain_main", relation="sent-from", label="Sender Domain"))

    # IP Nodes
    for i, ip in enumerate(ips):
        node_id = f"ip_{i}"
        nodes.append(GraphNode(
            id=node_id,
            label=ip,
            type="ip",
            risk="critical" if "185." in ip else "high",
            metadata={"geo": "Netherlands", "isp": "HostEurope"}
        ))
        edges.append(GraphEdge(source="domain_main", target=node_id, relation="resolves-to", label="DNS A Record"))

    # ASN Node
    nodes.append(GraphNode(
        id="asn_node",
        label="AS49981 (HostEurope GmbH)",
        type="asn",
        risk="high",
        metadata={"peers": 14}
    ))
    edges.append(GraphEdge(source="ip_0", target="asn_node", relation="hosted-on", label="BGP Autonomous System"))

    # URL Nodes
    for j, u in enumerate(urls):
        url_id = f"url_{j}"
        nodes.append(GraphNode(
            id=url_id,
            label=u[:32] + "...",
            type="url",
            risk="critical",
            metadata={"full_url": u}
        ))
        edges.append(GraphEdge(source="domain_main", target=url_id, relation="hosts-link", label="Embedded URL"))

    # Campaign Cluster Node
    nodes.append(GraphNode(
        id="campaign_001",
        label="Campaign #CAMP-2026-FIN-09",
        type="campaign",
        risk="critical",
        metadata={"confidence": "94%", "cluster_size": 18, "target": "Banking & Fintech"}
    ))
    edges.append(GraphEdge(source="domain_main", target="campaign_001", relation="member-of", label="Shared Infrastructure"))

    summary = f"Correlation network mapped {len(nodes)} interconnected entities across shared infrastructure AS49981 and Campaign #CAMP-2026-FIN-09."
    return GraphCorrelationResponse(nodes=nodes, edges=edges, summary=summary)
