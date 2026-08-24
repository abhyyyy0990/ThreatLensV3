import React from 'react';
import { Settings as SettingsIcon, Key, Database, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <span>Platform Settings & System Configuration</span>
        </h2>
        <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
          Configure threat intelligence provider adapters, decision threshold policies, and data retention rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Intelligence API Integrations */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>External Threat Intelligence Feeds</span>
            </h3>
            <span className="text-[11px] text-text-muted font-mono">Server-side Secrets Only</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-background-subtle border border-border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-primary text-sm">Google Safe Browsing v4</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                  CONFIGURED
                </span>
              </div>
              <p className="text-xs text-text-muted">Endpoint: safebrowsing.googleapis.com</p>
            </div>

            <div className="p-4 rounded-xl bg-background-subtle border border-border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-primary text-sm">PhishTank Community Feed</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-text-muted">Polling frequency: Hourly XML dump with in-memory caching</p>
            </div>
          </div>
        </div>

        {/* Database & Retention */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>Storage & Privacy Policy</span>
            </h3>
            <span className="text-[11px] text-primary font-mono font-semibold">SQLite Active</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-2.5 border-b border-border/60">
              <span className="text-text-muted font-sans">Database File</span>
              <span className="font-semibold text-text-primary">data/threatlens_history.db</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border/60">
              <span className="text-text-muted font-sans">Raw Email Body Storage</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disabled (PII Protected)</span>
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border/60">
              <span className="text-text-muted font-sans">Default Decision Threshold</span>
              <span className="font-bold text-primary">0.390 (F1-Optimized)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
