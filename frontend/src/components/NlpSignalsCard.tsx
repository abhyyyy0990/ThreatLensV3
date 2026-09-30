import React from 'react';
import { NlpSignal } from '../types';
interface NlpSignalsCardProps {
  signals: NlpSignal[];
}

export const NlpSignalsCard: React.FC<NlpSignalsCardProps> = ({ signals }) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-3.5">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">psychology</span>
          <span>NLP Intent, Social Engineering & Urgency Analysis</span>
        </h4>
        <span className="text-[11px] font-mono text-on-surface-variant">Semantic Signals</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signals.map((sig) => {
          return (
            <div
              key={sig.category}
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                sig.detected
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant'
              }`}
            >
              <div className="mt-0.5">
                {sig.detected ? (
                  <span className="material-symbols-outlined text-[16px] text-amber">warning</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px] text-emerald">check_circle</span>
                )}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-on-surface">{sig.category}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                      sig.detected
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {sig.detected ? 'DETECTED' : 'CLEAR'}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-snug">{sig.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
