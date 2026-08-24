import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { Link2, AlertTriangle, Cpu, Search, ShieldCheck } from 'lucide-react';

export const UrlScanner: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFamily, setActiveFamily] = useState<string>('Lexical');

  const sampleUrls = [
    { label: 'Phishing Credential Target', url: 'http://paypal-security-login.verify-account.xyz/auth?session=992' },
    { label: 'IP Hostname Attack', url: 'http://192.168.1.1/admin/auth/token' },
    { label: 'Legitimate Domain', url: 'https://google.com' },
  ];

  const handleScan = async (targetUrl?: string) => {
    const toScan = targetUrl || urlInput;
    if (!toScan.trim()) {
      setError('Please enter a valid URL to scan.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.scanUrl(toScan.trim(), true);
      setResult(res);
      if (res.features_by_family && Object.keys(res.features_by_family).length > 0) {
        setActiveFamily(Object.keys(res.features_by_family)[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete URL scan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
          <Link2 className="w-6 h-6 text-primary" />
          <span>URL & Domain Security Intelligence Scanner</span>
        </h2>
        <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
          Extracts 44 lexical, structural, entropy, and semantic features and runs calibrated Random Forest inference.
        </p>
      </div>

      {/* Input Card — Inspired by PhishGuard Clean Box */}
      <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
            Enter URL to Analyze
          </label>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-text-muted font-sans">Try demo:</span>
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUrlInput(s.url);
                  handleScan(s.url);
                }}
                className="text-primary hover:underline px-2.5 py-1 rounded-md bg-background-subtle border border-border font-sans text-xs"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="https://suspicious-link.com/auth?token=..."
              className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
          <button
            onClick={() => handleScan()}
            disabled={loading}
            className="px-7 py-3 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-button transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Extracting Features & Running ML...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scan Indicator</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Panel */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Verdict Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.verdict} size="lg" />
                  <span className="text-xs font-semibold text-text-secondary">
                    Confidence: <strong className="text-text-primary">{result.confidence}</strong>
                  </span>
                  <span className="text-xs font-mono text-text-muted">ID: {result.scan_id}</span>
                </div>
                <div className="font-mono text-xs font-bold text-text-primary break-all bg-background-subtle p-3 rounded-lg border border-border">
                  {result.url}
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[11px] text-text-muted uppercase tracking-wider font-sans">Raw Calibrated Prob.</div>
                <div className="text-2xl font-bold text-primary">{result.probability.toFixed(4)}</div>
                <div className="text-[11px] text-text-muted">Threshold: {result.threshold || '0.390'}</div>
              </div>
            </div>

            <RiskMeter score={result.risk_score} />
          </div>

          {/* Suspicious Indicator Flags */}
          {result.suspicious_flags && result.suspicious_flags.length > 0 && (
            <div className="bg-surface border border-red-200 rounded-xl p-5 shadow-card space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Suspicious Heuristic Triggers & Indicators ({result.suspicious_flags.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.suspicious_flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-50 text-red-700 text-xs font-mono border border-red-200 font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>{flag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feature Breakdown Tabs */}
          {result.features_by_family && Object.keys(result.features_by_family).length > 0 && (
            <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border bg-surface-muted flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Extracted 44-Feature ML Vector
                  </h4>
                </div>

                <div className="flex rounded-lg bg-background-subtle p-0.5 text-xs font-semibold">
                  {Object.keys(result.features_by_family).map((family) => (
                    <button
                      key={family}
                      onClick={() => setActiveFamily(family)}
                      className={`px-3 py-1 rounded-md text-[11px] uppercase transition-colors ${
                        activeFamily === family
                          ? 'bg-surface text-primary font-bold shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {family}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {result.features_by_family[activeFamily] &&
                    Object.entries(result.features_by_family[activeFamily]).map(([name, val]) => {
                      const isFlagged = typeof val === 'number' && val > 0 && (name.includes('count') || name.includes('ratio') || name.includes('entropy'));
                      return (
                        <div
                          key={name}
                          className={`p-3 rounded-lg border text-xs flex justify-between items-center ${
                            isFlagged
                              ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                              : 'bg-background-subtle border-border text-text-secondary'
                          }`}
                        >
                          <span className="font-mono text-[11px] truncate mr-2" title={name}>
                            {name.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-text-primary">{String(val)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Model Provenance Footer */}
              <div className="px-5 py-3 bg-surface-muted border-t border-border text-xs font-mono text-text-muted flex justify-between">
                <span>Active Model: {result.algorithm} ({result.model_version})</span>
                <span>Schema: {result.feature_version}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
