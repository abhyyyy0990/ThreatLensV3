import React from 'react';

interface HeaderProps {
  title?: string;
  username?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, username, onLogout }) => {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 z-40 flex items-center justify-between px-space-xl gap-space-lg">
      {/* Breadcrumb + Search */}
      <div className="flex items-center gap-space-lg min-w-0 flex-1">
        <div className="flex items-center gap-2 text-on-surface-variant font-mono text-[12px] shrink-0">
          <span className="font-semibold text-secondary">ThreatLens</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-medium">{title || 'Operational Workspace'}</span>
        </div>

        {/* Indicator Omni-Search */}
        <div className="relative max-w-md w-full hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            type="text"
            placeholder="Search indicator, hash, domain, IP..."
            className="w-full h-9 pl-9 pr-14 bg-surface-container-low/70 border border-outline-variant/30 rounded-lg font-mono text-[12px] text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:bg-surface-container-lowest transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline-variant/40">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-md shrink-0">
        {/* SOC Engine Status */}
        <div className="flex items-center gap-2 px-space-sm py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="font-mono text-[10px] font-bold tracking-wide text-emerald-800 uppercase">
            SOC ENGINE ONLINE
          </span>
        </div>

        <div className="h-4 w-px bg-outline-variant/30" />

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
        </button>

        {/* Help */}
        <button
          aria-label="Help"
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>

        {/* Analyst Profile + Logout */}
        <div className="flex items-center gap-space-sm pl-space-xs border-l border-outline-variant/30">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs ring-1 ring-outline-variant/40 uppercase">
            {username ? username.slice(0, 2) : 'SA'}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-on-surface leading-none capitalize">
                {username || 'Security Analyst'}
              </span>
              <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold leading-none">
                SA
              </span>
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant leading-tight mt-0.5">Tier 2 Triage</span>
          </div>

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="ml-1 p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
