import React from 'react';
import { NlpSignal } from '../types';
import { Brain, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NlpSignalsCardProps {
  signals: NlpSignal[];
}

export const NlpSignalsCard: React.FC<NlpSignalsCardProps> = ({ signals }) => {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather space-y-3">
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span>NLP Intent & Social Engineering Threat Analysis</span>
        </h4>
        <span className="text-[11px] text-outline">Semantic Analysis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {signals.map((sig) => {
          return (
            <div
              key={sig.category}
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                sig.detected
                  ? 'bg-amber-50/60 border-amber-300/80 text-amber-950'
                  : 'bg-surface-container-low/50 border-outline-variant/60 text-on-surface-variant'
              }`}
            >
              <div className="mt-0.5">
                {sig.detected ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                )}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[12px]">{sig.category}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      sig.detected ? 'bg-amber-200 text-amber-900' : 'bg-surface-container-highest text-outline'
                    }`}
                  >
                    {sig.detected ? 'Detected' : 'Clear'}
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
