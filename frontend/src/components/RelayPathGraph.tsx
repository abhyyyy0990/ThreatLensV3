import React from 'react';
import { SmtpHop } from '../types';
import { Server, ArrowRight, ShieldAlert, CheckCircle2, Globe } from 'lucide-react';

interface RelayPathGraphProps {
  hops: SmtpHop[];
}

export const RelayPathGraph: React.FC<RelayPathGraphProps> = ({ hops }) => {
  if (!hops || hops.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-outline bg-surface-container-low rounded-lg border border-outline-variant">
        No SMTP relay hop history available in message headers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span>SMTP Relay Path & Mail Transfer Agent (MTA) Trace</span>
        </h4>
        <span className="text-[11px] text-outline font-medium">
          {hops.length} hop{hops.length > 1 ? 's' : ''} reconstructed
        </span>
      </div>

      <div className="relative pl-6 border-l-2 border-outline-variant/60 space-y-6">
        {hops.map((hop, index) => {
          const isOrigin = index === 0;
          const isFinal = index === hops.length - 1;

          return (
            <div key={hop.hop_index} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                  hop.is_suspicious
                    ? 'bg-error text-white'
                    : isOrigin
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-white'
                }`}
              >
                {hop.is_suspicious ? (
                  <ShieldAlert className="w-2.5 h-2.5" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>

              {/* Hop Card */}
              <div
                className={`p-3.5 rounded-lg border text-xs transition-all ${
                  hop.is_suspicious
                    ? 'bg-error-container/30 border-error/40'
                    : 'bg-white border-outline-variant hover:border-primary/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] text-on-surface-variant font-mono">
                      Hop #{hop.hop_index}
                    </span>
                    <span className="text-on-surface font-mono">{hop.from_host}</span>
                    <ArrowRight className="w-3 h-3 text-outline" />
                    <span className="text-on-surface font-mono">{hop.by_host}</span>
                  </div>

                  {hop.is_suspicious && (
                    <span className="px-2 py-0.5 rounded bg-error text-white text-[10px] font-bold uppercase tracking-wider">
                      Anomalous Origin
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/40 text-[11px] text-on-surface-variant">
                  <div>
                    <span className="text-outline">IP Address:</span>{' '}
                    <span className="font-mono font-semibold text-on-surface">
                      {hop.ip || 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline">Location:</span>{' '}
                    <span className="font-medium text-on-surface">
                      {hop.city ? `${hop.city}, ${hop.country}` : hop.country || 'Unknown'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-outline">ASN / Network:</span>{' '}
                    <span className="font-medium text-on-surface">{hop.asn || 'Unspecified'}</span>
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
