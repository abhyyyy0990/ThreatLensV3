import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { GraphCorrelationResponse } from '../types';
import { EntityGraph } from '../components/EntityGraph';
import { Network, Search } from 'lucide-react';

export const GraphView: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphCorrelationResponse | null>(null);
  const [targetEmail, setTargetEmail] = useState('security-update@account-verify.xyz');
  const [targetDomain, setTargetDomain] = useState('account-verify.xyz');
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCorrelationGraph(targetEmail, targetDomain);
      setGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
          <Network className="w-6 h-6 text-primary" />
          <span>Graph Correlation & Threat Campaign Intelligence</span>
        </h2>
        <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
          Maps interconnected threat vectors, domain infrastructure, shared BGP Autonomous Systems, and multi-email campaign groupings.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-text-muted block mb-1">Target Sender</label>
            <input
              type="text"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="px-3.5 py-2 bg-surface border border-border rounded-lg text-xs font-mono text-text-primary w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-text-muted block mb-1">Target Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="px-3.5 py-2 bg-surface border border-border rounded-lg text-xs font-mono text-text-primary w-52 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        <button
          onClick={fetchGraph}
          disabled={loading}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-button transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Reconstructing...' : 'Re-correlate Graph'}</span>
        </button>
      </div>

      {graphData && (
        <EntityGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          summary={graphData.summary}
        />
      )}
    </div>
  );
};
