import React from 'react';

export interface RiskLegendProps {
  compact?: boolean;
  className?: string;
}

export const RiskLegend: React.FC<RiskLegendProps> = ({
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2.5 text-[11px] text-slate-300 ${className}`}>
        <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-800/40">
          DEMO DATA
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Risk Scale:</span>
        <span className="flex items-center gap-1 font-semibold text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          Very High (Red)
        </span>
        <span className="flex items-center gap-1 font-semibold text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-500"></span>
          High (Orange)
        </span>
        <span className="flex items-center gap-1 font-semibold text-yellow-400">
          <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
          Moderate (Yellow)
        </span>
        <span className="flex items-center gap-1 font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400/40 border border-emerald-400"></span>
          Low (No Overlay)
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-800/80 bg-slate-950/90 p-4 text-xs shadow-lg backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
          Continuous Risk Heatmap Scale
        </div>
        <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-800/40">
          DEMONSTRATION DATA
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-2 font-medium text-red-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-950 animate-pulse"></span>
            Very High Hazard
          </span>
          <span className="font-mono text-[11px] text-red-300">Score 75–100 (Red)</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-2 font-medium text-orange-400">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-orange-950"></span>
            High Hazard
          </span>
          <span className="font-mono text-[11px] text-orange-300">Score 50–74 (Orange)</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-2 font-medium text-yellow-400">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-950"></span>
            Moderate Hazard
          </span>
          <span className="font-mono text-[11px] text-yellow-300">Score 25–49 (Yellow)</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-2 font-medium text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/30 border border-emerald-400"></span>
            Low Hazard / Stable
          </span>
          <span className="font-mono text-[11px] text-slate-400">Score &lt; 25 (Minimal/No Overlay)</span>
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
        Continuous blurred Gaussian overlay preserving visible street grids and municipal placenames.
      </div>
    </div>
  );
};

