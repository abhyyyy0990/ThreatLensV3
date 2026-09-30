import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navGroups = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard',  label: 'Dashboard',          icon: 'dashboard' },
      { id: 'email',      label: 'Email Analyzer',      icon: 'mark_email_read' },
      { id: 'url',        label: 'URL Scanner',         icon: 'link' },
      { id: 'qr',         label: 'QR Scanner',          icon: 'qr_code_scanner' },
      { id: 'screenshot', label: 'Screenshot Scanner',  icon: 'screenshot_monitor' },
      { id: 'batch',      label: 'Batch Scanner',       icon: 'layers' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'graph',  label: 'Graph Correlation', icon: 'hub' },
      { id: 'cases',  label: 'Case Management',   icon: 'folder_managed' },
    ],
  },
  {
    label: 'AI & Models',
    items: [
      { id: 'model', label: 'Model Performance', icon: 'analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings & Config', icon: 'settings' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between overflow-y-auto">
      {/* Top section */}
      <div className="flex flex-col">
        {/* Brand */}
        <div className="h-16 px-space-md flex items-center gap-space-sm border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
          <img
            src="/logo-icon.png"
            alt="ThreatLens"
            className="w-9 h-9 rounded-xl object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold tracking-tight text-on-surface truncate">
                <span className="text-[#1A3FBD]">Threat</span><span className="text-[#1E7EF5]">Lens</span>
              </span>
              <span className="font-mono text-[10px] px-1 rounded bg-surface-container-highest text-secondary font-semibold leading-none py-0.5">v3.0</span>
            </div>
            <span className="font-mono text-[9px] text-on-surface-variant truncate uppercase tracking-wider">Detect • Analyze • Stay Safe</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col py-space-sm px-space-xs gap-space-xs">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-space-md pt-space-sm pb-space-xs">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                  {group.label}
                </span>
              </div>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-space-sm px-space-md py-1.5 rounded-lg text-left transition-all text-[13px] font-medium ${
                      isActive
                        ? 'bg-surface-container-high text-on-surface font-semibold border-l-2 border-secondary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-secondary' : ''}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer — ML Engine Status */}
      <div className="p-space-sm border-t border-outline-variant/20 bg-surface-container-low/60">
        <div className="p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-on-surface">RF v001 ML Engine</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] text-on-surface-variant font-medium uppercase tracking-wide">
              Isotonic Calibration Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
