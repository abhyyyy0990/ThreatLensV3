import React from 'react';
import { NlpSignal } from '../types';
import { Brain, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NlpSignalsCardProps {
  signals: NlpSignal[];
}

export const NlpSignalsCard: React.FC<NlpSignalsCardProps> = ({ signals }) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-3.5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span>NLP Intent, Social Engineering & Urgency Analysis</span>
        </h4>
        <span className="text-[11px] font-mono text-text-muted">Semantic Signals</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signals.map((sig) => {
          return (
            <div
              key={sig.category}
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                sig.detected
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-background-subtle border-border text-text-secondary'
              }`}
            >
              <div className="mt-0.5">
                {sig.detected ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-text-primary">{sig.category}</span>
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
                <p className="text-[11px] text-text-secondary leading-snug">{sig.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
