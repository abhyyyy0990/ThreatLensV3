import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { GraphCorrelationResponse } from '../types';
import { EntityGraph } from '../components/EntityGraph';
import { Network, Search, Terminal } from 'lucide-react';

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
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          <span>Graph Correlation & Threat Campaign Intelligence</span>
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Maps interconnected threat vectors, domain infrastructure, shared BGP Autonomous Systems, and multi-email campaign groupings.
        </p>
      </div>

      <div className="bg-surface border border-white/[0.08] rounded-xl p-4.5 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-text-muted block mb-1">Target Sender</label>
            <input
              type="text"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="px-3 py-1.5 bg-background border border-white/[0.08] rounded-lg text-xs font-mono text-text-primary w-64 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-text-muted block mb-1">Target Domain</label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="px-3 py-1.5 bg-background border border-white/[0.08] rounded-lg text-xs font-mono text-text-primary w-52 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        <button
          onClick={fetchGraph}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-background text-xs font-mono font-bold rounded-lg shadow-[0_0_20px_rgba(0,166,198,0.3)] transition-all flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
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
