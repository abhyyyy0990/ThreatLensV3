import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { Link2, AlertTriangle, Cpu, Globe, Search, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <span>High-Density URL & Domain ML Threat Scanner</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Extracts 44 lexical, structural, entropy, and semantic features and runs calibrated Random Forest inference.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-outline">Target URL String</label>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-outline">Presets:</span>
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUrlInput(s.url);
                  handleScan(s.url);
                }}
                className="text-primary hover:underline"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="https://example.com/suspicious-path?param=token..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => handleScan()}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running ML...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scan URL</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error-container/40 border border-error/30 rounded-lg text-xs text-error flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Panel */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Verdict Card */}
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/60 pb-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.verdict} size="lg" />
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Confidence: <strong className="text-on-surface">{result.confidence}</strong>
                  </span>
                  <span className="text-xs font-mono text-outline">ID: {result.scan_id}</span>
                </div>
                <div className="font-mono text-xs font-bold text-on-surface break-all bg-surface-container-low p-2.5 rounded-lg border border-outline-variant">
                  {result.url}
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[11px] text-outline uppercase tracking-wider font-sans">Raw Calibrated Prob.</div>
                <div className="text-2xl font-bold text-on-surface">{result.probability.toFixed(4)}</div>
                <div className="text-[11px] text-outline">Threshold: {result.threshold || '0.390'}</div>
              </div>
            </div>

            <RiskMeter score={result.risk_score} />
          </div>

          {/* Suspicious Indicator Flags */}
          {result.suspicious_flags && result.suspicious_flags.length > 0 && (
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-error" />
                <span>Suspicious Structural & Heuristic Flags ({result.suspicious_flags.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.suspicious_flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-error-container text-error text-xs font-semibold border border-error/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />
                    <span>{flag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feature Breakdown Tabs (Lexical, Structural, Entropy, Semantic) */}
          {result.features_by_family && Object.keys(result.features_by_family).length > 0 && (
            <div className="bg-white border border-outline-variant rounded-xl shadow-feather overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Extracted ML Feature Vector Breakdown (44 Features)
                  </h4>
                </div>

                <div className="flex rounded-lg bg-surface-container-highest p-0.5 text-xs font-semibold">
                  {Object.keys(result.features_by_family).map((family) => (
                    <button
                      key={family}
                      onClick={() => setActiveFamily(family)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        activeFamily === family ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {family}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {result.features_by_family[activeFamily] &&
                    Object.entries(result.features_by_family[activeFamily]).map(([name, val]) => {
                      const isHighValue = typeof val === 'number' && val > 0 && (name.includes('count') || name.includes('ratio'));
                      return (
                        <div
                          key={name}
                          className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                            isHighValue ? 'bg-amber-50/50 border-amber-200' : 'bg-surface-container-low/40 border-outline-variant'
                          }`}
                        >
                          <span className="text-on-surface-variant font-mono text-[11px] truncate mr-2" title={name}>
                            {name.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-on-surface">{String(val)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Model Provenance Footer */}
              <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant text-[11px] font-mono text-outline flex justify-between">
                <span>Model: {result.algorithm} ({result.model_version})</span>
                <span>Feature Schema: {result.feature_version}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
