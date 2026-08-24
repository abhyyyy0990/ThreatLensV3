import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { GraphCorrelationResponse } from '../types';
import { EntityGraph } from '../components/EntityGraph';
import { Network, Search, Filter, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          <span>Graph Correlation & Campaign Cluster Intelligence</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Maps interconnected threat vectors, domain infrastructure, shared BGP Autonomous Systems, and multi-email campaign groupings.
        </p>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-outline block mb-1">Target Sender</label>
            <input
              type="text"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono w-64"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-outline block mb-1">Target Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono w-52"
            />
          </div>
        </div>

        <button
          onClick={fetchGraph}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{loading ? 'Reconstructing Graph...' : 'Re-correlate Infrastructure'}</span>
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
