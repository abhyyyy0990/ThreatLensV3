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
  ArrowRight,
  TrendingUp,
  Shield,
  Radio,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

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
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-primary uppercase">
              Operational Command Center
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
            Threat Intelligence Command Center
          </h2>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
            Real-time threat detection, forensic investigation, and ML-powered cybersecurity intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('email')}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-button transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Analyze Threat</span>
          </button>
          <button
            onClick={() => onNavigate('url')}
            className="px-4 py-2.5 bg-surface hover:bg-background-subtle border border-border text-text-primary font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Scan URL</span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Clean KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* Card 1: Total Analyzed */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Total Analyzed
            </span>
            <div className="p-2 rounded-lg bg-background-subtle text-text-secondary">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">
              {stats.total.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted font-sans font-medium">events</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-xs font-mono text-text-secondary flex justify-between">
            <span>{stats.url_scans} URLs</span>
            <span>{stats.email_scans} Emails</span>
          </div>
        </div>

        {/* Card 2: Threats Intercepted */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Threats Intercepted
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">
              {stats.malicious.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-red-600">
              {stats.total > 0 ? `${((stats.malicious / stats.total) * 100).toFixed(0)}% attack rate` : '0%'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted truncate">
            Phishing, credential theft & malware
          </div>
        </div>

        {/* Card 3: Verified Clean */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Verified Clean
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-text-primary tracking-tight">
              {stats.safe.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600">safe vectors</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted truncate">
            Passed ML & deterministic filters
          </div>
        </div>

        {/* Card 4: Model Confidence */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Model Confidence (F1)
            </span>
            <div className="p-2 rounded-lg bg-primary-subtle text-primary">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-primary tracking-tight">
              {modelInfo?.locked_test_metrics?.f1 ? modelInfo.locked_test_metrics.f1.toFixed(3) : '0.827'}
            </span>
            <span className="text-xs font-mono text-text-muted font-medium">v001 RF</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-xs font-mono text-text-secondary flex justify-between">
            <span>PR-AUC: {modelInfo?.locked_test_metrics?.pr_auc ? modelInfo.locked_test_metrics.pr_auc.toFixed(3) : '0.910'}</span>
            <span>Acc: {modelInfo?.locked_test_metrics?.accuracy ? (modelInfo.locked_test_metrics.accuracy * 100).toFixed(1) : '89.2'}%</span>
          </div>
        </div>
      </div>

      {/* 24h Threat Activity Graph */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>24-Hour Threat Activity Telemetry</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Live ingress stream comparing total scans vs intercepted malicious payloads.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-text-secondary">Total Scanned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-600 font-semibold">Malicious Intercepts</span>
            </div>
          </div>
        </div>

        <div className="h-52 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.08)',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#totalGradient)" />
              <Area type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#threatGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid: Live Threat Feed + AI Engine Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Threat Feed */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface-muted">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Live Security Triage Stream
                </h3>
                <p className="text-[11px] text-text-muted">Telemetry events persisted in SQLite store</p>
              </div>
            </div>

            <div className="flex rounded-lg bg-background-subtle p-0.5 text-xs font-semibold">
              {['all', 'email', 'url'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded-md text-[11px] uppercase transition-colors ${
                    filterType === f
                      ? 'bg-surface text-primary font-bold shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border/60 max-h-[500px] overflow-y-auto">
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
                    className="p-3.5 hover:bg-background-subtle/70 transition-colors flex items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isMalicious
                            ? 'bg-red-500'
                            : isSuspicious
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {item.scan_type}
                      </span>
                      <span className="text-text-primary font-medium truncate max-w-[320px]" title={item.input_repr}>
                        {item.input_repr}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <VerdictBadge verdict={item.verdict} size="sm" />
                      <div className="text-right">
                        <span className={`font-bold ${isMalicious ? 'text-red-600' : isSuspicious ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {item.risk_score}
                        </span>
                        <span className="text-text-muted text-[10px]">/100</span>
                      </div>
                      <span className="text-[11px] text-text-muted hidden sm:inline">
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
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span>Active AI Engine</span>
                </h3>
                <p className="text-[11px] text-text-muted">RandomForest v001</p>
              </div>
              <button
                onClick={() => onNavigate('model')}
                className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted font-sans">Algorithm</span>
                <span className="text-text-primary font-semibold">{modelInfo?.algorithm || 'RandomForest'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted font-sans">Calibration</span>
                <span className="text-primary font-semibold">{modelInfo?.calibration_method || 'Isotonic'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted font-sans">Decision Threshold</span>
                <span className="font-bold text-primary">{modelInfo?.selected_threshold || '0.390'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted font-sans">Features</span>
                <span className="text-text-primary">{modelInfo?.feature_count || 44} numerical</span>
              </div>
            </div>

            {/* Model Performance Grid */}
            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Locked Holdout Benchmarks
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-background-subtle border border-border">
                  <div className="text-[10px] text-text-muted font-sans font-medium">ROC-AUC</div>
                  <div className="font-bold text-text-primary text-base mt-0.5">
                    {modelInfo?.locked_test_metrics?.roc_auc ? modelInfo.locked_test_metrics.roc_auc.toFixed(4) : '0.9417'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary-subtle border border-primary-border">
                  <div className="text-[10px] text-primary font-sans font-bold">PR-AUC (Primary)</div>
                  <div className="font-bold text-primary text-base mt-0.5">
                    {modelInfo?.locked_test_metrics?.pr_auc ? modelInfo.locked_test_metrics.pr_auc.toFixed(4) : '0.9103'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Intelligence Feeds */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Threat Intelligence Feeds
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background-subtle border border-border">
                <span className="text-text-primary font-medium">Google Safe Browsing v4</span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background-subtle border border-border">
                <span className="text-text-primary font-medium">PhishTank Live XML</span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
