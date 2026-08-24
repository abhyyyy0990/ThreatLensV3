import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { Network, Server, Globe, Mail, Link2, ShieldAlert, Cpu, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

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
    let base = 'bg-surface border-white/[0.08] text-text-primary';
    let badge = 'bg-white/5 text-text-muted border-white/10';

    if (risk === 'critical') {
      base = 'bg-rose-500/[0.08] border-rose-500/40 text-rose-400';
      badge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    } else if (risk === 'high') {
      base = 'bg-rose-500/[0.05] border-rose-500/30 text-rose-300';
      badge = 'bg-rose-500/15 text-rose-300 border-rose-500/20';
    } else if (risk === 'medium') {
      base = 'bg-amber-500/[0.06] border-amber-500/30 text-amber-300';
      badge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    } else {
      base = 'bg-cyan-500/[0.05] border-cyan-500/30 text-cyan-300';
      badge = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20';
    }

    if (isSelected) {
      base += ' ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(0,166,198,0.25)]';
    }

    return { base, badge };
  };

  return (
    <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <span>Infrastructure & Campaign Threat Correlation Network</span>
          </h3>
          {summary && <p className="text-xs text-text-secondary mt-1">{summary}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-400 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
            {nodes.length} NODES · {edges.length} EDGES
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Nodes Grid Canvas */}
        <div className="lg:col-span-2 bg-background-secondary p-4 rounded-xl border border-white/[0.06] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode?.id === node.id;
              const { base, badge } = getNodeStyle(node.risk, isSelected);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between space-y-2 ${base}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-background border border-white/10">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-70 block">
                          {node.type}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-primary line-clamp-1">
                          {node.label}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge}`}>
                      {node.risk}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Links visualization */}
          <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
            <h5 className="text-[10px] font-mono font-bold uppercase text-text-muted tracking-wider">
              Discovered Correlation Edges
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {edges.map((edge, idx) => (
                <div
                  key={idx}
                  className="text-[10px] bg-surface-elevated border border-white/[0.06] px-2.5 py-1 rounded text-text-secondary font-mono flex items-center gap-1.5"
                >
                  <span className="font-bold text-cyan-400">{edge.source}</span>
                  <span className="text-text-muted">--[{edge.label || edge.relation}]--&gt;</span>
                  <span className="font-bold text-text-primary">{edge.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-surface-elevated p-4 rounded-xl border border-white/[0.06] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary border-b border-white/[0.06] pb-2">
            Entity Intelligence Inspector
          </h4>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-text-muted">Entity Identifier</span>
                <div className="font-mono font-bold text-text-primary break-all bg-background p-2 rounded border border-white/[0.06]">
                  {selectedNode.label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-background border border-white/[0.06]">
                  <span className="text-[10px] text-text-muted font-sans block">Type</span>
                  <span className="text-cyan-400 font-bold uppercase">{selectedNode.type}</span>
                </div>
                <div className="p-2 rounded bg-background border border-white/[0.06]">
                  <span className="text-[10px] text-text-muted font-sans block">Risk Rating</span>
                  <span className={`font-bold uppercase ${selectedNode.risk === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {selectedNode.risk}
                  </span>
                </div>
              </div>

              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-text-muted">Extracted Metadata</span>
                  <div className="space-y-1 font-mono text-[11px] bg-background p-2.5 rounded border border-white/[0.06]">
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
              Click any node in the correlation canvas to inspect threat signals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
