import React from 'react';
import { Settings as SettingsIcon, Key, Database, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          <span>Platform Settings & System Configuration</span>
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure threat intelligence provider adapters, decision threshold policies, and data retention rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Intelligence API Integrations */}
        <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>External Threat Intelligence Feeds</span>
            </h3>
            <span className="text-[10px] text-text-muted">Server-side Secrets Only</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-surface-elevated border border-white/[0.06] space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-primary">Google Safe Browsing v4</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  CONFIGURED
                </span>
              </div>
              <p className="text-[11px] text-text-muted font-sans">Endpoint: safebrowsing.googleapis.com</p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated border border-white/[0.06] space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-primary">PhishTank Community Feed</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-text-muted font-sans">Polling frequency: Hourly XML dump with in-memory caching</p>
            </div>
          </div>
        </div>

        {/* Database & Retention */}
        <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Storage & Privacy Policy</span>
            </h3>
            <span className="text-[10px] text-cyan-400">SQLite Active</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-muted font-sans">Database File</span>
              <span className="font-semibold text-text-primary">data/threatlens_history.db</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-muted font-sans">Raw Email Body Storage</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disabled (PII Protected)</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-text-muted font-sans">Default Decision Threshold</span>
              <span className="font-bold text-cyan-400">0.390 (F1-Optimized)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
