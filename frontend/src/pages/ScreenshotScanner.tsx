import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { Image, Upload, Search, AlertTriangle, FileText, Terminal } from 'lucide-react';

export const ScreenshotScanner: React.FC = () => {
  const [ocrText, setOcrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleOcr = `URGENT SECURITY ALERT
Your corporate Microsoft 365 Session has encountered an unauthorized sign-in from Lagos, Nigeria.
To avoid automatic suspension of corporate assets, click here immediately:
http://microsoft-verify-session-token.net/auth/portal
IT Helpdesk Support Ticket #INC-99120`;

  const handleScan = async () => {
    setError(null);
    setResult(null);

    if (!ocrText.trim() && !selectedFile) {
      setError('Please provide an image screenshot or paste OCR extracted message text.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.scanScreenshot(ocrText.trim(), selectedFile || undefined);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze screenshot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Image className="w-5 h-5 text-cyan-400" />
          <span>Screenshot & Message Threat Analyzer</span>
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Performs optical character normalization, detects urgency language, extracts suspicious URLs, and scores visual threat vectors.
        </p>
      </div>

      <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-6 text-center bg-background/50 hover:bg-background transition-colors">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-text-primary">Upload Suspicious Screenshot / Chat Capture</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-3 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-background cursor-pointer font-mono"
            />
            {selectedFile && (
              <p className="text-xs font-mono text-cyan-400 mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-bold uppercase text-text-muted">Or Paste OCR Message Text</label>
              <button
                onClick={() => setOcrText(sampleOcr)}
                className="text-xs text-cyan-400 font-mono font-semibold hover:underline"
              >
                Load Sample Capture
              </button>
            </div>
            <textarea
              rows={5}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Paste extracted text from WhatsApp, SMS, Telegram, or email screenshot..."
              className="w-full p-2.5 bg-background border border-white/[0.08] rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/[0.08] border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-background font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(0,166,198,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Performing OCR & ML Scans...' : 'Analyze Screenshot'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <VerdictBadge verdict={result.verdict} size="lg" />
              <div className="text-xs text-text-muted font-mono">ID: {result.scan_id}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-text-muted uppercase">Risk Score</div>
              <div className="text-2xl font-bold text-cyan-400">{result.risk_score}/100</div>
            </div>
          </div>

          <RiskMeter score={result.risk_score} />

          {result.suspicious_flags && result.suspicious_flags.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <div className="text-xs font-mono font-bold uppercase text-rose-400">Attack Vector Triggers:</div>
              <div className="flex flex-wrap gap-2">
                {result.suspicious_flags.map((f: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 text-xs font-mono border border-rose-500/20">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
