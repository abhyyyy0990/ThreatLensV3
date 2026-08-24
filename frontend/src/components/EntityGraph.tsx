import React from 'react';
import { GraphNode, GraphEdge } from '../types';
import { Network, Server, Globe, Mail, Link2, ShieldAlert, Cpu } from 'lucide-react';

interface EntityGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary?: string;
}

export const EntityGraph: React.FC<EntityGraphProps> = ({ nodes, edges, summary }) => {
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

  const getNodeColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-error-container text-error border-error';
      case 'high':
        return 'bg-error/10 text-error border-error/50';
      case 'medium':
        return 'bg-amber-100 text-amber-900 border-amber-400';
      default:
        return 'bg-primary/10 text-primary border-primary/40';
    }
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <span>Infrastructure & Campaign Correlation Network</span>
          </h3>
          {summary && <p className="text-xs text-on-surface-variant mt-1">{summary}</p>}
        </div>
        <span className="text-[11px] font-semibold text-outline px-2 py-1 rounded bg-surface-container-low border border-outline-variant">
          {nodes.length} Nodes · {edges.length} Relationships
        </span>
      </div>

      {/* Visual Graph Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/60">
        {nodes.map((node) => {
          const Icon = getNodeIcon(node.type);
          const colorClass = getNodeColor(node.risk);

          return (
            <div
              key={node.id}
              className={`p-3.5 rounded-lg border shadow-xs bg-white flex flex-col justify-between space-y-2 transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md border ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
                      {node.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-on-surface line-clamp-1">
                      {node.label}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colorClass}`}
                >
                  {node.risk}
                </span>
              </div>

              {node.metadata && Object.keys(node.metadata).length > 0 && (
                <div className="pt-2 border-t border-outline-variant/40 text-[10px] text-outline font-mono grid grid-cols-2 gap-1">
                  {Object.entries(node.metadata).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-on-surface-variant">{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Relationship Edges Summary */}
      <div className="space-y-1.5 pt-2">
        <h4 className="text-[11px] font-bold uppercase text-outline tracking-wider">
          Correlation Links
        </h4>
        <div className="flex flex-wrap gap-2">
          {edges.map((edge, idx) => (
            <div
              key={idx}
              className="text-[11px] bg-surface-container-low border border-outline-variant px-2.5 py-1 rounded-md text-on-surface-variant font-mono flex items-center gap-1.5"
            >
              <span className="font-bold text-primary">{edge.source}</span>
              <span className="text-outline">--[{edge.label || edge.relation}]--&gt;</span>
              <span className="font-bold text-on-surface">{edge.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
