import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';

export const UrlScanner: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFamily, setActiveFamily] = useState<string>('Lexical');

  const sampleUrls = [
    { label: 'Credential Phish', url: 'http://paypal-security-login.verify-account.xyz/auth?session=992' },
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
    setResult(null);
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
    <div className="flex flex-col gap-space-lg pb-16">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            <span className="font-mono text-[11px] tracking-wide text-secondary font-semibold uppercase">URL Detonation Mode</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">RF-v001 · 44 FEATURES</span>
          </div>
          <h1 className="text-[24px] font-bold text-on-surface tracking-tight">URL &amp; Domain Threat Scanner</h1>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Extracts 44 lexical, structural, entropy, and semantic features and runs Isotonic-calibrated Random Forest inference against a threshold of 0.390.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <span className="font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/20 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ML ENGINE READY
          </span>
        </div>
      </div>

      {/* ── TARGET Omnibar ── */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/20 pb-space-md">
          <span className="font-mono text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Target URL Input</span>
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[12px] text-on-surface-variant font-medium">Quick Test:</span>
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                onClick={() => { setUrlInput(s.url); handleScan(s.url); }}
                className={`text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors border ${
                  idx === 0
                    ? 'bg-error-container/40 text-on-error-container border-error/20 hover:bg-error-container'
                    : idx === 1
                    ? 'bg-amber-500/10 text-amber-800 border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Big URL Input Row */}
        <div className="flex flex-col sm:flex-row gap-space-sm">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-space-md flex items-center pointer-events-none">
              <span className="font-mono text-[11px] font-bold text-secondary tracking-wider">TARGET:</span>
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="https://suspicious-link.com/auth?token=..."
              className="w-full pl-[4.5rem] pr-space-md py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg font-mono text-[13px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:bg-surface-container-lowest transition-all"
            />
          </div>
          <button
            onClick={() => handleScan()}
            disabled={loading}
            className="px-space-xl py-3 bg-primary hover:opacity-90 text-on-primary font-semibold text-[13px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Detonating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Detonate &amp; Analyze</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-space-md py-space-sm bg-error-container/20 border border-error/20 rounded-lg text-[13px] text-on-error-container font-medium">
            <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
          <span>URLs are processed server-side. No outbound requests are made to the target URL — analysis is purely lexical and structural.</span>
        </div>
      </div>

      {/* ── Result Panel ── */}
      {result && (
        <div className="flex flex-col gap-space-lg">

          {/* Verdict Card with Left Accent Stripe */}
          <div className="relative bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
            {/* Left accent stripe */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
              result.verdict === 'Malicious' ? 'bg-error' :
              result.verdict === 'Suspicious' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />

            <div className="pl-6 pr-space-lg py-space-lg flex flex-col gap-space-md">
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-space-md">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center gap-3 flex-wrap">
                    <VerdictBadge verdict={result.verdict} size="lg" />
                    <span className="text-[13px] font-semibold text-on-surface-variant">
                      Confidence: <strong className="text-on-surface">{result.confidence}</strong>
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      ID: {result.scan_id}
                    </span>
                  </div>
                  <div className="font-mono text-[12px] font-bold text-on-surface break-all bg-surface-container-low px-space-md py-space-sm rounded-lg border border-outline-variant/20">
                    {result.url}
                  </div>
                </div>

                {/* Probability gauge */}
                <div className="flex flex-col items-center bg-surface-container-low rounded-xl p-space-md gap-1 min-w-[100px]">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">ML Score</span>
                  <span className={`font-mono text-[28px] font-bold leading-none ${
                    result.verdict === 'Malicious' ? 'text-error' :
                    result.verdict === 'Suspicious' ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {(result.probability * 100).toFixed(0)}
                  </span>
                  <span className="font-mono text-[11px] text-on-surface-variant">prob %</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    Threshold: {((result.threshold ?? 0.39) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Risk bar */}
              <RiskMeter score={result.risk_score} label="Aggregate Threat Risk Score" />
            </div>
          </div>

          {/* Pill stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {[
              {
                label: 'Threat Verdict',
                value: result.verdict,
                sub: `${result.confidence} confidence`,
                icon: 'gpp_maybe',
                accent: result.verdict === 'Malicious' ? 'text-error' : result.verdict === 'Suspicious' ? 'text-amber-600' : 'text-emerald-700',
              },
              {
                label: 'ML Probability',
                value: result.probability.toFixed(4),
                sub: `Threshold: ${result.threshold ?? '0.390'}`,
                icon: 'analytics',
                accent: 'text-secondary',
              },
              {
                label: 'Risk Score',
                value: `${result.risk_score}/100`,
                sub: result.risk_score >= 65 ? 'CRITICAL' : result.risk_score >= 35 ? 'ELEVATED' : 'LOW',
                icon: 'shield',
                accent: 'text-on-surface',
              },
              {
                label: 'Model Version',
                value: result.model_version ?? 'v001',
                sub: result.algorithm ?? 'RandomForest',
                icon: 'memory',
                accent: 'text-on-surface',
              },
            ].map((card) => (
              <div key={card.label} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex items-start gap-3">
                <span className={`material-symbols-outlined text-[22px] mt-0.5 ${card.accent}`}>{card.icon}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{card.label}</span>
                  <span className={`font-mono text-[15px] font-bold truncate ${card.accent}`}>{card.value}</span>
                  <span className="font-mono text-[11px] text-on-surface-variant">{card.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Suspicious Flags */}
          {result.suspicious_flags && result.suspicious_flags.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-error/20 flex flex-col gap-space-sm">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>Heuristic Triggers &amp; Suspicious Indicators ({result.suspicious_flags.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.suspicious_flags.map((flag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-error-container/60 text-on-error-container text-[12px] font-mono border border-error/20 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-error" />
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ML Feature Vector Breakdown */}
          {result.features_by_family && Object.keys(result.features_by_family).length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
              {/* Header + tabs */}
              <div className="p-space-md border-b border-outline-variant/20 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">memory</span>
                  <h4 className="text-[13px] font-bold text-on-surface">Extracted 44-Feature ML Vector</h4>
                </div>
                <div className="flex rounded-lg bg-surface-container p-0.5 text-[11px] font-semibold gap-0.5">
                  {Object.keys(result.features_by_family).map((family) => (
                    <button
                      key={family}
                      onClick={() => setActiveFamily(family)}
                      className={`px-2.5 py-1 rounded-md transition-colors uppercase tracking-wide ${
                        activeFamily === family
                          ? 'bg-surface-container-lowest text-secondary font-bold shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {family}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-space-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-sm">
                  {result.features_by_family[activeFamily] &&
                    Object.entries(result.features_by_family[activeFamily]).map(([name, val]) => {
                      const isFlagged = typeof val === 'number' && val > 0 &&
                        (name.includes('count') || name.includes('ratio') || name.includes('entropy') || name.includes('ip_') || name.includes('has_'));
                      return (
                        <div
                          key={name}
                          className={`p-space-sm rounded-lg border flex justify-between items-center ${
                            isFlagged
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-800'
                              : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant'
                          }`}
                        >
                          <span className="font-mono text-[11px] truncate mr-2" title={name}>
                            {name.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-[12px] font-bold text-on-surface shrink-0">{String(val)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Model provenance footer */}
              <div className="px-space-lg py-space-sm bg-surface-container-low border-t border-outline-variant/20 flex justify-between font-mono text-[11px] text-on-surface-variant">
                <span>Model: {result.algorithm} ({result.model_version})</span>
                <span>Schema: {result.feature_version}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
