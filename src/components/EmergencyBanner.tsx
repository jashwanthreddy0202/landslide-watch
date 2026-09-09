import React from 'react';
import { AlertCircle, ChevronRight, Clock } from 'lucide-react';

interface EmergencyBannerProps {
  onOpenEvacuationProtocol: () => void;
  lastSyncTime?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  onOpenEvacuationProtocol,
  lastSyncTime = '14:28:02 IST',
}) => {
  return (
    <div className="relative border-b border-red-900/60 bg-gradient-to-r from-red-950/90 via-red-900/40 to-slate-950 px-4 py-2 text-xs sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 font-bold uppercase tracking-wider text-white shadow-sm shadow-red-950">
            <AlertCircle className="h-3 w-3 animate-pulse" />
            Active Monsoon Alert
          </span>
          <span className="font-semibold text-red-200">
            Level 3 Trigger:
          </span>
          <span className="text-slate-200">
            Saturated slope conditions across Eastern Aizawl Ridgeline. Precautionary travel advisory active along NH-54 & Zemabawk bypass.
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <div className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>Telemetry Synced: <strong className="text-slate-300 font-mono">{lastSyncTime}</strong></span>
          </div>

          <button
            id="emergency-protocol-btn"
            onClick={onOpenEvacuationProtocol}
            className="group flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>Read Evacuation Protocol</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
