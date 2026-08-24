import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { EmailThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { AuthResultsCard } from '../components/AuthResultsCard';
import { RelayPathGraph } from '../components/RelayPathGraph';
import { NlpSignalsCard } from '../components/NlpSignalsCard';
import {
  Mail,
  Upload,
  FileText,
  AlertTriangle,
  Link2,
  Shield,
  FileCode,
  FileCheck,
  CheckCircle2,
  Briefcase,
  Printer,
  Sparkles,
} from 'lucide-react';

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
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      {/* Page Header */}
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <span>AI-Powered Email Threat & Forensic Intelligence Analyzer</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Performs deep MIME parsing, deterministic header forensics, SPF/DKIM/DMARC verification, SMTP relay hop tracking, and ML URL classification.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                inputMode === 'text'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Raw Email / Headers</span>
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                inputMode === 'file'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .EML File</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputMode('text');
                setRawText(samplePhishing);
              }}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Phishing Attack</span>
            </button>
          </div>
        </div>

        {inputMode === 'text' ? (
          <div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste complete raw email headers and body here..."
              className="w-full p-3 font-mono text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
            <Upload className="w-8 h-8 text-outline mx-auto mb-2" />
            <p className="text-xs font-semibold text-on-surface">Drag and drop your .eml / RFC 822 file here</p>
            <p className="text-[11px] text-outline mt-0.5">Supports MIME multipart, headers, and attachments metadata</p>
            <input
              type="file"
              accept=".eml,.msg,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-3 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-container cursor-pointer"
            />
            {selectedFile && (
              <div className="mt-2 text-xs font-mono font-medium text-secondary">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-error-container/40 border border-error/30 rounded-lg text-xs text-error flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-outline">
            Privacy: Raw email bodies are not persisted to database.
          </span>
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deconstructing & Running ML...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Execute Complete Forensic Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Forensic Results Panel */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Verdict & Risk Banner */}
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/60 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.verdict} size="lg" />
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Confidence Level: <strong className="text-on-surface">{result.confidence}</strong>
                  </span>
                  <span className="text-xs font-mono text-outline">ID: {result.scan_id}</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">
                  {result.subject || '(No Subject Provided)'}
                </h3>
                <div className="text-xs font-mono text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1">
                  <span>From: <strong className="text-on-surface">{result.sender || 'Unknown'}</strong></span>
                  {result.reply_to && <span>Reply-To: <strong className="text-error">{result.reply_to}</strong></span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateCase}
                  disabled={caseCreated}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    caseCreated
                      ? 'bg-secondary-container text-secondary'
                      : 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {caseCreated ? <CheckCircle2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  <span>{caseCreated ? 'Case Logged' : 'Create Case Triage'}</span>
                </button>
              </div>
            </div>

            {/* Risk Meter */}
            <RiskMeter score={result.risk_score} label="Aggregate Threat Risk Score" />
          </div>

          {/* Suspicious Flags Callout */}
          {result.suspicious_flags.length > 0 && (
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-error" />
                <span>Identified Forensic Anomalies & Attack Signals ({result.suspicious_flags.length})</span>
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

          {/* Authentication Card (SPF / DKIM / DMARC) */}
          <AuthResultsCard results={result.auth_results} />

          {/* NLP Threat Indicators */}
          <NlpSignalsCard signals={result.nlp_signals} />

          {/* Embedded URL ML Scan Analysis */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-feather overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Extracted Embedded URLs ({result.url_results.length}) — ML Assessment
                </h4>
              </div>
              <span className="text-[11px] text-outline font-mono">44 Feature Extraction</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-outline tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Extracted Link Target</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                    <th className="py-2.5 px-4">ML Prob.</th>
                    <th className="py-2.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {result.url_results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-outline">
                        No embedded URLs detected in message body or HTML parts.
                      </td>
                    </tr>
                  ) : (
                    result.url_results.map((u, i) => (
                      <tr key={i} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-outline">{i + 1}</td>
                        <td className="py-3 px-4 font-mono font-medium text-on-surface max-w-[360px] truncate" title={u.url}>
                          {u.url}
                        </td>
                        <td className="py-3 px-4">
                          <VerdictBadge verdict={u.verdict} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={u.risk_score >= 65 ? 'text-error' : u.risk_score >= 35 ? 'text-amber-700' : 'text-secondary'}>
                            {u.risk_score}/100
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-on-surface">{u.probability.toFixed(4)}</td>
                        <td className="py-3 px-4 font-medium text-on-surface-variant">{u.confidence}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMTP Relay Hop Visualizer */}
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather">
            <RelayPathGraph hops={result.relay_path} />
          </div>
        </div>
      )}
    </div>
  );
};
