import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Activity, CloudRain, ShieldAlert, Cpu, CheckCircle2, Sliders } from 'lucide-react';
import { CityHazardOverview, SimulationScenario } from '../types';

interface TelemetrySnapshotProps {
  overview: CityHazardOverview;
  onRefresh: () => void;
  onViewGis: () => void;
  scenarios?: SimulationScenario[];
  onApplyScenario?: (id: string) => Promise<void>;
}

export const TelemetrySnapshot: React.FC<TelemetrySnapshotProps> = ({
  overview,
  onRefresh,
  onViewGis,
  scenarios = [],
  onApplyScenario,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('current-monsoon');
  const [applyingScenario, setApplyingScenario] = useState(false);

  const handleRefreshClick = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleScenarioChange = async (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    if (onApplyScenario) {
      setApplyingScenario(true);
      try {
        await onApplyScenario(scenarioId);
      } finally {
        setApplyingScenario(false);
      }
    }
  };

  return (
    <section className="border-t border-slate-800/80 bg-gradient-to-b from-[#070b14] via-[#091122] to-[#070b14] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-400 uppercase">
              <span>LIVE TELEMETRY SNAPSHOT</span>
              <span>•</span>
              <span className="text-amber-400">DEMO DATA</span>
              <span>•</span>
              <span>PHASE 1 ENGINE</span>
            </div>
            <h2 className="mt-1 font-['Chakra_Petch'] text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Current Situation in Aizawl Urban Ridge
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Synthesized demonstration feed from automated tipping-bucket weather stations, borehole inclinometers, and 10m topological slope rasters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Last updated status */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">Last updated:</span>
              <span className="font-mono font-bold text-white">{overview.lastSyncTime || '14:28:02 IST'}</span>
              <span className="rounded bg-amber-950/80 px-1 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-800/40">
                DEMO DATA
              </span>
            </div>

            <button
              id="refresh-telemetry-btn"
              onClick={handleRefreshClick}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 shadow-sm transition hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>

            <button
              id="full-gis-view-btn"
              onClick={onViewGis}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-cyan-900/50 transition hover:bg-cyan-500"
            >
              <span>Full GIS View</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Phase 1 Scenario Simulation Switcher */}
        {scenarios.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 px-2 font-medium text-slate-400">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Simulate Demonstration Scenario:</span>
            </div>
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                disabled={applyingScenario}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  selectedScenario === sc.id
                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {sc.name}
              </button>
            ))}
          </div>
        )}

        {/* 4 Telemetry Stat Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Current Risk Card (Demonstration) */}
          <div className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Current Risk Level
                </span>
                <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/40">
                  DEMO DATA
                </span>
              </div>

              <div className="mt-4">
                <div className="font-['Chakra_Petch'] text-2xl font-bold tracking-tight text-orange-400">
                  {overview.alertLevel}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {overview.alertDescription}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/70">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Threat Score:</span>
                <span className="font-mono font-bold text-orange-400">
                  {overview.cityThreatScore} / 100
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                  style={{ width: `${overview.cityThreatScore}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-400">
                <span>0 LOW</span>
                <span>50 MOD</span>
                <span>100 V.HIGH</span>
              </div>
            </div>
          </div>

          {/* Card 2: Rainfall Demonstration Card */}
          <div className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Rainfall Demonstration (24h)
                </span>
                <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/40">
                  DEMO DATA
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-['Chakra_Petch'] text-3xl font-bold tracking-tight text-cyan-300">
                  {overview.cumulativeRainfall24h}
                </span>
                <span className="text-sm font-semibold text-cyan-400">mm</span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 font-medium">
                <CloudRain className="h-3.5 w-3.5 shrink-0" />
                <span>+{overview.rainfallThresholdExcess}mm above trigger threshold</span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800/70 pt-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Peak Intensity:</span>
                <span className="font-mono font-bold text-slate-200">
                  {overview.peakIntensityMmHr} mm/hr ({overview.peakIntensityStation})
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: High-Risk Areas Count Card */}
          <div className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  High-Risk Areas Count
                </span>
                <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/40">
                  DEMO DATA
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-['Chakra_Petch'] text-3xl font-bold tracking-tight text-white">
                  {overview.activeDangerZonesCount}
                </span>
                <span className="text-sm font-semibold text-slate-300">Monitored Areas</span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-2">
                Thuampui, Zemabawk, Bawngkawn South, & Durtlang Corridor under highest surveillance
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-slate-800/70 pt-3">
              <span className="rounded-md bg-red-950 px-2 py-0.5 text-[11px] font-bold text-red-400 ring-1 ring-red-500/30">
                {overview.criticalWardsCount} Critical
              </span>
              <span className="rounded-md bg-orange-950 px-2 py-0.5 text-[11px] font-bold text-orange-400 ring-1 ring-orange-500/30">
                {overview.severeWardsCount} Severe
              </span>
              <span className="rounded-md bg-yellow-950 px-2 py-0.5 text-[11px] font-bold text-yellow-400 ring-1 ring-yellow-500/30">
                {overview.watchWardsCount} Watch
              </span>
            </div>
          </div>

          {/* Card 4: Grid Calculation Engine */}
          <div className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Phase 1 Risk Engine
                </span>
                <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/40">
                  DEMO DATA
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-['Chakra_Petch'] text-3xl font-bold tracking-tight text-white">
                  {overview.gridCellsCount.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-slate-300">DEM Cells</span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                10m LiDAR DEM synchronized. Transparent weighted heuristic calculation active.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-800/70 pt-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>{overview.sensorsOnlinePercent}% Sensors Online</span>
              </div>
              <span className="font-mono text-slate-400">
                Latency {overview.calculationLatencySeconds}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
