import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
import { QrCode, Upload, AlertTriangle } from 'lucide-react';

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
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
          <QrCode className="w-6 h-6 text-primary" />
          <span>QR Code & Quishing Threat Analyzer</span>
        </h2>
        <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
          Deconstructs QR image matrices, decodes redirect links, and inspects destination URLs via ML intelligence.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-background-subtle/50 hover:bg-background-subtle transition-colors">
            <QrCode className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-text-primary">Upload QR Image File (.png, .jpg, .svg)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-3 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white cursor-pointer font-mono"
            />
            {selectedFile && (
              <p className="text-xs font-mono text-primary font-semibold mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="flex flex-col justify-center space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-text-muted">Or Paste Decoded QR String / Link</label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="e.g. http://auth-qr-update.xyz/login?code=9921"
              className="w-full p-3 bg-surface border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-button transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Decoding Matrix & Scanning...' : 'Analyze QR Payload'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <VerdictBadge verdict={result.verdict} size="lg" />
                <span className="text-xs font-mono text-text-muted">ID: {result.scan_id}</span>
              </div>
              <div className="font-mono text-xs font-bold text-text-primary mt-2 bg-background-subtle p-3 rounded-lg border border-border">
                Decoded Payload: {result.url}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-text-muted uppercase font-sans">Risk Score</div>
              <div className="text-2xl font-bold text-primary">{result.risk_score}/100</div>
            </div>
          </div>

          <RiskMeter score={result.risk_score} />
        </div>
      )}
    </div>
  );
};
