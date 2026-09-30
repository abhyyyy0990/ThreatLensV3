import React from 'react';
export const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-space-lg pb-16">
      <div className="pb-space-md">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px] text-secondary">settings</span>
          <span>Platform Settings & System Configuration</span>
        </h2>
        <p className="text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
          Configure threat intelligence provider adapters, decision threshold policies, and data retention rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Intelligence API Integrations */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>External Threat Intelligence Feeds</span>
            </h3>
            <span className="text-[11px] text-on-surface-variant font-mono">Server-side Secrets Only</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface text-sm">Google Safe Browsing v4</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                  CONFIGURED
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">Endpoint: safebrowsing.googleapis.com</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-on-surface text-sm">PhishTank Community Feed</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">Polling frequency: Hourly XML dump with in-memory caching</p>
            </div>
          </div>
        </div>

        {/* Database & Retention */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">database</span>
              <span>Storage & Privacy Policy</span>
            </h3>
            <span className="text-[11px] text-secondary font-mono font-semibold">SQLite Active</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-2.5 border-b border-outline-variant/20/60">
              <span className="text-on-surface-variant font-sans">Database File</span>
              <span className="font-semibold text-on-surface">data/threatlens_history.db</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-outline-variant/20/60">
              <span className="text-on-surface-variant font-sans">Raw Email Body Storage</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                <span>Disabled (PII Protected)</span>
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-outline-variant/20/60">
              <span className="text-on-surface-variant font-sans">Default Decision Threshold</span>
              <span className="font-bold text-secondary">0.390 (F1-Optimized)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
