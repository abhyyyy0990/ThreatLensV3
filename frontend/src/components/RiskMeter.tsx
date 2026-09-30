import React from 'react';

interface RiskMeterProps {
  score: number;
  label?: string;
  showDetails?: boolean;
  /** Compact circular ring variant (used in email verdict cards) */
  variant?: 'bar' | 'ring';
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  label = 'Threat Risk Score',
  showDetails = true,
  variant = 'bar',
}) => {
  const s = Math.min(100, Math.max(0, Math.round(score)));

  // Color thresholds matching Stitch design
  let trackColor  = 'bg-emerald-600';
  let textColor   = 'text-emerald-700';
  let ringColor   = 'text-emerald-600';
  let badgeStyle  = 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
  let level       = 'LOW RISK';
  let isPulsing   = false;

  if (s >= 65) {
    trackColor  = 'bg-error';
    textColor   = 'text-error';
    ringColor   = 'text-error';
    badgeStyle  = 'bg-error-container text-on-error-container border-error/30';
    level       = 'CRITICAL';
    isPulsing   = true;
  } else if (s >= 35) {
    trackColor  = 'bg-amber-500';
    textColor   = 'text-amber-700';
    ringColor   = 'text-amber-600';
    badgeStyle  = 'bg-amber-500/10 text-amber-800 border-amber-500/30';
    level       = 'SUSPICIOUS';
  }

  // SVG ring: dash-array computed from score
  const circumference = 2 * Math.PI * 15.9155;
  const dashArray = `${(s / 100) * circumference}, ${circumference}`;

  if (variant === 'ring') {
    return (
      <div className="flex items-center gap-space-md bg-error-container/20 p-space-md rounded-lg">
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-surface-container-high"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className={ringColor + ' stroke-current transition-all duration-700'}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeDasharray={dashArray}
              strokeLinecap="round"
              strokeWidth="3.8"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-[18px] font-bold leading-none ${textColor}`}>{s}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">{label}</span>
          <span className={`font-mono text-[13px] font-semibold ${textColor}`}>{s} / 100</span>
          <span className={`font-mono text-[10px] font-semibold ${textColor}`}>{level}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-bold text-[16px] leading-none ${textColor}`}>{s}</span>
          <span className="font-mono text-[11px] text-on-surface-variant">/ 100</span>
          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeStyle} ${isPulsing ? 'animate-pulse' : ''}`}>
            {level}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
        <div
          className={`h-full ${trackColor} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${s}%` }}
        />
      </div>

      {/* Scale labels */}
      {showDetails && (
        <div className="flex justify-between font-mono text-[10px] text-on-surface-variant pt-0.5">
          <span>0 (SAFE)</span>
          <span>35 (SUSPICIOUS)</span>
          <span>65 (MALICIOUS)</span>
          <span>100 (CRITICAL)</span>
        </div>
      )}
    </div>
  );
};
