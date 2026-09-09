import React from 'react';
import { Compass, CheckCircle2, Layers, Mountain, Radio, CloudRain, LifeBuoy } from 'lucide-react';

interface InteractiveGisTeaserProps {
  onOpenMap: () => void;
}

export const InteractiveGisTeaser: React.FC<InteractiveGisTeaserProps> = ({ onOpenMap }) => {
  return (
    <section className="border-t border-slate-800/80 bg-gradient-to-b from-[#070b14] to-[#0a1120] py-14 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Descriptions & Pills */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-400 uppercase">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span>INTERACTIVE GIS ENGINE</span>
            </div>

            <h2 className="mt-2 font-['Chakra_Petch'] text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Inspect Every Slope, Drainage, and Settlement in High-Fidelity
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Switch between raw satellite imagery, 10m topological hillshading, slope stability radar, pore-water piezometers, and simulated live rain forecasts across all 19 Aizawl Municipal Corporation wards.
            </p>

            {/* Feature Pills */}
            <div className="mt-6 flex flex-wrap gap-2.5 text-xs">
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-300">
                <Mountain className="h-3.5 w-3.5 text-cyan-400" />
                10m Slope Gradients
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-300">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                Inclinometer Nodes
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-300">
                <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                Live Doppler Inflow
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-300">
                <LifeBuoy className="h-3.5 w-3.5 text-cyan-400" />
                Safe Evacuation Paths
              </span>
            </div>

            <div className="mt-8">
              <button
                id="open-interactive-map-btn"
                onClick={onOpenMap}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-500"
              >
                <Compass className="h-4 w-4" />
                <span>Open Interactive Risk Map</span>
              </button>
            </div>
          </div>

          {/* Right Column: Layer Status Display Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-cyan-900/40 bg-slate-950/90 p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>ACTIVE LAYERS (4/6)</span>
                </div>
                <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 ring-1 ring-cyan-500/30">
                  LIVE SYNC
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="font-medium">AI Hazard Heatmap</span>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]"></span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">📡</span>
                    <span className="font-medium">Displacement Velocity</span>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🌧️</span>
                    <span className="font-medium">Rainfall Accumulation</span>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]"></span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">🦺</span>
                    <span className="font-medium">Evacuation Corridors</span>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span>
                </div>
              </div>

              {/* Calibration Notice */}
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-cyan-900/30 bg-cyan-950/30 p-3 text-[11px] text-cyan-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <span>
                  Calibrated against Geological Survey of India historical slip data (2017-2024).
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
