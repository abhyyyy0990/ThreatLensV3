import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { Layers, Upload, Download, Search, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export const BatchScanner: React.FC = () => {
  const [urlsText, setUrlsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ThreatResult[]>([]);
  const [stats, setStats] = useState({ total: 0, malicious: 0, safe: 0, suspicious: 0 });
  const [error, setError] = useState<string | null>(null);

  const sampleBatch = `http://paypal-security-login.verify-account.xyz/auth
http://192.168.1.1/admin/auth/token
https://google.com
http://microsoft-secure-login.verify-account-portal.xyz
https://github.com
http://update-your-bank-account.ru/login.php`;

  const handleScan = async () => {
    setError(null);
    const items = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (items.length === 0) {
      setError('Please provide at least one URL to batch scan.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.scanBatch(items);
      setResults(res.results);
      setStats({
        total: res.total,
        malicious: res.malicious,
        safe: res.safe,
        suspicious: res.suspicious,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete batch scan.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;
    const headers = ['URL', 'Verdict', 'Risk Score', 'Probability', 'Confidence'];
    const rows = results.map((r) => [
      `"${r.url}"`,
      r.verdict,
      r.risk_score,
      r.probability.toFixed(4),
      r.confidence,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threatlens_batch_scan_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span>Batch Security Vector & CSV Analyzer</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Execute parallel machine-learning inference over large sets of URLs, domains, and suspicious link lists.
        </p>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-outline">
            Enter URLs (One per line)
          </label>
          <button
            onClick={() => setUrlsText(sampleBatch)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Load Sample Batch List (6 URLs)
          </button>
        </div>

        <textarea
          rows={6}
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder="http://example.com/url-1&#10;http://example.com/url-2"
          className="w-full p-3 font-mono text-xs bg-surface-container-low border border-outline-variant rounded-lg"
        />

        {error && (
          <div className="p-3 bg-error-container/40 border border-error/30 rounded-lg text-xs text-error flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-outline">
            {urlsText.split('\n').filter((u) => u.trim()).length} target(s) listed
          </span>
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Executing Batch ML...' : 'Run Batch Analysis'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-white border border-outline-variant text-center">
              <div className="text-[10px] uppercase font-bold text-outline">Total Items</div>
              <div className="text-xl font-bold font-mono text-on-surface">{stats.total}</div>
            </div>
            <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-center">
              <div className="text-[10px] uppercase font-bold text-error">Malicious</div>
              <div className="text-xl font-bold font-mono text-error">{stats.malicious}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-center">
              <div className="text-[10px] uppercase font-bold text-amber-800">Suspicious</div>
              <div className="text-xl font-bold font-mono text-amber-800">{stats.suspicious}</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary-container/20 border border-secondary/30 text-center">
              <div className="text-[10px] uppercase font-bold text-secondary">Clean</div>
              <div className="text-xl font-bold font-mono text-secondary">{stats.safe}</div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl shadow-feather overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/40">
              <h4 className="text-xs font-bold uppercase text-on-surface">Batch Result Table</h4>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-surface-container-highest hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-outline-variant"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-outline">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Target URL</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                    <th className="py-2.5 px-4">ML Prob.</th>
                    <th className="py-2.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/40">
                      <td className="py-3 px-4 font-mono text-outline">{i + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium max-w-[400px] truncate" title={r.url}>
                        {r.url}
                      </td>
                      <td className="py-3 px-4">
                        <VerdictBadge verdict={r.verdict} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={r.risk_score >= 65 ? 'text-error' : r.risk_score >= 35 ? 'text-amber-700' : 'text-secondary'}>
                          {r.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{r.probability.toFixed(4)}</td>
                      <td className="py-3 px-4 font-medium text-on-surface-variant">{r.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
