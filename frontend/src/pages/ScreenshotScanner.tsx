import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { Image, Upload, Search, AlertTriangle, FileText } from 'lucide-react';

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
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <span>Screenshot & Message Threat Analyzer</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Performs optical character normalization, detects urgency language, extracts suspicious URLs, and scores visual threat vectors.
        </p>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
            <Upload className="w-8 h-8 text-outline mx-auto mb-2" />
            <p className="text-xs font-semibold text-on-surface">Upload Suspicious Screenshot / Chat Capture</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-2 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs font-mono text-secondary mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-outline">Or Paste OCR Message Text</label>
              <button
                onClick={() => setOcrText(sampleOcr)}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Load Sample Capture
              </button>
            </div>
            <textarea
              rows={5}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Paste extracted text from WhatsApp, SMS, Telegram, or email screenshot..."
              className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-error-container/40 border border-error/30 rounded-lg text-xs text-error flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Performing OCR & ML Scans...' : 'Analyze Screenshot'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <VerdictBadge verdict={result.verdict} size="lg" />
              <div className="text-xs text-outline font-mono">ID: {result.scan_id}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-outline">Risk Score</div>
              <div className="text-2xl font-bold">{result.risk_score}/100</div>
            </div>
          </div>

          <RiskMeter score={result.risk_score} />

          {result.suspicious_flags && result.suspicious_flags.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-outline-variant/60">
              <div className="text-xs font-bold uppercase text-error">Attack Vector Triggers:</div>
              <div className="flex flex-wrap gap-2">
                {result.suspicious_flags.map((f: string, i: number) => (
                  <span key={i} className="px-2.5 py-0.5 rounded bg-error-container text-error text-xs font-semibold">
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
