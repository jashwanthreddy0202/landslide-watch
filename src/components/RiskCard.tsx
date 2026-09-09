import React from 'react';
import { MapPin, Droplets, Mountain, Activity, ArrowRight } from 'lucide-react';
import { LocationRisk } from '../types';
import { RiskBadge } from './RiskBadge';

export interface RiskCardProps {
  location: LocationRisk;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  location,
  onSelect,
  selected = false,
}) => {
  const isCritical = location.riskLevel === 'Critical';
  const isSevere = location.riskLevel === 'Severe';

  const borderColor = selected
    ? 'border-cyan-400 ring-2 ring-cyan-500/30'
    : isCritical
    ? 'border-red-800/60 hover:border-red-600'
    : isSevere
    ? 'border-orange-800/60 hover:border-orange-600'
    : 'border-slate-800 hover:border-slate-700';

  return (
    <div
      onClick={() => onSelect && onSelect(location.id)}
      className={`group relative flex flex-col justify-between rounded-2xl border bg-slate-950/80 p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${borderColor}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location.ward}
            </span>
            <h3 className="mt-1 font-['Chakra_Petch'] text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              {location.name}
            </h3>
          </div>
          <RiskBadge
            level={location.riskLevel}
            factorOfSafety={location.factorOfSafety}
            size="xs"
          />
        </div>

        {/* Telemetry quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 text-center text-[11px]">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Mountain className="h-3 w-3" />
              <span>Slope</span>
            </div>
            <div className="mt-0.5 font-mono font-bold text-slate-200">
              {location.slopeGradientDeg}°
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Droplets className="h-3 w-3" />
              <span>Pore P.</span>
            </div>
            <div className="mt-0.5 font-mono font-bold text-slate-200">
              {location.hydrology.porePressureKPa} kPa
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400">
              <Activity className="h-3 w-3" />
              <span>Strain</span>
            </div>
            <div className="mt-0.5 font-mono font-bold text-slate-200">
              {location.hydrology.piezometerShiftMmHr} mm/h
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400 line-clamp-2">
          {location.overviewNotice}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
        <span className="text-[11px] text-slate-500">
          Ref: {location.evacuation.name}
        </span>
        <button
          type="button"
          className="flex items-center gap-1 font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors"
        >
          <span>View Telemetry</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
