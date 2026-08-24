import React from 'react';
import { AlertTriangle, CheckCircle, Zap, AlertCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'Malicious' | 'Safe' | 'Suspicious' | 'Error' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const v = (verdict || 'Safe').toLowerCase();

  let styles = 'bg-surface-container-highest text-on-surface-variant border-outline-variant';
  let Icon = AlertCircle;
  let label = verdict;

  if (v.includes('malicious') || v.includes('phish') || v.includes('critical') || v.includes('high')) {
    styles = 'bg-error-container text-error border-error/30 font-bold';
    Icon = AlertTriangle;
    label = 'Malicious';
  } else if (v.includes('suspicious') || v.includes('medium') || v.includes('warn')) {
    styles = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    Icon = Zap;
    label = 'Suspicious';
  } else if (v.includes('safe') || v.includes('clean') || v.includes('low') || v.includes('benign')) {
    styles = 'bg-secondary-container text-secondary border-secondary/30 font-bold';
    Icon = CheckCircle;
    label = 'Safe';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wide uppercase ${styles} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
