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
  CheckCircle2,
  Briefcase,
  Sparkles,
  Shield,
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
          <Mail className="w-6 h-6 text-primary" />
          <span>Email Threat & Forensic Investigation Workspace</span>
        </h2>
        <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
          Multi-dimensional email forensic reconstruction, header spoofing analysis, SPF/DKIM/DMARC audit, and ML link assessment.
        </p>
      </div>

      {/* Input Workspace */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-primary-subtle text-primary border border-primary-border font-bold'
                  : 'text-text-secondary hover:text-text-primary bg-background-subtle'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Raw Email / Headers</span>
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                inputMode === 'file'
                  ? 'bg-primary-subtle text-primary border border-primary-border font-bold'
                  : 'text-text-secondary hover:text-text-primary bg-background-subtle'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload .EML File</span>
            </button>
          </div>

          <button
            onClick={() => {
              setInputMode('text');
              setRawText(samplePhishing);
            }}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" />
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
              className="w-full p-4 font-mono text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text-primary placeholder:text-text-muted leading-relaxed"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-background-subtle/50 hover:bg-background-subtle transition-colors">
            <Upload className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-text-primary">Drag and drop your .eml / RFC 822 file here</p>
            <p className="text-xs text-text-muted mt-1">MIME multipart, headers, and attachments metadata extracted securely</p>
            <input
              type="file"
              accept=".eml,.msg,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-4 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer font-mono"
            />
            {selectedFile && (
              <div className="mt-2.5 text-xs font-mono font-semibold text-primary">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <span className="text-xs text-text-muted font-sans">
            PII Policy: Email message body is processed in memory and never stored in history.
          </span>
          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-button transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Verdict & Risk Banner */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={result.verdict} size="lg" />
                  <span className="text-xs font-semibold text-text-secondary">
                    Confidence: <strong className="text-text-primary">{result.confidence}</strong>
                  </span>
                  <span className="text-xs font-mono text-text-muted">ID: {result.scan_id}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {result.subject || '(No Subject Provided)'}
                </h3>
                <div className="text-xs font-mono text-text-secondary flex flex-wrap gap-x-5 gap-y-1">
                  <span>From: <strong className="text-text-primary">{result.sender || 'Unknown'}</strong></span>
                  {result.reply_to && <span>Reply-To: <strong className="text-red-600">{result.reply_to}</strong></span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateCase}
                  disabled={caseCreated}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 ${
                    caseCreated
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-surface hover:bg-background-subtle text-text-primary border border-border'
                  }`}
                >
                  {caseCreated ? <CheckCircle2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  <span>{caseCreated ? 'CASE LOGGED' : 'CREATE CASE'}</span>
                </button>
              </div>
            </div>

            <RiskMeter score={result.risk_score} label="Aggregate Threat Risk Score" />
          </div>

          {/* Suspicious Flags Callout */}
          {result.suspicious_flags.length > 0 && (
            <div className="bg-surface border border-red-200 rounded-xl p-5 shadow-card space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Forensic Anomalies & Attack Signals ({result.suspicious_flags.length})</span>
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

          {/* Authentication Card (SPF / DKIM / DMARC) */}
          <AuthResultsCard results={result.auth_results} />

          {/* NLP Threat Indicators */}
          <NlpSignalsCard signals={result.nlp_signals} />

          {/* Extracted Embedded URLs ML Scan */}
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-muted flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Embedded URLs ({result.url_results.length}) — ML Assessment
                </h4>
              </div>
              <span className="text-[11px] text-text-muted font-mono">44 Feature Extraction Vector</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-background-subtle border-b border-border text-[10px] font-bold uppercase text-text-muted tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Target Link</th>
                    <th className="py-2.5 px-4">Verdict</th>
                    <th className="py-2.5 px-4">Risk Score</th>
                    <th className="py-2.5 px-4">ML Prob.</th>
                    <th className="py-2.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {result.url_results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-text-muted font-mono">
                        No embedded URLs detected in message body or HTML parts.
                      </td>
                    </tr>
                  ) : (
                    result.url_results.map((u, i) => (
                      <tr key={i} className="hover:bg-background-subtle/50 transition-colors">
                        <td className="py-3 px-4 text-text-muted">{i + 1}</td>
                        <td className="py-3 px-4 text-text-primary max-w-[360px] truncate" title={u.url}>
                          {u.url}
                        </td>
                        <td className="py-3 px-4">
                          <VerdictBadge verdict={u.verdict} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span className={u.risk_score >= 65 ? 'text-red-600' : u.risk_score >= 35 ? 'text-amber-600' : 'text-emerald-600'}>
                            {u.risk_score}/100
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-primary">{u.probability.toFixed(4)}</td>
                        <td className="py-3 px-4 text-text-secondary">{u.confidence}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMTP Relay Hop Visualizer */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
            <RelayPathGraph hops={result.relay_path} />
          </div>
        </div>
      )}
    </div>
  );
};
