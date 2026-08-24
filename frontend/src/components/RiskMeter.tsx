import React from 'react';

interface RiskMeterProps {
  score: number;
  label?: string;
  showDetails?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, label = 'Threat Risk Score', showDetails = true }) => {
  const s = Math.min(100, Math.max(0, Math.round(score)));

  let colorClass = 'bg-secondary';
  let textColor = 'text-secondary';
  let level = 'Low Risk';

  if (s >= 65) {
    colorClass = 'bg-error';
    textColor = 'text-error';
    level = 'High / Critical Risk';
  } else if (s >= 35) {
    colorClass = 'bg-amber-600';
    textColor = 'text-amber-600';
    level = 'Suspicious / Caution';
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
          {label}
        </span>
        <span className={`font-mono font-bold text-sm ${textColor}`}>
          {s} <span className="text-[11px] font-normal text-outline">/ 100 ({level})</span>
        </span>
      </div>

      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${s}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between text-[10px] text-outline pt-0.5">
          <span>0 (Safe)</span>
          <span>35 (Suspicious)</span>
          <span>65 (Malicious)</span>
          <span>100 (Critical)</span>
        </div>
      )}
    </div>
  );
};
