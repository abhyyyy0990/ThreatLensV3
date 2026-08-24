import React from 'react';

interface RiskMeterProps {
  score: number;
  label?: string;
  showDetails?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, label = 'Threat Risk Score', showDetails = true }) => {
  const s = Math.min(100, Math.max(0, Math.round(score)));

  let trackColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let level = 'LOW RISK';

  if (s >= 65) {
    trackColor = 'bg-red-500';
    textColor = 'text-red-700';
    badgeColor = 'bg-red-50 text-red-700 border-red-200';
    level = 'CRITICAL SEVERITY';
  } else if (s >= 35) {
    trackColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    level = 'SUSPICIOUS / ELEVATED';
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider font-sans">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-bold text-base ${textColor}`}>{s}</span>
          <span className="text-[11px] text-text-muted">/ 100</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
            {level}
          </span>
        </div>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${trackColor} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${s}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between text-[10px] font-mono text-text-muted pt-0.5">
          <span>0 (SAFE)</span>
          <span>35 (SUSPICIOUS)</span>
          <span>65 (MALICIOUS)</span>
          <span>100 (CRITICAL)</span>
        </div>
      )}
    </div>
  );
};
