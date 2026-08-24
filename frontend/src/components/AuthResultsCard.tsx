import React from 'react';
import { AuthResult } from '../types';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';

interface AuthResultsCardProps {
  results: AuthResult[];
}

export const AuthResultsCard: React.FC<AuthResultsCardProps> = ({ results }) => {
  return (
    <div className="bg-surface border border-white/[0.08] rounded-xl p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Email Authentication & Cryptographic Alignment</span>
        </h4>
        <span className="text-[10px] font-mono text-text-muted">RFC 7208 / 6376 / 7489</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {results.map((auth) => {
          const isPass = auth.status === 'PASS';
          const isFail = auth.status === 'FAIL';
          const isSoftfail = auth.status === 'SOFTFAIL';

          let statusBadgeClass = 'bg-white/5 text-text-muted border-white/10';
          let StatusIcon = HelpCircle;

          if (isPass) {
            statusBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(53,208,127,0.15)] font-bold';
            StatusIcon = ShieldCheck;
          } else if (isFail) {
            statusBadgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(255,77,103,0.15)] font-bold';
            StatusIcon = ShieldX;
          } else if (isSoftfail) {
            statusBadgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold';
            StatusIcon = ShieldAlert;
          }

          return (
            <div
              key={auth.protocol}
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2.5 transition-all ${
                isFail
                  ? 'bg-rose-500/[0.03] border-rose-500/30'
                  : isPass
                  ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                  : 'bg-surface-elevated border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-text-primary tracking-wide">{auth.protocol}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1 ${statusBadgeClass}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{auth.status}</span>
                </span>
              </div>

              <div>
                <p className="text-xs text-text-primary font-medium leading-snug">{auth.details}</p>
                <p className="text-[11px] text-text-muted mt-1 leading-tight">{auth.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
