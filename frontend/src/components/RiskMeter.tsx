import React from 'react';

interface RiskMeterProps {
  score: number;
  label?: string;
  showDetails?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, label = 'Threat Risk Index', showDetails = true }) => {
  const s = Math.min(100, Math.max(0, Math.round(score)));

  let trackColor = 'bg-emerald-500 shadow-[0_0_12px_rgba(53,208,127,0.5)]';
  let textColor = 'text-emerald-400';
  let level = 'LOW RISK';

  if (s >= 65) {
    trackColor = 'bg-rose-500 shadow-[0_0_12px_rgba(255,77,103,0.5)]';
    textColor = 'text-rose-400';
    level = 'CRITICAL SEVERITY';
  } else if (s >= 35) {
    trackColor = 'bg-amber-400 shadow-[0_0_12px_rgba(245,185,66,0.5)]';
    textColor = 'text-amber-400';
    level = 'SUSPICIOUS / ELEVATED';
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider font-sans">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-bold text-base ${textColor}`}>{s}</span>
          <span className="text-[11px] text-text-muted">/ 100</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 ${textColor}`}>
            {level}
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full ${trackColor} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${s}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between text-[10px] font-mono text-text-muted pt-0.5">
          <span>00 (CLEAN)</span>
          <span>35 (SUSPICIOUS)</span>
          <span>65 (MALICIOUS)</span>
          <span>100 (CRITICAL)</span>
        </div>
      )}
    </div>
  );
};
