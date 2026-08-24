import React from 'react';
import { Search, Bell, HelpCircle, Activity } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-14 bg-surface border-b border-border fixed top-0 right-0 left-[260px] z-30 px-8 flex items-center justify-between">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2.5 text-xs">
        <span className="text-text-muted font-medium">ThreatLens</span>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-semibold tracking-wide">
          {title || 'Command Center'}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Modern SaaS Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search indicator, hash, domain, IP..."
            className="pl-9 pr-4 py-1.5 bg-background-subtle border border-border rounded-lg text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary w-72 transition-all"
          />
        </div>

        {/* SOC Status Pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>SOC ENGINE ONLINE</span>
        </div>

        <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
        </button>

        <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-lg transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Analyst Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary-subtle border border-primary-border text-primary flex items-center justify-center font-bold text-xs">
            SA
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-semibold text-text-primary leading-none">Security Analyst</div>
            <div className="text-[10px] text-text-muted mt-0.5">Tier 2 Triage</div>
          </div>
        </div>
      </div>
    </header>
  );
};
