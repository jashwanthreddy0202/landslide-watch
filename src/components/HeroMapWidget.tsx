import React, { useState } from 'react';
import { Activity, ArrowUpRight, Radio } from 'lucide-react';
import { LocationRisk } from '../types';

interface HeroMapWidgetProps {
  locations: LocationRisk[];
  onSelectLocation: (id: string) => void;
}

export const HeroMapWidget: React.FC<HeroMapWidgetProps> = ({ locations, onSelectLocation }) => {
  const defaultLoc = locations.find((l) => l.id === 'thuampui-zemabawk') || locations[0];
  const [selectedId, setSelectedId] = useState<string>(defaultLoc?.id || 'thuampui-zemabawk');

  const active = locations.find((l) => l.id === selectedId) || defaultLoc;

  // Key visual hotspot nodes positioned along Aizawl's North-South ridge graphic
  const hotspots = [
    { id: 'durtlang-leitan', name: 'Durtlang', x: 42, y: 18, level: 'Critical' },
    { id: 'thuampui-zemabawk', name: 'Thuampui Bypass', x: 68, y: 32, level: 'Critical' },
    { id: 'bawngkawn-south', name: 'Bawngkawn', x: 55, y: 44, level: 'Severe' },
    { id: 'laipuitlang-ridge', name: 'Laipuitlang', x: 34, y: 52, level: 'Critical' },
    { id: 'chaltlang-peak', name: 'Chaltlang', x: 48, y: 38, level: 'Watch' },
    { id: 'ramhlun-vengthlang', name: 'Ramhlun', x: 64, y: 58, level: 'Severe' },
    { id: 'khatla-south', name: 'Khatla S.', x: 38, y: 70, level: 'Severe' },
    { id: 'kulikawn-slope', name: 'Kulikawn', x: 44, y: 82, level: 'Severe' },
  ];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-cyan-900/40 bg-slate-950/80 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
          </span>
          <span className="font-['Chakra_Petch'] text-xs font-bold tracking-wider text-slate-100 uppercase">
            {active?.name ? `${active.name.toUpperCase()} HOTSPOT` : 'AIZAWL URBAN RIDGE'}
          </span>
          <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-red-500/30">
            {active?.riskLevel?.toUpperCase() || 'CRITICAL'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/40">
            DEMO DATA
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Risk Map Preview</span>
          </span>
        </div>
      </div>

      {/* Map Graphic Canvas with Contour Lines */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gradient-to-b from-[#060c18] to-[#040810]">
        {/* SVG Topographical Contour Lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-60 pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 400 300"
        >
          <defs>
            <linearGradient id="contourGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#083344" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="hazardGlow" cx="68%" cy="32%" r="35%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Hazard field heat glow */}
          <rect width="400" height="300" fill="url(#hazardGlow)" />

          {/* Contour elevation paths modeling Aizawl North-South ridge */}
          <path
            d="M 190,10 C 195,60 210,120 200,180 C 190,230 180,270 185,295"
            fill="none"
            stroke="#155e75"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <path
            d="M 160,20 C 175,70 185,110 175,170 C 165,220 150,260 160,290"
            fill="none"
            stroke="#0e7490"
            strokeWidth="0.8"
          />
          <path
            d="M 220,25 C 240,75 250,130 235,185 C 225,235 215,270 210,290"
            fill="none"
            stroke="#0e7490"
            strokeWidth="0.8"
          />
          <path
            d="M 130,40 C 150,90 160,130 150,190 C 140,240 120,270 135,295"
            fill="none"
            stroke="#164e63"
            strokeWidth="0.6"
          />
          <path
            d="M 255,45 C 280,95 290,150 270,205 C 255,250 245,280 240,295"
            fill="none"
            stroke="#164e63"
            strokeWidth="0.6"
          />
          <path
            d="M 100,60 C 120,110 130,150 120,210 C 110,260 90,285 105,298"
            fill="none"
            stroke="#083344"
            strokeWidth="0.5"
          />
          <path
            d="M 290,70 C 320,120 330,170 310,225 C 295,265 285,290 275,298"
            fill="none"
            stroke="#083344"
            strokeWidth="0.5"
          />

          {/* Fault scar line */}
          <path
            d="M 250,80 Q 280,110 265,150 T 240,210"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.2"
            strokeDasharray="2 3"
          />
        </svg>

        {/* Hotspot Interactive Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {hotspots.map((spot) => {
            const isSelected = spot.id === selectedId;
            const isCrit = spot.level === 'Critical';
            const isSev = spot.level === 'Severe';

            return (
              <button
                key={spot.id}
                id={`hero-spot-${spot.id}`}
                onClick={() => setSelectedId(spot.id)}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none pointer-events-auto z-10"
                title={`${spot.name} (${spot.level})`}
              >
                <div className="relative flex items-center justify-center">
                  {/* Ping animation */}
                  <span
                    className={`absolute h-6 w-6 animate-ping rounded-full opacity-60 ${
                      isCrit ? 'bg-red-500' : isSev ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                  />
                  {/* Outer halo */}
                  <div
                    className={`h-3.5 w-3.5 rounded-full border-2 border-[#070b14] shadow-lg ${
                      isSelected ? 'ring-2 ring-cyan-300 ring-offset-1 ring-offset-black' : ''
                    } ${
                      isCrit ? 'bg-red-500' : isSev ? 'bg-orange-500' : 'bg-yellow-400'
                    }`}
                  />
                </div>
                <span className="absolute left-4 top-0 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-300 backdrop-blur-sm group-hover:text-cyan-300">
                  {spot.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hotspot Telemetry Inspection Section (Positioned Below Map Preview to Avoid Obscuring) */}
      {active && (
        <div className="border-t border-slate-800/80 bg-slate-950/95 p-3.5 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800/50 text-cyan-400">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-['Chakra_Petch'] text-sm font-bold text-white">
                    {active.name}
                  </span>
                  <span className="rounded bg-red-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-red-400 border border-red-800/40 shrink-0">
                    {active.failureProbability}% Risk
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                  <span>Slope: <strong className="text-slate-200 font-mono">{active.slopeGradientDeg}°</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>FoS: <strong className="text-red-400 font-mono">{active.factorOfSafety}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Strain: <strong className="text-red-400 font-mono">+{active.hydrology.piezometerShiftMmHr} mm/h</strong></span>
                </div>
              </div>
            </div>

            <button
              id="hero-widget-telemetry-link"
              onClick={() => onSelectLocation(active.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition shrink-0"
            >
              <span>View Risk Details</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Widget Footer: Legend & Geolocation Coordinates */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 bg-slate-900/70 px-4 py-2.5 text-[11px]">
        {/* Risk Index Bar */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
            Risk Index:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400">Low</span>
            <div className="h-2 w-20 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />
            <span className="text-[10px] text-red-400 font-semibold">Severe</span>
          </div>
        </div>

        {/* Spatial Coordinates */}
        <div className="font-mono text-[10px] text-slate-400">
          <span>LAT: {active?.coordinates?.lat != null ? active.coordinates.lat.toFixed(4) : '23.7300'}° N</span>{' '}
          <span className="text-slate-600">|</span>{' '}
          <span>LON: {active?.coordinates?.lng != null ? active.coordinates.lng.toFixed(4) : '92.7173'}° E</span>{' '}
          <span className="text-slate-600">|</span>{' '}
          <span className="text-cyan-300">ELEV: {active?.elevationM ?? 0}m</span>
        </div>
      </div>
    </div>
  );
};
