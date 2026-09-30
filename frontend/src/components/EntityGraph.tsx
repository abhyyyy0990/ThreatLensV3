import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../types';

interface EntityGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary?: string;
}

function nodeIconName(type: string): string {
  switch (type) {
    case 'sender':
    case 'email':    return 'mail';
    case 'domain':   return 'language';
    case 'ip':       return 'dns';
    case 'asn':      return 'memory';
    case 'url':      return 'link';
    case 'campaign': return 'gpp_maybe';
    default:         return 'hub';
  }
}

function getNodeStyle(risk: string, isSelected: boolean) {
  let base = 'bg-surface border-outline-variant/20 text-on-surface hover:border-secondary/40';
  let badge = 'bg-surface-container text-on-surface-variant border-outline-variant/30';

  if (risk === 'critical') {
    base = 'bg-error-container/20 border-error/30 text-on-error-container';
    badge = 'bg-error-container text-on-error-container border-error/40';
  } else if (risk === 'high') {
    base = 'bg-error-container/10 border-error/20 text-on-error-container';
    badge = 'bg-error-container/60 text-on-error-container border-error/20';
  } else if (risk === 'medium') {
    base = 'bg-amber-50/30 border-amber-200 text-amber-800';
    badge = 'bg-amber-100 text-amber-800 border-amber-200';
  } else {
    base = 'bg-secondary-fixed/20 border-secondary/20 text-on-surface';
    badge = 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed/40';
  }

  if (isSelected) {
    base += ' ring-2 ring-secondary border-secondary shadow-sm';
  }
  return { base, badge };
}

export const EntityGraph: React.FC<EntityGraphProps> = ({ nodes, edges, summary }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[0] || null);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-outline-variant/20 pb-space-md">
        <div>
          <h3 className="text-[14px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">hub</span>
            <span>Infrastructure &amp; Campaign Threat Correlation Network</span>
          </h3>
          {summary && <p className="text-[13px] text-on-surface-variant mt-1">{summary}</p>}
        </div>
        <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed">
          {nodes.length} NODES · {edges.length} EDGES
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        {/* Nodes Grid */}
        <div className="lg:col-span-2 bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 flex flex-col gap-space-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const { base, badge } = getNodeStyle(node.risk, isSelected);
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-space-md rounded-xl border cursor-pointer transition-all duration-150 flex flex-col gap-space-sm ${base}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 shadow-xs">
                        <span className="material-symbols-outlined text-[16px] text-on-surface">{nodeIconName(node.type)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-on-surface-variant block">{node.type}</span>
                        <span className="font-mono text-[12px] font-bold text-on-surface line-clamp-1">{node.label}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge}`}>{node.risk}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edges list */}
          <div className="flex flex-col gap-1 pt-space-sm border-t border-outline-variant/20">
            <h5 className="text-[10px] font-mono font-bold uppercase text-on-surface-variant tracking-wider">Correlation Edges</h5>
            <div className="flex flex-wrap gap-1.5">
              {edges.map((edge, idx) => (
                <div key={idx} className="text-[11px] bg-surface-container border border-outline-variant/20 px-2.5 py-1 rounded-md text-on-surface-variant font-mono flex items-center gap-1.5">
                  <span className="font-bold text-secondary">{edge.source}</span>
                  <span className="text-outline">→</span>
                  <span className="text-on-surface-variant">[{edge.label || edge.relation}]</span>
                  <span className="text-outline">→</span>
                  <span className="font-bold text-on-surface">{edge.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 flex flex-col gap-space-md">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface border-b border-outline-variant/20 pb-space-sm">Entity Intelligence Inspector</h4>
          {selectedNode ? (
            <div className="flex flex-col gap-space-md text-[12px]">
              <div>
                <span className="text-[10px] font-mono uppercase text-on-surface-variant">Entity Identifier</span>
                <div className="font-mono font-bold text-on-surface break-all bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/20 mt-1">{selectedNode.label}</div>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-[10px] text-on-surface-variant block">Type</span>
                  <span className="text-secondary font-bold uppercase">{selectedNode.type}</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                  <span className="text-[10px] text-on-surface-variant block">Risk</span>
                  <span className={`font-bold uppercase ${selectedNode.risk === 'critical' ? 'text-error' : 'text-amber-700'}`}>{selectedNode.risk}</span>
                </div>
              </div>
              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">Extracted Metadata</span>
                  <div className="font-mono text-[11px] bg-surface-container-lowest p-space-sm rounded-lg border border-outline-variant/20 flex flex-col gap-1">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-on-surface-variant">{k}:</span>
                        <span className="text-on-surface font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[12px] text-on-surface-variant text-center py-8">Click any node to inspect threat telemetry.</div>
          )}
        </div>
      </div>
    </div>
  );
};
