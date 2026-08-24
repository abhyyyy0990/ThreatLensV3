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
  ShieldCheck,
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
      <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left ${
                isActive
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-[260px] h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
          <ShieldCheck className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <div className="text-[16px] font-bold text-text-primary tracking-tight leading-none flex items-center gap-1.5">
            <span>ThreatLens</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary-subtle text-primary font-mono font-bold">
              v3.0
            </span>
          </div>
          <div className="text-[11px] text-text-muted font-medium tracking-wide mt-1">
            Cyber Threat Intelligence
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        {renderNavGroup('Operations', operationItems)}
        {renderNavGroup('Intelligence', intelItems)}
        {renderNavGroup('AI & Models', aiItems)}
        {renderNavGroup('System', systemItems)}
      </div>

      {/* Footer System Status Badge */}
      <div className="p-3.5 border-t border-border bg-surface-muted">
        <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center gap-2.5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="text-[11px] font-mono leading-tight">
            <div className="text-text-primary font-semibold">RF v001 ML Engine</div>
            <div className="text-text-muted text-[10px]">Isotonic Calibration Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
