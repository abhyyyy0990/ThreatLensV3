import React from 'react';
import { Settings as SettingsIcon, Shield, Server, Key, Database, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>Platform Settings & System Configuration</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Configure threat intelligence provider adapters, decision threshold policies, and data retention rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Intelligence API Integrations */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>External Threat Intelligence Feeds</span>
            </h3>
            <span className="text-[10px] text-outline">Server-side Secrets Only</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface">Google Safe Browsing API v4</span>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary text-[10px] font-bold">
                  Configured
                </span>
              </div>
              <p className="text-[11px] text-outline">Endpoint: safebrowsing.googleapis.com</p>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface">PhishTank Community Feed</span>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary text-[10px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-outline">Polling frequency: Hourly XML dump with in-memory caching</p>
            </div>
          </div>
        </div>

        {/* Database & Retention */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>Storage & Privacy Policy</span>
            </h3>
            <span className="text-[10px] text-outline">SQLite Persistence</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-outline">Database File</span>
              <span className="font-mono font-semibold">data/threatlens_history.db</span>
            </div>
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-outline">Raw Email Content Storage</span>
              <span className="font-semibold text-secondary flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disabled (PII Protected)</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-outline">Default Decision Threshold</span>
              <span className="font-mono font-bold text-primary">0.390 (F1-Optimized)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
