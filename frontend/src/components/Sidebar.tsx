import React from 'react';
import {
  LayoutDashboard,
  Link2,
  Mail,
  QrCode,
  Image,
  Layers,
  Network,
  Briefcase,
  Cpu,
  Settings,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const operationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'email', label: 'Email Analyzer', icon: Mail },
    { id: 'url', label: 'URL Scanner', icon: Link2 },
    { id: 'qr', label: 'QR Scanner', icon: QrCode },
    { id: 'screenshot', label: 'Screenshot Scanner', icon: Image },
    { id: 'batch', label: 'Batch Scanner', icon: Layers },
  ];

  const intelItems = [
    { id: 'graph', label: 'Graph Correlation', icon: Network },
    { id: 'cases', label: 'Case Management', icon: Briefcase },
  ];

  const aiItems = [
    { id: 'model', label: 'Model Performance', icon: Cpu },
  ];

  const systemItems = [
    { id: 'settings', label: 'Settings & Config', icon: Settings },
  ];

  const renderNavGroup = (title: string, items: typeof operationItems) => (
    <div className="space-y-1">
      <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 text-left group relative ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 font-semibold border-r-2 border-cyan-400 shadow-[0_0_15px_rgba(0,166,198,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-text-muted group-hover:text-text-secondary'
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-auto shadow-[0_0_8px_#00A6C6]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-[260px] h-screen bg-background-secondary border-r border-white/[0.06] flex flex-col fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(0,166,198,0.3)]">
          <Terminal className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-text-primary tracking-tight leading-none flex items-center gap-1.5">
            <span>ThreatLens</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-400 font-mono font-semibold">
              v3.0
            </span>
          </div>
          <div className="text-[10px] text-text-muted font-medium tracking-wide mt-1">
            Cyber Intelligence Platform
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {renderNavGroup('Operations', operationItems)}
        {renderNavGroup('Intelligence', intelItems)}
        {renderNavGroup('AI & Models', aiItems)}
        {renderNavGroup('System', systemItems)}
      </div>

      {/* Footer System Status Badge */}
      <div className="p-3 border-t border-white/[0.06] bg-background/50">
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.05] flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-cyber-pulse shadow-[0_0_8px_#35D07F]" />
          <div className="text-[11px] font-mono leading-tight">
            <div className="text-text-primary font-semibold">RF v001 ML Core</div>
            <div className="text-text-muted text-[10px]">Isotonic Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
