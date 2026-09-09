import React from 'react';
import { X, ShieldAlert, CheckSquare, MapPin, Phone, AlertTriangle } from 'lucide-react';

interface EvacuationProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvacuationProtocolModal: React.FC<EvacuationProtocolModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-red-900/60 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/40 text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">
                MSDMA AIZAWL CIVIL DEFENCE STANDARD
              </span>
              <h3 className="font-['Chakra_Petch'] text-xl font-bold text-white">
                Hillside Slope Evacuation Protocol
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-5 max-h-[65vh] space-y-5 overflow-y-auto pr-1 text-xs sm:text-sm text-slate-300">
          {/* Alert Level Thresholds */}
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
            <div className="flex items-center gap-2 font-bold text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span>When Must You Evacuate?</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-red-200/90">
              Immediate evacuation is mandated if your ward is under <strong className="text-white">CRITICAL RED ALERT</strong>, if <strong className="text-white">Factor of Safety drops below 1.00</strong>, or if you observe fresh surface tension cracks &gt; 2 cm along foundations or retaining walls.
            </p>
          </div>

          {/* 4 Action Steps */}
          <div>
            <h4 className="font-bold text-slate-100 text-sm">
              Immediate Action Checklist for Hilltop Residents
            </h4>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-900/60 p-3">
                <CheckSquare className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-slate-100">1. Cease Use of Downslope Rooms:</strong> Move family members, the elderly, and children away from ground-floor hillside cantilever rooms. Sleep in ridge-facing rooms or relocate before nightfall.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-slate-900/60 p-3">
                <CheckSquare className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-slate-100">2. Shut Off Utilities:</strong> Turn off main electrical breakers and LPG cylinder regulators to prevent post-movement fires or electrical hazards.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-slate-900/60 p-3">
                <CheckSquare className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-slate-100">3. Take Safe Corridors ONLY:</strong> Always ascend towards the central ridge spine. Never seek escape downhill into gullies, streams, or quarry depressions where saturated colluvium pools.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-slate-900/60 p-3">
                <CheckSquare className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong className="text-slate-100">4. Grab 72-Hour Emergency Go-Bag:</strong> Essential medicines, government ID proofs, torches, drinking water, and rainwear.
                </div>
              </div>
            </div>
          </div>

          {/* Key Evacuation Centers by Sector */}
          <div>
            <h4 className="font-bold text-slate-100 text-sm">
              Designated Sector Shelters in Aizawl
            </h4>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>North Sector (Durtlang/Selesih)</span>
                </div>
                <div className="mt-1 text-slate-300">
                  Presbyterian Church Hall & Durtlang Higher Secondary School
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>East Sector (Thuampui/Zemabawk)</span>
                </div>
                <div className="mt-1 text-slate-300">
                  Thuampui Community Hall & YMA Indoor Stadium
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>West Sector (Laipuitlang/Khatla)</span>
                </div>
                <div className="mt-1 text-slate-300">
                  Govt Mizo High School Complex & Khatla Community Centre
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>South Sector (Kulikawn/Melthum)</span>
                </div>
                <div className="mt-1 text-slate-300">
                  Kulikawn High School Pavilion & Melthum YMA Hall
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono">
            <Phone className="h-3.5 w-3.5 text-red-400" />
            <span>Emergency SEOC Helpline: <strong>1070</strong></span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
