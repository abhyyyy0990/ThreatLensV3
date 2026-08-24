import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { Network, Server, Globe, Mail, Link2, ShieldAlert, Cpu } from 'lucide-react';

interface EntityGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary?: string;
}

export const EntityGraph: React.FC<EntityGraphProps> = ({ nodes, edges, summary }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[0] || null);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'sender':
      case 'email':
        return Mail;
      case 'domain':
        return Globe;
      case 'ip':
        return Server;
      case 'asn':
        return Cpu;
      case 'url':
        return Link2;
      case 'campaign':
        return ShieldAlert;
      default:
        return Network;
    }
  };

  const getNodeStyle = (risk: string, isSelected: boolean) => {
    let base = 'bg-surface border-border text-text-primary hover:border-slate-300';
    let badge = 'bg-slate-100 text-slate-700 border-slate-200';

    if (risk === 'critical') {
      base = 'bg-red-50/40 border-red-200 text-red-900';
      badge = 'bg-red-100 text-red-700 border-red-200';
    } else if (risk === 'high') {
      base = 'bg-red-50/20 border-red-200 text-red-800';
      badge = 'bg-red-50 text-red-700 border-red-200';
    } else if (risk === 'medium') {
      base = 'bg-amber-50/30 border-amber-200 text-amber-800';
      badge = 'bg-amber-100 text-amber-800 border-amber-200';
    } else {
      base = 'bg-blue-50/30 border-blue-200 text-blue-800';
      badge = 'bg-blue-100 text-blue-800 border-blue-200';
    }

    if (isSelected) {
      base += ' ring-2 ring-primary border-primary shadow-sm';
    }

    return { base, badge };
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <span>Infrastructure & Campaign Threat Correlation Network</span>
          </h3>
          {summary && <p className="text-xs text-text-secondary mt-1">{summary}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-primary font-semibold px-2.5 py-1 rounded-md bg-primary-subtle border border-primary-border">
            {nodes.length} NODES · {edges.length} EDGES
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Nodes Grid Canvas */}
        <div className="lg:col-span-2 bg-background-subtle p-4 rounded-xl border border-border space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode?.id === node.id;
              const { base, badge } = getNodeStyle(node.risk, isSelected);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-2.5 ${base}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-surface border border-border shadow-xs">
                        <Icon className="w-4 h-4 text-text-primary" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted block">
                          {node.type}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-primary line-clamp-1">
                          {node.label}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge}`}>
                      {node.risk}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Links visualization */}
          <div className="space-y-1.5 pt-3 border-t border-border">
            <h5 className="text-[10px] font-mono font-bold uppercase text-text-muted tracking-wider">
              Discovered Correlation Edges
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="text-[11px] bg-surface border border-border px-2.5 py-1 rounded-md text-text-secondary font-mono flex items-center gap-1.5 shadow-xs"
                >
                  <span className="font-bold text-primary">{edge.source}</span>
                  <span className="text-text-muted">--[{edge.label || edge.relation}]--&gt;</span>
                  <span className="font-bold text-text-primary">{edge.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-surface p-4.5 rounded-xl border border-border shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary border-b border-border pb-2.5">
            Entity Intelligence Inspector
          </h4>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-text-muted">Entity Identifier</span>
                <div className="font-mono font-bold text-text-primary break-all bg-background-subtle p-2.5 rounded-lg border border-border">
                  {selectedNode.label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-background-subtle border border-border">
                  <span className="text-[10px] text-text-muted font-sans block">Type</span>
                  <span className="text-primary font-bold uppercase">{selectedNode.type}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-background-subtle border border-border">
                  <span className="text-[10px] text-text-muted font-sans block">Risk Level</span>
                  <span className={`font-bold uppercase ${selectedNode.risk === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                    {selectedNode.risk}
                  </span>
                </div>
              </div>

              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-[10px] font-mono uppercase text-text-muted">Extracted Metadata</span>
                  <div className="space-y-1.5 font-mono text-[11px] bg-background-subtle p-3 rounded-lg border border-border">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-text-muted">{k}:</span>
                        <span className="text-text-primary font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-text-muted text-center py-8">
              Click any node in the correlation network to inspect threat telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
