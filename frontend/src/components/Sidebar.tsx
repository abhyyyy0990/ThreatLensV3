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
  Shield,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
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
    { id: 'model', label: 'Model Performance', icon: Cpu },
  ];

  return (
    <aside className="w-[260px] h-screen bg-surface-container-low border-r border-outline-variant flex flex-col fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-outline-variant flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-[17px] font-bold text-primary tracking-tight leading-tight">
            ThreatLens
          </div>
          <div className="text-[10px] text-outline font-semibold tracking-wider uppercase">
            Cyber Intelligence
          </div>
        </div>
      </div>

      {/* Nav Section: Scanners */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-outline">
            Threat Scanners
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-outline'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Nav Section: Forensics & Intelligence */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-outline">
            Forensics & Intelligence
          </div>
          <nav className="space-y-0.5">
            {intelItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-outline'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-outline-variant">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          <Settings className="w-4 h-4 text-outline" />
          <span>Settings & Config</span>
        </button>
      </div>
    </aside>
  );
};
