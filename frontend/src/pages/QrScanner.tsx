import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { QrCode, Upload, Search, Link2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const QrScanner: React.FC = () => {
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setError(null);
    setResult(null);

    if (!qrText.trim() && !selectedFile) {
      setError('Please provide a QR matrix image or decoded text payload.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.scanQr(qrText.trim(), selectedFile || undefined);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to scan QR code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <QrCode className="w-5 h-5 text-cyan-400" />
          <span>QR Code & Quishing Threat Analyzer</span>
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Deconstructs QR image matrices, decodes redirect links, and inspects destination URLs via ML intelligence.
        </p>
      </div>

      <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-6 text-center bg-background/50 hover:bg-background transition-colors">
            <QrCode className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-text-primary">Upload QR Image File (.png, .jpg, .svg)</p>
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

          <div className="flex flex-col justify-center space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-text-muted">Or Paste Decoded QR String / Link</label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="e.g. http://auth-qr-update.xyz/login?code=9921"
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
            {loading ? 'Decoding Matrix & Scanning...' : 'Analyze QR Payload'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <VerdictBadge verdict={result.verdict} size="lg" />
                <span className="text-xs font-mono text-text-muted">ID: {result.scan_id}</span>
              </div>
              <div className="font-mono text-xs font-bold text-text-primary mt-2 bg-background p-2.5 rounded border border-white/[0.08]">
                Decoded Payload: {result.url}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-text-muted uppercase">Risk Score</div>
              <div className="text-2xl font-bold text-cyan-400">{result.risk_score}/100</div>
            </div>
          </div>

          <RiskMeter score={result.risk_score} />
        </div>
      )}
    </div>
  );
};
