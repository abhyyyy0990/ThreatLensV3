import React from 'react';
import { NlpSignal } from '../types';
import { Brain, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NlpSignalsCardProps {
  signals: NlpSignal[];
}

export const NlpSignalsCard: React.FC<NlpSignalsCardProps> = ({ signals }) => {
  return (
    <div className="bg-surface border border-white/[0.08] rounded-xl p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>NLP Intent, Social Engineering & Urgency Analysis</span>
        </h4>
        <span className="text-[10px] font-mono text-text-muted">Semantic Vector Classification</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {signals.map((sig) => {
          return (
            <div
              key={sig.category}
              className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-all ${
                sig.detected
                  ? 'bg-amber-500/[0.06] border-amber-500/30 text-amber-200'
                  : 'bg-surface-elevated/40 border-white/[0.05] text-text-secondary'
              }`}
            >
              <div className="mt-0.5">
                {sig.detected ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-text-primary">{sig.category}</span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                      sig.detected
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-white/5 text-text-muted border-white/10'
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
