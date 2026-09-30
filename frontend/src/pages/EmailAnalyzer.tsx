import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { EmailThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { AuthResultsCard } from '../components/AuthResultsCard';
import { RelayPathGraph } from '../components/RelayPathGraph';
import { NlpSignalsCard } from '../components/NlpSignalsCard';


export const EmailAnalyzer: React.FC = () => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailThreatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caseCreated, setCaseCreated] = useState(false);

  const samplePhishing = `From: "Microsoft Security Office" <security-alerts@verify-account-portal.xyz>
To: victim@enterprise-corp.com
Subject: CRITICAL: Immediate Account Verification Required
Date: Mon, 24 Aug 2026 14:15:30 +0000
Message-ID: <attack-sim-2026@verify-account-portal.xyz>
Reply-To: support-desk@divert-auth.ru
Received: from mail.verify-account-portal.xyz (185.220.101.5) by mx.enterprise-corp.com with ESMTP; Mon, 24 Aug 2026 14:15:32 +0000
Authentication-Results: mx.enterprise-corp.com; spf=fail (unauthorized sender IP 185.220.101.5); dkim=fail; dmarc=fail

Dear Employee,

Your corporate access credentials will be suspended within 4 hours due to an unauthorized sign-in attempt from IP 194.26.29.112.

You must authenticate immediately to restore your multi-factor security token:
http://microsoft-secure-login.verify-account-portal.xyz/auth?session=corp9921

Failure to take immediate action will result in permanent account termination by the IT Administrator.

Regards,
Corporate IT Security Helpdesk`;

  const handleScan = async () => {
    setError(null);
    setResult(null);
    setCaseCreated(false);

    if (inputMode === 'text' && !rawText.trim()) {
      setError('Please paste raw email headers and body content.');
      return;
    }

    if (inputMode === 'file' && !selectedFile) {
      setError('Please select or drag-and-drop an .eml file.');
      return;
    }

    setLoading(true);
    try {
      if (inputMode === 'file' && selectedFile) {
        const res = await apiClient.scanEmlFile(selectedFile);
        setResult(res);
      } else {
        const res = await apiClient.scanEmail(rawText, true);
        setResult(res);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete email threat analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!result) return;
    try {
      await apiClient.createCase({
        title: `Phishing Investigation: ${result.subject || 'Suspicious Email'}`,
        target_type: 'email',
        target_value: `${result.subject || 'No Subject'} <${result.sender || 'Unknown'}>`,
        verdict: result.verdict,
        risk_score: result.risk_score,
        priority: result.verdict === 'Malicious' ? 'Critical' : 'Medium',
        notes: `Automated triage flagged ${result.suspicious_flags.length} anomalies.`,
      });
      setCaseCreated(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-space-lg pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            <span className="font-mono text-[11px] tracking-wide text-secondary font-semibold uppercase">Operational Forensics</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">ENGINE: RF-PHISH-v3</span>
          </div>
          <h1 className="text-[24px] font-bold text-on-surface tracking-tight">Email Phishing Analyzer</h1>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Deep RFC 822 / EML header inspection, DMARC/SPF/DKIM cryptographic validation, NLP social engineering triage, and embedded payload extraction.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button onClick={() => { setInputMode('text'); setRawText(samplePhishing); }} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface text-[13px] font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span>Paste Raw Headers</span>
          </button>
        </div>
      </div>

      {/* Input Workspace */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-space-sm">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-surface-container-high text-on-surface border-l-2 border-secondary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              <span>Paste Raw Email / Headers</span>
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                inputMode === 'file'
                  ? 'bg-surface-container-high text-on-surface border-l-2 border-secondary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">upload</span>
              <span>Upload .EML File</span>
            </button>
          </div>

          <button
            onClick={() => {
              setInputMode('text');
              setRawText(samplePhishing);
            }}
            className="text-xs text-secondary font-semibold hover:underline flex items-center gap-1.5 font-mono"
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span>Load Sample Phishing Attack</span>
          </button>
        </div>

        {inputMode === 'text' ? (
          <div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw email headers and body content here..."
              className="w-full p-space-md font-mono text-[12px] bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:border-secondary focus:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant leading-relaxed transition-all"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-outline-variant/20 rounded-xl p-8 text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[36px] text-secondary mx-auto mb-2 opacity-80 block">cloud_upload</span>
            <p className="text-sm font-semibold text-on-surface">Drag and drop your .eml / RFC 822 file here</p>
            <p className="text-xs text-on-surface-variant mt-1">MIME multipart, headers, and attachments metadata extracted securely</p>
            <input
              type="file"
              accept=".eml,.msg,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-4 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer font-mono"
            />
            {selectedFile && (
              <div className="mt-2.5 text-xs font-mono font-semibold text-secondary">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-space-sm bg-error-container/20 border border-error/20 rounded-lg text-[13px] text-on-error-container flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <span className="text-xs text-on-surface-variant font-sans">
            PII Policy: Email message body is processed in memory and never stored in history.
          </span>
          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:opacity-90 text-on-primary font-semibold text-[13px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deconstructing & Running ML...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">shield</span>
                <span>Execute Complete Forensic Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Forensic Results Panel */}
      {result && (
        <div className="flex flex-col gap-space-lg animate-in fade-in duration-200">
          {/* Executive Verdict & Risk Banner */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/20 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.verdict} size="lg" />
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Confidence: <strong className="text-on-surface">{result.confidence}</strong>
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant">ID: {result.scan_id}</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">
                  {result.subject || '(No Subject Provided)'}
                </h3>
                <div className="text-xs font-mono text-on-surface-variant flex flex-wrap gap-x-5 gap-y-1">
                  <span>From: <strong className="text-on-surface">{result.sender || 'Unknown'}</strong></span>
                  {result.reply_to && <span>Reply-To: <strong className="text-error">{result.reply_to}</strong></span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateCase}
                  disabled={caseCreated}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                    caseCreated
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-surface hover:bg-surface-container-low text-on-surface border border-outline-variant/20'
                  }`}
                >
                  {caseCreated ? <span className="material-symbols-outlined text-[16px]">check_circle</span> : <span className="material-symbols-outlined text-[16px]">folder_managed</span>}
                  <span>{caseCreated ? 'CASE LOGGED' : 'CREATE CASE'}</span>
                </button>
              </div>
            </div>

            <RiskMeter score={result.risk_score} label="Aggregate Threat Risk Score" />
          </div>

          {/* Suspicious Flags Callout */}
          {result.suspicious_flags.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-error/20 flex flex-col gap-space-sm">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                <span>Forensic Anomalies & Attack Signals ({result.suspicious_flags.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.suspicious_flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-error-container/60 text-on-error-container text-[12px] font-mono border border-error/20 font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>{flag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Authentication Card (SPF / DKIM / DMARC) */}
          <AuthResultsCard results={result.auth_results} />

          {/* NLP Threat Indicators */}
          <NlpSignalsCard signals={result.nlp_signals} />

          {/* Extracted Embedded URLs ML Scan */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="p-space-md border-b border-outline-variant/20 bg-surface-container-low/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">link</span>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                  Embedded URLs ({result.url_results.length}) — ML Assessment
                </h4>
              </div>
              <span className="text-[11px] text-on-surface-variant font-mono">44 Feature Extraction Vector</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Target Link</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                    <th className="py-2.5 px-4">ML Prob.</th>
                    <th className="py-2.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {result.url_results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-on-surface-variant font-mono">
                        No embedded URLs detected in message body or HTML parts.
                      </td>
                    </tr>
                  ) : (
                    result.url_results.map((u, i) => (
                      <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4 text-on-surface-variant">{i + 1}</td>
                        <td className="py-3 px-4 text-on-surface max-w-[360px] truncate" title={u.url}>
                          {u.url}
                        </td>
                        <td className="py-3 px-4">
                          <VerdictBadge verdict={u.verdict} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span className={u.risk_score >= 65 ? 'text-error' : u.risk_score >= 35 ? 'text-amber-600' : 'text-emerald-600'}>
                            {u.risk_score}/100
                          </span>
                        </td>
                        <td className="py-3 px-4 text-on-surface">{u.probability.toFixed(4)}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{u.confidence}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMTP Relay Hop Visualizer */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20">
            <RelayPathGraph hops={result.relay_path} />
          </div>
        </div>
      )}
    </div>
  );
};
