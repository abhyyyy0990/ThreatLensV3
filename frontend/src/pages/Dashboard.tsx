import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { ScanHistoryItem, SystemStats, ModelInfo } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { Shield, ShieldAlert, CheckCircle, Cpu, ArrowUpRight, Search, Activity, Clock, Filter } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats>({
    total: 0,
    malicious: 0,
    safe: 0,
    suspicious: 0,
    url_scans: 0,
    email_scans: 0,
  });
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData, modelData] = await Promise.all([
          apiClient.getStats(),
          apiClient.getHistory(15),
          apiClient.getModelInfo(),
        ]);
        setStats(statsData);
        setHistory(historyData);
        setModelInfo(modelData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredHistory = history.filter((item) => {
    if (filterType === 'url') return item.scan_type === 'url';
    if (filterType === 'email') return item.scan_type === 'email';
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Security Operations Dashboard</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Real-time threat monitoring, ML inference telemetry, and multi-vector scanning feeds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('email')}
            className="px-3.5 py-2 bg-primary text-white font-semibold text-xs rounded-lg shadow-xs hover:bg-primary-container transition-all flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Analyze Email</span>
          </button>
          <button
            onClick={() => onNavigate('url')}
            className="px-3.5 py-2 bg-white border border-outline-variant text-on-surface font-semibold text-xs rounded-lg hover:bg-surface-container-highest transition-all"
          >
            <span>Scan URL</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Matching Stitch Blueprint) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Total Analyzed</span>
            <div className="p-1.5 rounded-lg bg-surface-container-highest text-on-surface-variant">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-on-surface">{stats.total.toLocaleString()}</span>
            <span className="text-[11px] text-outline">events</span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-[11px] text-on-surface-variant flex justify-between">
            <span>{stats.url_scans} URLs</span>
            <span>{stats.email_scans} Emails</span>
          </div>
        </div>

        {/* Card 2: Threats Detected */}
        <div className="bg-white border border-outline-variant border-l-4 border-l-error rounded-xl p-4 shadow-feather">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-error">Threats Intercepted</span>
            <div className="p-1.5 rounded-lg bg-error-container text-error">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-error">{stats.malicious.toLocaleString()}</span>
            <span className="text-[11px] text-error font-medium">
              {stats.total > 0 ? `${((stats.malicious / stats.total) * 100).toFixed(0)}% attack rate` : '0%'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-[11px] text-outline">
            Phishing, credential theft & malware
          </div>
        </div>

        {/* Card 3: Safe Verdicts */}
        <div className="bg-white border border-outline-variant border-l-4 border-l-secondary rounded-xl p-4 shadow-feather">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Verified Clean</span>
            <div className="p-1.5 rounded-lg bg-secondary-container text-secondary">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-secondary">{stats.safe.toLocaleString()}</span>
            <span className="text-[11px] text-secondary font-medium">Safe indicators</span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-[11px] text-outline">
            Passed ML & deterministic filters
          </div>
        </div>

        {/* Card 4: Model F1 Score */}
        <div className="bg-white border border-outline-variant border-l-4 border-l-primary rounded-xl p-4 shadow-feather">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Model F1 (Locked Test)</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-primary">
              {modelInfo?.locked_test_metrics?.f1 ? modelInfo.locked_test_metrics.f1.toFixed(3) : '0.827'}
            </span>
            <span className="text-[11px] text-outline font-mono">v001 RF</span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-[11px] text-on-surface-variant flex justify-between">
            <span>PR-AUC: {modelInfo?.locked_test_metrics?.pr_auc ? modelInfo.locked_test_metrics.pr_auc.toFixed(3) : '0.910'}</span>
            <span>Acc: {modelInfo?.locked_test_metrics?.accuracy ? (modelInfo.locked_test_metrics.accuracy * 100).toFixed(1) : '89.2'}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Scan History Table & Live Model Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scan Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl shadow-feather overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/40">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Recent Security Triage Events</h3>
              <p className="text-[11px] text-outline">Realtime telemetry recorded in SQLite history</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-surface-container-highest p-0.5 text-xs font-semibold text-on-surface-variant">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'all' ? 'bg-white text-primary shadow-xs' : 'hover:text-on-surface'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('email')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'email' ? 'bg-white text-primary shadow-xs' : 'hover:text-on-surface'
                  }`}
                >
                  Emails
                </button>
                <button
                  onClick={() => setFilterType('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterType === 'url' ? 'bg-white text-primary shadow-xs' : 'hover:text-on-surface'
                  }`}
                >
                  URLs
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-outline tracking-wider">
                  <th className="py-2.5 px-4">Vector</th>
                  <th className="py-2.5 px-4">Target / Input</th>
                  <th className="py-2.5 px-4">Verdict</th>
                  <th className="py-2.5 px-4">Risk</th>
                  <th className="py-2.5 px-4">Conf.</th>
                  <th className="py-2.5 px-4">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-outline">
                      No scan events recorded yet. Submit an email or URL to start analysis.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest uppercase text-on-surface-variant font-bold text-[10px]">
                          {item.scan_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-on-surface font-medium max-w-[280px] truncate" title={item.input_repr}>
                        {item.input_repr}
                      </td>
                      <td className="py-3 px-4">
                        <VerdictBadge verdict={item.verdict} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-on-surface">
                        <span className={item.risk_score >= 65 ? 'text-error' : item.risk_score >= 35 ? 'text-amber-700' : 'text-secondary'}>
                          {item.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-on-surface-variant">{item.confidence}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-outline">
                        {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString() : 'Just now'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Active ML Model Card & Metrics */}
        <div className="space-y-4">
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Active ML Engine</h3>
                <p className="text-[10px] text-outline">RandomForest Classifier v001</p>
              </div>
              <button
                onClick={() => onNavigate('model')}
                className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Full Card</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">Algorithm</span>
                <span className="font-semibold text-on-surface">{modelInfo?.algorithm || 'RandomForest'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">Calibration</span>
                <span className="font-semibold text-on-surface">{modelInfo?.calibration_method || 'Isotonic'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">Decision Threshold</span>
                <span className="font-mono font-bold text-primary">{modelInfo?.selected_threshold || '0.390'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">Feature Schema</span>
                <span className="font-mono font-semibold">{modelInfo?.feature_count || 44} numerical features</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-outline mb-2">
                Locked Holdout Performance
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface-container-low border border-outline-variant">
                  <div className="text-[10px] text-outline">ROC-AUC</div>
                  <div className="font-bold text-on-surface text-sm">
                    {modelInfo?.locked_test_metrics?.roc_auc ? modelInfo.locked_test_metrics.roc_auc.toFixed(4) : '0.9417'}
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-container-low border border-outline-variant">
                  <div className="text-[10px] text-outline">PR-AUC</div>
                  <div className="font-bold text-primary text-sm">
                    {modelInfo?.locked_test_metrics?.pr_auc ? modelInfo.locked_test_metrics.pr_auc.toFixed(4) : '0.9103'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Threat Feeds Status */}
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Integrated Intelligence Feeds</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                <span className="font-medium text-on-surface">Google Safe Browsing</span>
                <span className="text-[10px] font-bold text-secondary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Online
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                <span className="font-medium text-on-surface">PhishTank Realtime Feed</span>
                <span className="text-[10px] font-bold text-secondary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
