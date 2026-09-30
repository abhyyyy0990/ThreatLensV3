import React from 'react';
import { AuthResult } from '../types';

interface AuthResultsCardProps {
  results: AuthResult[];
}

function statusIcon(status: string): string {
  if (status === 'PASS') return 'verified_user';
  if (status === 'FAIL') return 'gpp_bad';
  if (status === 'SOFTFAIL') return 'gpp_maybe';
  return 'help';
}

function statusBadge(status: string, isFail: boolean, isPass: boolean, isSoftfail: boolean): string {
  if (isPass) return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
  if (isFail) return 'bg-error-container/60 text-on-error-container border-error/30';
  if (isSoftfail) return 'bg-amber-500/10 text-amber-800 border-amber-500/30';
  return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
}

function cardBg(isFail: boolean, isPass: boolean): string {
  if (isFail) return 'bg-error-container/10 border-error/20';
  if (isPass) return 'bg-emerald-500/5 border-emerald-500/20';
  return 'bg-surface-container-low border-outline-variant/20';
}

export const AuthResultsCard: React.FC<AuthResultsCardProps> = ({ results }) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm mb-space-md">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
          <span>Email Authentication &amp; Cryptographic Alignment</span>
        </h4>
        <span className="text-[11px] font-mono text-on-surface-variant">RFC 7208 / 6376 / 7489</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {results.map((auth) => {
          const isPass = auth.status === 'PASS';
          const isFail = auth.status === 'FAIL';
          const isSoftfail = auth.status === 'SOFTFAIL';

          return (
            <div
              key={auth.protocol}
              className={`p-space-md rounded-lg border flex flex-col justify-between gap-space-sm transition-colors ${cardBg(isFail, isPass)}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[14px] text-on-surface tracking-wide">{auth.protocol}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1 font-bold ${statusBadge(auth.status, isFail, isPass, isSoftfail)}`}>
                  <span className="material-symbols-outlined text-[14px]">{statusIcon(auth.status)}</span>
                  <span>{auth.status}</span>
                </span>
              </div>
              <div>
                <p className="text-[13px] text-on-surface font-medium leading-snug">{auth.details}</p>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-tight">{auth.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
