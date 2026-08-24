import React from 'react';
import { AlertTriangle, CheckCircle, Zap, AlertCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'Malicious' | 'Safe' | 'Suspicious' | 'Error' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const v = (verdict || 'Safe').toLowerCase();

  let styles = 'bg-white/5 text-text-muted border-white/10';
  let Icon = AlertCircle;
  let label = verdict;

  if (v.includes('malicious') || v.includes('phish') || v.includes('critical') || v.includes('high')) {
    styles = 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(255,77,103,0.15)] font-bold';
    Icon = AlertTriangle;
    label = 'MALICIOUS';
  } else if (v.includes('suspicious') || v.includes('medium') || v.includes('warn')) {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,185,66,0.15)] font-bold';
    Icon = Zap;
    label = 'SUSPICIOUS';
  } else if (v.includes('safe') || v.includes('clean') || v.includes('low') || v.includes('benign')) {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(53,208,127,0.15)] font-bold';
    Icon = CheckCircle;
    label = 'CLEAN / SAFE';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono',
    lg: 'text-xs px-3.5 py-1.5 gap-2 font-mono font-bold tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wider uppercase transition-all ${styles} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
