import React from 'react';
import { Search, Bell, HelpCircle, Activity, Shield } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-13 bg-background/90 backdrop-blur-md border-b border-white/[0.06] fixed top-0 right-0 left-[260px] z-30 px-6 flex items-center justify-between">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-text-muted font-mono font-medium">ThreatLens</span>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-semibold tracking-wide">
          {title || 'Command Center'}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Global Search Box */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search indicator, hash, domain, IP..."
            className="pl-8.5 pr-4 py-1.5 bg-surface border border-white/[0.08] rounded-md text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 w-72 transition-all"
          />
        </div>

        {/* SOC Status Pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SOC ENGINE ONLINE</span>
        </div>

        <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/[0.05] rounded-md transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1 right-1 shadow-[0_0_6px_#FF4D67]" />
        </button>

        <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/[0.05] rounded-md transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Analyst Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <div className="w-6.5 h-6.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold text-[11px]">
            SA
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-semibold text-text-primary leading-none">SecOps Analyst</div>
            <div className="text-[10px] text-text-muted mt-0.5">Tier 2 Triage</div>
          </div>
        </div>
      </div>
    </header>
  );
};
