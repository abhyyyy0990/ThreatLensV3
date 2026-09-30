import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ThreatResult } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { RiskMeter } from '../components/RiskMeter';
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
    <div className="flex flex-col gap-space-lg pb-16">
      <div className="pb-space-md">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
          <span>QR Code & Quishing Threat Analyzer</span>
        </h2>
        <p className="text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
          Deconstructs QR image matrices, decodes redirect links, and inspects destination URLs via ML intelligence.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-outline-variant/20 rounded-xl p-6 text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
            <p className="text-xs font-semibold text-on-surface">Upload QR Image File (.png, .jpg, .svg)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-3 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white cursor-pointer font-mono"
            />
            {selectedFile && (
              <p className="text-xs font-mono text-secondary font-semibold mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="flex flex-col justify-center space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-on-surface-variant">Or Paste Decoded QR String / Link</label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="e.g. http://auth-qr-update.xyz/login?code=9921"
              className="w-full p-3 bg-surface border border-outline-variant/20 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-error flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:opacity-90 text-on-primary font-semibold text-xs rounded-lg shadow-button transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Decoding Matrix & Scanning...' : 'Analyze QR Payload'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-4 animate-in fade-in">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <VerdictBadge verdict={result.verdict} size="lg" />
                <span className="text-xs font-mono text-on-surface-variant">ID: {result.scan_id}</span>
              </div>
              <div className="font-mono text-xs font-bold text-on-surface mt-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                Decoded Payload: {result.url}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-on-surface-variant uppercase font-sans">Risk Score</div>
              <div className="text-2xl font-bold text-secondary">{result.risk_score}/100</div>
            </div>
          </div>

          <RiskMeter score={result.risk_score} />
        </div>
      )}
    </div>
  );
};
