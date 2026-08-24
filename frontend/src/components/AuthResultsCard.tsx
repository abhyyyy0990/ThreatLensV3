import React from 'react';
import { AuthResult } from '../types';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';

interface AuthResultsCardProps {
  results: AuthResult[];
}

export const AuthResultsCard: React.FC<AuthResultsCardProps> = ({ results }) => {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-feather space-y-3">
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Sender Authentication (SPF / DKIM / DMARC)</span>
        </h4>
        <span className="text-[11px] text-outline">RFC Compliance & Alignment</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {results.map((auth) => {
          const isPass = auth.status === 'PASS';
          const isFail = auth.status === 'FAIL';
          const isSoftfail = auth.status === 'SOFTFAIL';

          let statusBadgeClass = 'bg-surface-container-highest text-on-surface-variant';
          let StatusIcon = HelpCircle;

          if (isPass) {
            statusBadgeClass = 'bg-secondary-container text-secondary font-bold';
            StatusIcon = ShieldCheck;
          } else if (isFail) {
            statusBadgeClass = 'bg-error-container text-error font-bold';
            StatusIcon = ShieldX;
          } else if (isSoftfail) {
            statusBadgeClass = 'bg-amber-100 text-amber-800 font-bold';
            StatusIcon = ShieldAlert;
          }

          return (
            <div
              key={auth.protocol}
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                isFail
                  ? 'bg-error-container/20 border-error/30'
                  : isPass
                  ? 'bg-secondary-container/10 border-secondary/30'
                  : 'bg-surface-container-low border-outline-variant'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-on-surface">{auth.protocol}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${statusBadgeClass}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{auth.status}</span>
                </span>
              </div>

              <div>
                <p className="text-[11px] text-on-surface font-medium leading-snug">{auth.details}</p>
                <p className="text-[10px] text-outline mt-1 leading-tight">{auth.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
