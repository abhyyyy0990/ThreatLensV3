import React from 'react';
import { AuthResult } from '../types';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';

interface AuthResultsCardProps {
  results: AuthResult[];
}

export const AuthResultsCard: React.FC<AuthResultsCardProps> = ({ results }) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-3.5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Email Authentication & Cryptographic Alignment</span>
        </h4>
        <span className="text-[11px] font-mono text-text-muted">RFC 7208 / 6376 / 7489</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {results.map((auth) => {
          const isPass = auth.status === 'PASS';
          const isFail = auth.status === 'FAIL';
          const isSoftfail = auth.status === 'SOFTFAIL';

          let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
          let StatusIcon = HelpCircle;

          if (isPass) {
            statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
            StatusIcon = ShieldCheck;
          } else if (isFail) {
            statusBadgeClass = 'bg-red-50 text-red-700 border-red-200 font-semibold';
            StatusIcon = ShieldX;
          } else if (isSoftfail) {
            statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
            StatusIcon = ShieldAlert;
          }

          return (
            <div
              key={auth.protocol}
              className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-2.5 transition-colors ${
                isFail
                  ? 'bg-red-50/40 border-red-200'
                  : isPass
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-background-subtle border-border'
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
