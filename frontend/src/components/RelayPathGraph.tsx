import React from 'react';
import { SmtpHop } from '../types';
import { Server, ArrowRight, ShieldAlert, Globe } from 'lucide-react';

interface RelayPathGraphProps {
  hops: SmtpHop[];
}

export const RelayPathGraph: React.FC<RelayPathGraphProps> = ({ hops }) => {
  if (!hops || hops.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-text-muted bg-surface-elevated rounded-lg border border-white/[0.06]">
        No SMTP relay hop history available in message headers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>SMTP Relay Infrastructure Trace</span>
        </h4>
        <span className="text-[10px] font-mono text-text-muted">
          {hops.length} Mail Transfer Agent (MTA) Hops
        </span>
      </div>

      <div className="relative pl-6 border-l border-white/[0.12] space-y-4">
        {hops.map((hop, index) => {
          const isOrigin = index === 0;

          return (
            <div key={hop.hop_index} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-[30.5px] top-2 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center ${
                  hop.is_suspicious
                    ? 'bg-rose-500 shadow-[0_0_8px_#FF4D67]'
                    : isOrigin
                    ? 'bg-cyan-400 shadow-[0_0_8px_#00A6C6]'
                    : 'bg-emerald-400 shadow-[0_0_8px_#35D07F]'
                }`}
              />

              {/* Hop Card */}
              <div
                className={`p-3.5 rounded-lg border text-xs transition-all ${
                  hop.is_suspicious
                    ? 'bg-rose-500/[0.06] border-rose-500/30'
                    : 'bg-surface-elevated border-white/[0.06] hover:border-cyan-500/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-cyan-400 font-bold">
                      HOP #{hop.hop_index}
                    </span>
                    <span className="text-text-primary font-semibold">{hop.from_host}</span>
                    <ArrowRight className="w-3 h-3 text-text-muted" />
                    <span className="text-text-secondary">{hop.by_host}</span>
                  </div>

                  {hop.is_suspicious && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                      ANOMALOUS ORIGIN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
                  <div>
                    <span className="text-text-muted font-sans">IP:</span>{' '}
                    <span className="text-text-primary font-semibold">
                      {hop.ip || 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted font-sans">Location:</span>{' '}
                    <span className="text-text-primary">
                      {hop.city ? `${hop.city}, ${hop.country}` : hop.country || 'Unknown'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-muted font-sans">ASN:</span>{' '}
                    <span className="text-cyan-400 font-medium">{hop.asn || 'Unspecified'}</span>
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
