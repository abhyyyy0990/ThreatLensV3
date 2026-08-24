import React from 'react';
import { AlertTriangle, CheckCircle, Zap, AlertCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'Malicious' | 'Safe' | 'Suspicious' | 'Error' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const v = (verdict || 'Safe').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = AlertCircle;
  let label = verdict;

  if (v.includes('malicious') || v.includes('phish') || v.includes('critical') || v.includes('high')) {
    styles = 'bg-red-50 text-red-700 border-red-200 font-semibold';
    Icon = AlertTriangle;
    label = 'MALICIOUS';
  } else if (v.includes('suspicious') || v.includes('medium') || v.includes('warn')) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    Icon = Zap;
    label = 'SUSPICIOUS';
  } else if (v.includes('safe') || v.includes('clean') || v.includes('low') || v.includes('benign')) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    Icon = CheckCircle;
    label = 'SAFE';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono',
    lg: 'text-xs px-3.5 py-1.5 gap-2 font-mono font-bold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wider uppercase transition-colors ${styles} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
