import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { ScanHistoryItem, SystemStats, ModelInfo } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const EMPTY_CHART = [
  { time: '00:00', total: 0, threats: 0 },
  { time: '04:00', total: 0, threats: 0 },
  { time: '08:00', total: 0, threats: 0 },
  { time: '12:00', total: 0, threats: 0 },
  { time: '16:00', total: 0, threats: 0 },
  { time: '20:00', total: 0, threats: 0 },
  { time: 'Now',   total: 0, threats: 0 },
];

function buildChartData(history: ScanHistoryItem[]): typeof EMPTY_CHART {
  // Bucket scan history into 7 time slots by when items appeared
  const now = Date.now();
  const MS_PER_SLOT = 4 * 60 * 60 * 1000; // 4hr buckets
  const labels = ['00:00','04:00','08:00','12:00','16:00','20:00','Now'];
  const buckets = labels.map(() => ({ total: 0, threats: 0 }));
  history.forEach((item) => {
    const ts = item.scanned_at ? new Date(item.scanned_at).getTime() : now;
    const age = Math.max(0, now - ts);
    const slotIdx = Math.max(0, 6 - Math.floor(age / MS_PER_SLOT));
    const b = buckets[Math.min(slotIdx, 6)];
    b.total += 1;
    if (item.verdict?.toLowerCase().includes('malicious')) {
      b.threats += 1;
    }
  });
  return labels.map((time, i) => ({ time, ...buckets[i] }));
}

const scanTypeIcon: Record<string, string> = {
  url: 'link',
  email: 'mail',
  qr: 'qr_code_scanner',
  screenshot: 'screenshot_monitor',
  batch: 'layers',
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats>({
    total: 0, malicious: 0, safe: 0, suspicious: 0, url_scans: 0, email_scans: 0,
  });
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [feedsStatus, setFeedsStatus] = useState<{ name: string; status: string; live: boolean }[]>([
    { name: 'Google Safe Browsing', status: 'CHECKING...', live: false },
    { name: 'PhishTank', status: 'CHECKING...', live: false },
  ]);

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
      } finally {
        setLoading(false);
      }
    }

    async function loadFeedsStatus() {
      try {
        const data = await apiClient.getFeedsStatus();
        setFeedsStatus(data.feeds);
      } catch (err) {
        console.error('Failed to load feeds status:', err);
        setFeedsStatus([
          { name: 'Google Safe Browsing', status: 'UNKNOWN', live: false },
          { name: 'PhishTank', status: 'UNKNOWN', live: false },
        ]);
      }
    }

    loadData();
    loadFeedsStatus();
  }, []);


  const filteredHistory = history.filter((item) => {
    if (filterType === 'url') return item.scan_type === 'url';
    if (filterType === 'email') return item.scan_type === 'email';
    return true;
  });

  const chartData = history.length > 0 ? buildChartData(history) : EMPTY_CHART;
  const attackRate = stats.total > 0 ? ((stats.malicious / stats.total) * 100).toFixed(0) : '0';
  const f1 = modelInfo?.locked_test_metrics?.f1?.toFixed(3) ?? '0.827';
  const prAuc = modelInfo?.locked_test_metrics?.pr_auc?.toFixed(3) ?? '0.910';
  const accuracy = modelInfo?.locked_test_metrics?.accuracy
    ? (modelInfo.locked_test_metrics.accuracy * 100).toFixed(1)
    : '89.2';

  return (
    <div className="flex flex-col gap-space-lg pb-16">
      {/* ── Command Center Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider font-mono">
            Operational Command Center
          </span>
          <h1 className="text-[26px] font-bold tracking-tight text-on-surface mt-1 leading-tight">
            Threat Intelligence Command Center
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5 leading-relaxed">
            Real-time threat detection, forensic investigation, and ML-powered cybersecurity intelligence.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={() => onNavigate('email')}
            className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-semibold transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">security_update_warning</span>
            <span>Analyze Threat</span>
          </button>
          <button
            onClick={() => onNavigate('url')}
            className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            <span>Scan URL</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Total Analyzed */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-on-surface-variant tracking-normal uppercase">
                Total Analyzed
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">monitoring</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2.5">
              <span className="text-[28px] font-bold text-on-surface tracking-tight font-mono">
                {loading ? '—' : stats.total.toLocaleString()}
              </span>
              <span className="text-[13px] text-on-surface-variant">events</span>
            </div>
          </div>
          <div className="pt-space-md mt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-2 rounded-b-xl flex items-center justify-between font-mono text-[12px]">
            <span className="font-medium text-on-surface">{stats.url_scans} URLs</span>
            <span className="text-outline-variant">•</span>
            <span className="font-medium text-on-surface">{stats.email_scans} Emails</span>
          </div>
        </div>

        {/* Threats Intercepted */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-error tracking-normal uppercase">
                Threats Intercepted
              </span>
              <span className="material-symbols-outlined text-[18px] text-error">gpp_maybe</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2.5">
              <span className="text-[28px] font-bold text-error tracking-tight font-mono">
                {loading ? '—' : stats.malicious.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold">
                {attackRate}% attack rate
              </span>
            </div>
          </div>
          <div className="pt-space-md mt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-2 rounded-b-xl text-on-surface-variant text-[12px] truncate">
            Phishing, credential theft &amp; malware
          </div>
        </div>

        {/* Verified Clean */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-secondary tracking-normal uppercase">
                Verified Clean
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2.5">
              <span className="text-[28px] font-bold text-secondary tracking-tight font-mono">
                {loading ? '—' : stats.safe.toLocaleString()}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                safe vectors
              </span>
            </div>
          </div>
          <div className="pt-space-md mt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-2 rounded-b-xl text-on-surface-variant text-[12px] truncate">
            Passed ML &amp; deterministic filters
          </div>
        </div>

        {/* Model Confidence */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-on-surface-variant tracking-normal uppercase">
                Model Confidence (F1)
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">memory</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2.5">
              <span className="text-[28px] font-bold text-on-surface tracking-tight font-mono">{f1}</span>
              <span className="text-[11px] text-on-surface-variant font-medium bg-surface-container px-1.5 py-0.5 rounded font-mono">
                v001 RF
              </span>
            </div>
          </div>
          <div className="pt-space-md mt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-2 rounded-b-xl flex items-center justify-between font-mono text-[12px]">
            <span>PR-AUC: <strong className="text-on-surface font-semibold">{prAuc}</strong></span>
            <span>Acc: <strong className="text-on-surface font-semibold">{accuracy}%</strong></span>
          </div>
        </div>
      </div>

      {/* ── 24-Hour Threat Activity Telemetry ── */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">show_chart</span>
              <h2 className="text-[15px] font-bold tracking-tight text-on-surface">
                24-Hour Threat Activity Telemetry
              </h2>
            </div>
            <span className="text-[12px] text-on-surface-variant mt-0.5">
              Live ingress stream comparing total scans vs intercepted malicious payloads.
            </span>
          </div>
          <div className="flex items-center gap-space-lg text-[12px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-secondary font-semibold">Total Scanned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-error" />
              <span className="text-error font-semibold">Malicious Intercepts</span>
            </div>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0051d5" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0051d5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ba1a1a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#dce9ff" vertical={false} />
              <XAxis dataKey="time" stroke="#76777d" fontSize={11} tickLine={false} axisLine={{ stroke: '#c6c6cd' }} fontFamily="JetBrains Mono" />
              <YAxis stroke="#76777d" fontSize={11} tickLine={false} axisLine={{ stroke: '#c6c6cd' }} fontFamily="JetBrains Mono" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#c6c6cd',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(15,23,42,0.08)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Area type="monotone" dataKey="total"   stroke="#0051d5" strokeWidth={2.5} fillOpacity={1} fill="url(#totalGrad)" />
              <Area type="monotone" dataKey="threats" stroke="#ba1a1a" strokeWidth={2}   fillOpacity={1} fill="url(#threatGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Split: Live Triage + AI Engine Stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-md">
        {/* Left 2/3: Live Security Triage Stream */}
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">sensors</span>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-on-surface">Live Security Triage Stream</h2>
                <p className="text-[12px] text-on-surface-variant">Telemetry events persisted in SQLite operational store</p>
              </div>
            </div>
            {/* Filter Tabs */}
            <div className="inline-flex p-1 rounded-lg bg-surface-container text-[11px] font-semibold self-start sm:self-auto">
              {['all', 'email', 'url'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 rounded transition-colors font-medium uppercase ${
                    filterType === f
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Event List */}
          <div className="flex flex-col gap-2 mt-1 overflow-x-auto">
            {filteredHistory.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant gap-2">
                <span className="material-symbols-outlined text-[36px] opacity-40">inbox</span>
                <span className="text-[13px] font-medium">No scan events yet. Start scanning to see results here.</span>
              </div>
            )}
            {filteredHistory.slice(0, 8).map((item, idx) => {
              const isThreats = item.verdict?.toLowerCase().includes('malicious');
              const isSuspicious = item.verdict?.toLowerCase().includes('suspicious');
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`material-symbols-outlined text-[18px] shrink-0 ${isThreats ? 'text-error' : isSuspicious ? 'text-amber-600' : 'text-secondary'}`}>
                      {scanTypeIcon[item.scan_type || 'url'] || 'link'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold text-on-surface truncate">
                        {item.scan_type === 'email' ? `Email: ${item.input_repr || 'Unknown'}` : item.input_repr || 'Unknown Target'}
                      </span>
                      <span className="font-mono text-[11px] text-on-surface-variant truncate">
                        {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString() : 'just now'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0">
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      isThreats   ? 'text-on-error-container bg-error-container' :
                      isSuspicious? 'text-amber-800 bg-amber-500/10' :
                                    'text-emerald-800 bg-emerald-500/10'
                    }`}>
                      {Math.round(item.risk_score || 0)}/100
                    </span>
                    <VerdictBadge verdict={item.verdict || 'Unknown'} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1/3: Active AI Engine Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px] text-secondary">psychology</span>
            <h2 className="text-[15px] font-bold tracking-tight text-on-surface">Active AI Engine</h2>
          </div>

          {/* Model version badge */}
          <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-on-surface uppercase tracking-wide">RandomForest v001</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              Isotonic Calibrated · 44 Features
            </span>
          </div>

          {/* Metrics */}
          {[
            { label: 'F1 Score (Locked Test)', value: f1, color: 'text-secondary' },
            { label: 'PR-AUC', value: prAuc, color: 'text-emerald-700' },
            { label: 'Accuracy', value: `${accuracy}%`, color: 'text-on-surface' },
          ].map((m) => (
            <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-outline-variant/10 last:border-0">
              <span className="text-[12px] text-on-surface-variant font-medium">{m.label}</span>
              <span className={`font-mono text-[14px] font-bold ${m.color}`}>{m.value}</span>
            </div>
          ))}

          {/* Navigation actions */}
          <div className="flex flex-col gap-2 pt-space-sm">
            <button
              onClick={() => onNavigate('model')}
              className="w-full flex items-center justify-center gap-2 py-2 px-space-md rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-[13px] font-semibold transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span>View Model Report</span>
            </button>
            <button
              onClick={() => onNavigate('email')}
              className="w-full flex items-center justify-center gap-2 py-2 px-space-md rounded-lg bg-primary text-on-primary hover:opacity-90 text-[13px] font-semibold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Analyze Email</span>
            </button>
          </div>

          {/* Intel feeds status — driven by real backend probe */}
          <div className="pt-space-sm border-t border-outline-variant/20">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Threat Intelligence Feeds
            </span>
            {feedsStatus.map((feed) => {
              const isLive = feed.live;
              const isChecking = feed.status === 'CHECKING...';
              const badgeClass = isLive
                ? 'text-emerald-800 bg-emerald-500/10 border border-emerald-500/20'
                : isChecking
                ? 'text-blue-700 bg-blue-500/10 border border-blue-500/20'
                : 'text-amber-700 bg-amber-500/10 border border-amber-500/20';
              return (
                <div key={feed.name} className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1.5">
                    {isLive && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                    )}
                    <span className="text-[12px] text-on-surface font-medium">{feed.name}</span>
                  </div>
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}`}>
                    {feed.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
