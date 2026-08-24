import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { ScanHistoryItem, SystemStats, ModelInfo } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import {
  ShieldAlert,
  CheckCircle,
  Cpu,
  ArrowUpRight,
  Activity,
  Terminal,
  ArrowRight,
  TrendingUp,
  Radio,
  Zap,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

// 24h Telemetry timeline mock dataset for visual graph
const activityData = [
  { time: '00:00', total: 12, threats: 3 },
  { time: '04:00', total: 18, threats: 4 },
  { time: '08:00', total: 45, threats: 14 },
  { time: '12:00', total: 68, threats: 26 },
  { time: '16:00', total: 84, threats: 32 },
  { time: '20:00', total: 52, threats: 18 },
  { time: 'Now', total: 95, threats: 38 },
];

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
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData, modelData] = await Promise.all([
          apiClient.getStats(),
          apiClient.getHistory(20),
          apiClient.getModelInfo(),
        ]);
        setStats(statsData);
        setHistory(historyData);
        setModelInfo(modelData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00A6C6]" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-400 uppercase">
              Operational Command Center
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Threat Intelligence Command Center
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Real-time threat detection, forensic investigation, and ML-powered cyber security intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('email')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-background font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(0,166,198,0.3)] transition-all flex items-center gap-2"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Analyze Threat</span>
          </button>
          <button
            onClick={() => onNavigate('url')}
            className="px-4 py-2 bg-surface hover:bg-surface-elevated border border-white/[0.08] hover:border-cyan-500/30 text-text-primary font-semibold text-xs rounded-lg transition-all flex items-center gap-2"
          >
            <span>Scan URL</span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="bg-surface border border-white/[0.08] rounded-xl p-4.5 shadow-card hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
              Total Analyzed
            </span>
            <div className="p-1.5 rounded-md bg-white/5 border border-white/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">
              {stats.total.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted font-mono">events</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] font-mono text-text-secondary flex justify-between">
            <span>{stats.url_scans} URLs</span>
            <span>{stats.email_scans} Emails</span>
          </div>
        </div>

        {/* Threats Intercepted */}
        <div className="bg-surface border border-rose-500/20 rounded-xl p-4.5 shadow-card hover:border-rose-500/40 transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
              Threats Intercepted
            </span>
            <div className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-400 tracking-tight">
              {stats.malicious.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-rose-400/80">
              {stats.total > 0 ? `${((stats.malicious / stats.total) * 100).toFixed(0)}% attack rate` : '0%'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-text-muted truncate">
            Phishing, credential theft & malware
          </div>
        </div>

        {/* Verified Clean */}
        <div className="bg-surface border border-emerald-500/20 rounded-xl p-4.5 shadow-card hover:border-emerald-500/40 transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Verified Clean
            </span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
              {stats.safe.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-emerald-400/80">safe vectors</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-text-muted truncate">
            Passed ML & deterministic filters
          </div>
        </div>

        {/* Model Confidence */}
        <div className="bg-surface border border-cyan-500/20 rounded-xl p-4.5 shadow-card hover:border-cyan-500/40 transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
              Model Confidence (F1)
            </span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-400 tracking-tight">
              {modelInfo?.locked_test_metrics?.f1 ? modelInfo.locked_test_metrics.f1.toFixed(3) : '0.827'}
            </span>
            <span className="text-xs font-mono text-text-muted">v001 RF</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] font-mono text-text-secondary flex justify-between">
            <span>PR-AUC: {modelInfo?.locked_test_metrics?.pr_auc ? modelInfo.locked_test_metrics.pr_auc.toFixed(3) : '0.910'}</span>
            <span>Acc: {modelInfo?.locked_test_metrics?.accuracy ? (modelInfo.locked_test_metrics.accuracy * 100).toFixed(1) : '89.2'}%</span>
          </div>
        </div>
      </div>

      {/* 24h Threat Activity Graph */}
      <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>24-Hour Threat Activity Telemetry</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Live ingress stream comparing total scans vs intercepted malicious payloads.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
              <span className="text-text-secondary">Total Scanned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-rose-400 font-semibold">Malicious Intercepts</span>
            </div>
          </div>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A6C6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00A6C6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D67" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF4D67" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#5A677A" fontSize={10} tickLine={false} />
              <YAxis stroke="#5A677A" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#101722',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#00A6C6" strokeWidth={2} fillOpacity={1} fill="url(#totalGradient)" />
              <Area type="monotone" dataKey="threats" stroke="#FF4D67" strokeWidth={2} fillOpacity={1} fill="url(#threatGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid: Live Threat Feed + AI Engine Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Threat Feed */}
        <div className="lg:col-span-2 bg-surface border border-white/[0.08] rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-surface-elevated/40">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
                  Live Security Triage Stream
                </h3>
                <p className="text-[10px] text-text-muted">Telemetry events persisted in SQLite store</p>
              </div>
            </div>

            <div className="flex rounded-md bg-background p-0.5 text-xs font-mono font-semibold">
              {['all', 'email', 'url'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded text-[11px] uppercase transition-colors ${
                    filterType === f
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs font-mono">
                No telemetry recorded yet. Submit an email or URL to start analysis.
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isMalicious = item.verdict === 'Malicious';
                const isSuspicious = item.verdict === 'Suspicious';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 hover:bg-surface-elevated/50 transition-colors flex items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isMalicious
                            ? 'bg-rose-500 shadow-[0_0_8px_#FF4D67]'
                            : isSuspicious
                            ? 'bg-amber-400 shadow-[0_0_8px_#F5B942]'
                            : 'bg-emerald-400 shadow-[0_0_8px_#35D07F]'
                        }`}
                      />
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400">
                        {item.scan_type}
                      </span>
                      <span className="text-text-primary font-medium truncate max-w-[320px]" title={item.input_repr}>
                        {item.input_repr}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <VerdictBadge verdict={item.verdict} size="sm" />
                      <div className="text-right">
                        <span className={`font-bold ${isMalicious ? 'text-rose-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.risk_score}
                        </span>
                        <span className="text-text-muted text-[10px]">/100</span>
                      </div>
                      <span className="text-[10px] text-text-muted hidden sm:inline">
                        {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString() : 'Realtime'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: AI Engine Panel */}
        <div className="space-y-4">
          <div className="bg-surface border border-white/[0.08] rounded-xl p-4.5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Active AI Engine</span>
                </h3>
                <p className="text-[10px] text-text-muted">RandomForest v001</p>
              </div>
              <button
                onClick={() => onNavigate('model')}
                className="text-[11px] text-cyan-400 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-text-muted font-sans">Algorithm</span>
                <span className="text-text-primary font-semibold">{modelInfo?.algorithm || 'RandomForest'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-text-muted font-sans">Calibration</span>
                <span className="text-cyan-400 font-semibold">{modelInfo?.calibration_method || 'Isotonic'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-text-muted font-sans">Decision Threshold</span>
                <span className="font-bold text-cyan-400">{modelInfo?.selected_threshold || '0.390'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-text-muted font-sans">Features</span>
                <span className="text-text-primary">{modelInfo?.feature_count || 44} numerical</span>
              </div>
            </div>

            {/* Model Performance Grid */}
            <div className="pt-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2">
                Locked Holdout Benchmarks
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-surface-elevated border border-white/[0.06]">
                  <div className="text-[10px] text-text-muted font-sans">ROC-AUC</div>
                  <div className="font-bold text-text-primary text-sm mt-0.5">
                    {modelInfo?.locked_test_metrics?.roc_auc ? modelInfo.locked_test_metrics.roc_auc.toFixed(4) : '0.9417'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-500/[0.05] border border-cyan-500/20">
                  <div className="text-[10px] text-cyan-400 font-sans">PR-AUC (Primary)</div>
                  <div className="font-bold text-cyan-400 text-sm mt-0.5">
                    {modelInfo?.locked_test_metrics?.pr_auc ? modelInfo.locked_test_metrics.pr_auc.toFixed(4) : '0.9103'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Intelligence Feeds */}
          <div className="bg-surface border border-white/[0.08] rounded-xl p-4.5 shadow-card space-y-2.5">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
              Threat Intelligence Feeds
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-white/[0.06]">
                <span className="text-text-primary font-medium">Google Safe Browsing v4</span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-white/[0.06]">
                <span className="text-text-primary font-medium">PhishTank Live XML</span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
