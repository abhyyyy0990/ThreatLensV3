import React from 'react';
import { Search, Bell, HelpCircle, Activity } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="h-14 bg-surface border-b border-outline-variant fixed top-0 right-0 left-[260px] z-30 px-8 flex items-center justify-between">
      {/* Title / Search */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-base font-bold text-on-surface leading-none">
            {title || 'Cyber Threat Operations'}
          </h1>
          {subtitle && (
            <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search indicator, hash, domain, IP..."
            className="pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary-container text-secondary">
          <Activity className="w-3.5 h-3.5" />
          <span>SOC Engine Online</span>
        </div>

        <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-error absolute top-1 right-1"></span>
        </button>

        <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest rounded-lg transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Analyst Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-outline-variant">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-outline-variant">
            SA
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-on-surface leading-tight">Security Analyst</div>
            <div className="text-[10px] text-outline">Tier 2 Triage</div>
          </div>
        </div>
      </div>
    </header>
  );
};
