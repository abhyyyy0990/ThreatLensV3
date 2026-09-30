import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
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
    <div className="flex flex-col gap-space-lg pb-16">
      <div className="pb-space-md">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px]">layers</span>
          <span>Batch Security Vector & CSV Analyzer</span>
        </h2>
        <p className="text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
          Execute parallel machine-learning inference over large sets of URLs, domains, and suspicious link lists.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
            Enter URLs (One per line)
          </label>
          <button
            onClick={() => setUrlsText(sampleBatch)}
            className="text-xs text-secondary font-mono font-semibold hover:underline"
          >
            Load Sample Batch List (6 URLs)
          </button>
        </div>

        <textarea
          rows={6}
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder="http://example.com/url-1&#10;http://example.com/url-2"
          className="w-full p-4 font-mono text-xs bg-surface-container-lowest rounded-xl text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
        />

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-error flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-on-surface-variant">
            {urlsText.split('\n').filter((u) => u.trim()).length} target(s) listed
          </span>
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:opacity-90 text-on-primary font-semibold text-xs rounded-lg shadow-button transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Executing Batch ML...' : 'Run Batch Analysis'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/20 text-center shadow-xs">
              <div className="text-[10px] uppercase font-bold text-on-surface-variant">Total Items</div>
              <div className="text-2xl font-bold text-on-surface mt-1 font-mono">{stats.total}</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 text-center shadow-xs">
              <div className="text-[10px] uppercase font-bold text-error">Malicious</div>
              <div className="text-2xl font-bold text-error mt-1 font-mono">{stats.malicious}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-center shadow-xs">
              <div className="text-[10px] uppercase font-bold text-amber-700">Suspicious</div>
              <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">{stats.suspicious}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center shadow-xs">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Safe / Clean</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">{stats.safe}</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
              <h4 className="text-xs font-bold uppercase text-on-surface">Batch Result Table</h4>
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-1.5 bg-surface hover:bg-surface-container-low text-on-surface text-xs font-medium rounded-lg flex items-center gap-1.5 border border-outline-variant/20 shadow-xs"
              >
                <span className="material-symbols-outlined text-[12px]">file_download</span>
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-[10px] font-bold uppercase text-on-surface-variant">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Target URL</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                    <th className="py-2.5 px-4">ML Prob.</th>
                    <th className="py-2.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-4 text-on-surface-variant">{i + 1}</td>
                      <td className="py-3 px-4 text-on-surface max-w-[400px] truncate" title={r.url}>
                        {r.url}
                      </td>
                      <td className="py-3 px-4">
                        <VerdictBadge verdict={r.verdict} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={r.risk_score >= 65 ? 'text-error' : r.risk_score >= 35 ? 'text-amber-600' : 'text-emerald-600'}>
                          {r.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface">{r.probability.toFixed(4)}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{r.confidence}</td>
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
