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
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <span>QR Code & Quishing Threat Scanner</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Deconstructs QR image matrices, decodes redirect links, and inspects destination URLs via ML intelligence.
        </p>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
            <QrCode className="w-8 h-8 text-outline mx-auto mb-2" />
            <p className="text-xs font-semibold text-on-surface">Upload QR Image File (.png, .jpg, .svg)</p>
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

          <div className="flex flex-col justify-center space-y-2">
            <label className="text-xs font-bold uppercase text-outline">Or Paste Decoded QR String / Link</label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="e.g. http://auth-qr-update.xyz/login?code=9921"
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
            {loading ? 'Decoding Matrix & Scanning...' : 'Analyze QR Payload'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <VerdictBadge verdict={result.verdict} size="lg" />
                <span className="text-xs font-mono text-outline">ID: {result.scan_id}</span>
              </div>
              <div className="font-mono text-xs font-bold text-on-surface mt-2 bg-surface-container-low p-2 rounded">
                Decoded Payload: {result.url}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-outline">Risk Level</div>
              <div className="text-2xl font-bold">{result.risk_score}/100</div>
            </div>
          </div>

          <RiskMeter score={result.risk_score} />
        </div>
      )}
    </div>
  );
};
