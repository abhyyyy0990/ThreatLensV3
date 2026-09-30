import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { GraphCorrelationResponse } from '../types';
import { EntityGraph } from '../components/EntityGraph';
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
    <div className="flex flex-col gap-space-lg pb-16">
      <div className="pb-space-md">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px]">hub</span>
          <span>Graph Correlation & Threat Campaign Intelligence</span>
        </h2>
        <p className="text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
          Maps interconnected threat vectors, domain infrastructure, shared BGP Autonomous Systems, and multi-email campaign groupings.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-on-surface-variant block mb-1">Target Sender</label>
            <input
              type="text"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="px-3.5 py-2 bg-surface border border-outline-variant/20 rounded-lg text-xs font-mono text-on-surface w-64 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary shadow-xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-on-surface-variant block mb-1">Target Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="px-3.5 py-2 bg-surface border border-outline-variant/20 rounded-lg text-xs font-mono text-on-surface w-52 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary shadow-xs"
            />
          </div>
        </div>

        <button
          onClick={fetchGraph}
          disabled={loading}
          className="px-5 py-2.5 bg-primary hover:opacity-90 text-on-primary text-xs font-semibold rounded-lg shadow-button transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
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
