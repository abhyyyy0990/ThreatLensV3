import React from 'react';
import { SmtpHop } from '../types';
interface RelayPathGraphProps {
  hops: SmtpHop[];
}

export const RelayPathGraph: React.FC<RelayPathGraphProps> = ({ hops }) => {
  if (!hops || hops.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-lg border border-outline-variant/20">
        No SMTP relay hop history available in message headers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">dns</span>
          <span>SMTP Relay Infrastructure Trace</span>
        </h4>
        <span className="text-[11px] font-mono text-on-surface-variant">
          {hops.length} Mail Transfer Agent (MTA) Hops
        </span>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
        {hops.map((hop, index) => {
          const isOrigin = index === 0;

          return (
            <div key={hop.hop_index} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full border-2 border-surface flex items-center justify-center ${
                  hop.is_suspicious
                    ? 'bg-red-500 ring-2 ring-red-100'
                    : isOrigin
                    ? 'bg-primary ring-2 ring-blue-100'
                    : 'bg-emerald-500 ring-2 ring-emerald-100'
                }`}
              />

              {/* Hop Card */}
              <div
                className={`p-4 rounded-xl border text-xs transition-colors ${
                  hop.is_suspicious
                    ? 'bg-error-container/10 border-error/20'
                    : 'bg-surface border-outline-variant/20 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-bold">
                      HOP #{hop.hop_index}
                    </span>
                    <span className="text-on-surface font-semibold">{hop.from_host}</span>
                    <span className="material-symbols-outlined text-[12px] text-on-surface">arrow_forward</span>
                    <span className="text-on-surface-variant">{hop.by_host}</span>
                  </div>

                  {hop.is_suspicious && (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-error border border-red-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                      ANOMALOUS ORIGIN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2.5 border-t border-outline-variant/20/60 text-[11px] font-mono">
                  <div>
                    <span className="text-on-surface-variant font-sans">IP:</span>{' '}
                    <span className="text-on-surface font-semibold">
                      {hop.ip || 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-sans">Location:</span>{' '}
                    <span className="text-on-surface">
                      {hop.city ? `${hop.city}, ${hop.country}` : hop.country || 'Unknown'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-on-surface-variant font-sans">ASN:</span>{' '}
                    <span className="text-secondary font-medium">{hop.asn || 'Unspecified'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
