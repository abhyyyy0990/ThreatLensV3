import React from 'react';

interface VerdictBadgeProps {
  verdict: 'Malicious' | 'Safe' | 'Suspicious' | 'Error' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const v = (verdict || 'Safe').toLowerCase();

  let bgClass = 'bg-surface-container text-on-surface-variant border-outline-variant/40';
  let icon = 'help';
  let label = verdict?.toUpperCase() || 'UNKNOWN';
  let pulseClass = '';

  if (v.includes('malicious') || v.includes('phish') || v.includes('critical')) {
    bgClass = 'bg-error text-on-error border-error';
    icon = 'gpp_maybe';
    label = 'MALICIOUS';
    pulseClass = 'ring-2 ring-error/30 ring-offset-1';
  } else if (v.includes('suspicious') || v.includes('medium') || v.includes('warn')) {
    bgClass = 'bg-amber-500 text-white border-amber-600';
    icon = 'warning';
    label = 'SUSPICIOUS';
  } else if (v.includes('safe') || v.includes('clean') || v.includes('low') || v.includes('benign')) {
    bgClass = 'bg-emerald-600 text-white border-emerald-700';
    icon = 'verified_user';
    label = 'SAFE';
  } else if (v.includes('error')) {
    bgClass = 'bg-surface-container-high text-on-surface-variant border-outline-variant/30';
    icon = 'error_outline';
    label = 'ERROR';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono tracking-wider',
    md: 'text-[11px] px-2.5 py-1 gap-1.5 font-mono tracking-wider',
    lg: 'text-[12px] px-3.5 py-1.5 gap-2 font-mono font-bold tracking-widest',
  };

  const iconSize = {
    sm: 'text-[14px]',
    md: 'text-[16px]',
    lg: 'text-[18px]',
  };

  return (
    <span
      className={`inline-flex items-center rounded border uppercase font-semibold transition-all ${bgClass} ${sizeClasses[size]} ${pulseClass}`}
    >
      <span className={`material-symbols-outlined ${iconSize[size]}`}>{icon}</span>
      <span>{label}</span>
    </span>
  );
};
