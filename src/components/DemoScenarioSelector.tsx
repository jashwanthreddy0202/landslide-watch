import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DemonstrationScenarioId,
  DemonstrationScenario,
  DemonstrationRiskAssessment,
  DemonstrationAlertState,
} from '../types';
import {
  DEMONSTRATION_SCENARIOS,
  DEMO_SCENARIO_EXPLANATION,
  deriveDemonstrationAlertState,
} from '../data/demonstrationScenarios';
import {
  Sliders,
  RotateCcw,
  Info,
  Droplets,
  Mountain,
  Gauge,
  History,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  Minus,
} from 'lucide-react';

export interface EnvironmentalFactorValues {
  rainfall: number;
  wetness: number;
}

export interface DemoScenarioSelectorProps {
  activeScenarioId: DemonstrationScenarioId | null;
  onSelectScenario: (scenarioId: DemonstrationScenarioId) => void;
  onResetScenario: () => void;
  isLoading?: boolean;
  error?: string | null;
  compact?: boolean;
  activeAssessment?: DemonstrationRiskAssessment | null;
  alertState?: DemonstrationAlertState | null;
  locationName?: string;
  onRetry?: () => void;

  // Dynamic Environmental Factors (Phase 1 Audited Engine)
  rainfallMm?: number;
  wetnessPercent?: number;
  onChangeFactors?: (factors: EnvironmentalFactorValues) => void;
}

export const DemoScenarioSelector: React.FC<DemoScenarioSelectorProps> = ({
  activeScenarioId,
  onSelectScenario,
  onResetScenario,
  isLoading = false,
  error = null,
  compact = false,
  activeAssessment,
  alertState,
  locationName,
  onRetry,
  rainfallMm: propRainfall,
  wetnessPercent: propWetness,
  onChangeFactors,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showFlowDetails, setShowFlowDetails] = useState<boolean>(false);

  // Derive initial or fallback environmental values
  const activeScenario = DEMONSTRATION_SCENARIOS.find((s) => s.id === activeScenarioId);

  const defaultRainfall =
    propRainfall ??
    activeAssessment?.factors?.rainfall?.rawValue ??
    activeScenario?.factors?.rainfallMm ??
    15;

  const defaultWetness =
    propWetness ??
    activeAssessment?.factors?.wetness?.rawValue ??
    activeScenario?.factors?.wetnessPercent ??
    30;

  const [rainfall, setRainfall] = useState<number>(defaultRainfall);
  const [wetness, setWetness] = useState<number>(defaultWetness);

  // Sync internal factor state when props change
  useEffect(() => {
    if (propRainfall !== undefined) setRainfall(propRainfall);
  }, [propRainfall]);

  useEffect(() => {
    if (propWetness !== undefined) setWetness(propWetness);
  }, [propWetness]);

  // When activeScenario changes, snap factors to scenario factors if not explicitly controlled
  useEffect(() => {
    if (activeScenario && propRainfall === undefined && propWetness === undefined) {
      setRainfall(activeScenario.factors.rainfallMm);
      setWetness(activeScenario.factors.wetnessPercent);
    }
  }, [activeScenarioId, activeScenario, propRainfall, propWetness]);

  // Debounced notification to parent to avoid infinite loops and high API volume
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const notifyFactorChange = useCallback(
    (newRain: number, newWet: number) => {
      if (!onChangeFactors) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChangeFactors({ rainfall: newRain, wetness: newWet });
      }, 250);
    },
    [onChangeFactors]
  );

  const handleRainfallChange = (val: number) => {
    const clamped = Math.max(0, Math.min(160, Math.round(val)));
    setRainfall(clamped);
    notifyFactorChange(clamped, wetness);
  };

  const handleWetnessChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setWetness(clamped);
    notifyFactorChange(rainfall, clamped);
  };

  // Compute live alert state if not provided
  const resolvedRiskScore = activeAssessment?.riskScore ?? (
    activeScenario?.id === 'extreme-risk' ? 88 :
    activeScenario?.id === 'heavy-rainfall' ? 68 :
    activeScenario?.id === 'increasing-rainfall' ? 44 : 22
  );
  const resolvedRiskLevel = activeAssessment?.riskLevel ?? (
    resolvedRiskScore >= 76 ? 'VERY HIGH' :
    resolvedRiskScore >= 51 ? 'HIGH' :
    resolvedRiskScore >= 26 ? 'MODERATE' : 'LOW'
  );

  const liveAlertState = alertState ?? deriveDemonstrationAlertState(resolvedRiskScore, resolvedRiskLevel);

  // Factor contributions from active assessment (or calculated from formula)
  const rainfallContribution =
    activeAssessment?.factorContributions?.rainfall?.weightedContribution ??
    (activeAssessment?.factorContributions as any)?.rainfallContribution ??
    activeAssessment?.factors?.rainfall?.weightedContribution ??
    Math.round(Math.min(100, (rainfall / 150) * 100) * 0.25 * 10) / 10 ?? 0;

  const wetnessContribution =
    activeAssessment?.factorContributions?.wetness?.weightedContribution ??
    (activeAssessment?.factorContributions as any)?.wetnessContribution ??
    activeAssessment?.factors?.wetness?.weightedContribution ??
    Math.round(wetness * 0.2 * 10) / 10 ?? 0;

  return (
    <div
      id="demo-scenario-control"
      className="relative rounded-xl border border-cyan-900/50 bg-slate-950/90 p-3.5 text-xs shadow-xl backdrop-blur-md space-y-3"
    >
      {/* Header with DEMO SCENARIO & DEMO DATA Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-inner">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 font-bold tracking-tight text-white text-xs sm:text-sm">
              <span className="font-['Chakra_Petch']">DEMONSTRATION ENVIRONMENTAL CONTROLS</span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                DEMO SCENARIO
              </span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-400 border border-amber-500/30">
                DEMO DATA
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Interactive SIH Environmental Simulation • Audited Heuristic Risk Engine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle Data Flow Diagram */}
          <button
            type="button"
            onClick={() => setShowFlowDetails(!showFlowDetails)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
              showFlowDetails
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
            }`}
            title="Toggle Environmental Factor Calculation Flow"
          >
            <Activity className="h-3 w-3 text-cyan-400" />
            <span className="hidden sm:inline">Data Flow</span>
          </button>

          {/* Info popover toggle */}
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className={`rounded-lg p-1.5 transition ${
              showExplanation
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
            title="Scenario Information & Disclaimer"
          >
            <Info className="h-3.5 w-3.5" />
          </button>

          {/* Reset Scenario Button */}
          {(activeScenarioId || rainfall !== 15 || wetness !== 30) && (
            <button
              type="button"
              id="reset-scenario-btn"
              onClick={() => {
                setRainfall(15);
                setWetness(30);
                if (onChangeFactors) onChangeFactors({ rainfall: 15, wetness: 30 });
                onResetScenario();
              }}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              title="Reset to Normal Demonstration Baseline (Low Rainfall, Low Moisture)"
            >
              <RotateCcw className="h-3 w-3 text-cyan-400" />
              <span>Reset Baseline</span>
            </button>
          )}

          {/* Expand/Collapse on compact */}
          {compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Disclaimer & Explanation */}
      {(showExplanation || (!compact && !activeScenarioId && rainfall === 15)) && (
        <div className="rounded-lg border border-cyan-950/60 bg-cyan-950/30 p-2.5 text-[11px] leading-relaxed text-cyan-200">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 flex-shrink-0" />
            <span>SIH Demonstration Risk Engine Specification</span>
          </div>
          <p className="mt-1 text-slate-300">
            {DEMO_SCENARIO_EXPLANATION}
          </p>
        </div>
      )}

      {/* Always-Visible Compact Transparency Pipeline */}
      <div
        id="compact-transparency-pipeline"
        className="rounded-lg border border-cyan-900/50 bg-slate-900/80 p-2.5 text-[11px] space-y-1.5 shadow-inner"
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 font-bold font-mono text-cyan-300 text-[10px] tracking-wide">
            <TrendingUp className="h-3 w-3 text-cyan-400" />
            <span>DYNAMIC AUDITED RISK PIPELINE</span>
          </div>
          <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            DEMONSTRATION SIMULATION — NOT LIVE ENVIRONMENTAL MONITORING
          </span>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] pt-0.5">
          <span className="bg-slate-950 px-2 py-0.5 rounded text-cyan-300 border border-slate-800 font-semibold">
            Rainfall ({rainfall}mm) / Wetness ({wetness}%)
          </span>
          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
          <span className="bg-cyan-950/60 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800/40">
            Risk Engine
          </span>
          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
          <span className="bg-slate-950 px-2 py-0.5 rounded text-white font-bold border border-slate-800">
            Score: {resolvedRiskScore}/100
          </span>
          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              resolvedRiskLevel === 'VERY HIGH'
                ? 'bg-red-950/80 text-red-300 border-red-700/60'
                : resolvedRiskLevel === 'HIGH'
                ? 'bg-orange-950/80 text-orange-300 border-orange-700/60'
                : resolvedRiskLevel === 'MODERATE'
                ? 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
            }`}
          >
            {resolvedRiskLevel}
          </span>
          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
          <span
            className={`px-2 py-0.5 rounded font-semibold border ${
              liveAlertState.thresholdCrossed
                ? 'bg-red-950/80 text-red-200 border-red-700/60'
                : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            Map + Alert ({liveAlertState.status.replace(/_/g, ' ')})
          </span>
        </div>
      </div>

      {/* Detailed Data Flow Diagram (Expandable) */}
      {showFlowDetails && (
        <div
          id="environmental-factor-flow-diagram"
          className="rounded-xl border border-cyan-800/40 bg-slate-900/90 p-3 space-y-2 text-[11px]"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 font-mono">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>DETAILED FACTOR CONTRIBUTIONS & FORMULA BREAKDOWN</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Single Source of Truth: Audited Backend Engine
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-center font-mono">
            {/* Step 1: Factors */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">1. Factors</div>
              <div className="text-cyan-300 font-bold">{rainfall}mm / {wetness}%</div>
              <div className="text-[9px] text-slate-500">Rain & Saturation</div>
            </div>

            {/* Step 2: Risk Engine */}
            <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/30 p-2 space-y-0.5">
              <div className="text-[9px] text-cyan-400 uppercase font-semibold">2. Risk Engine</div>
              <div className="text-white font-bold">Heuristic 6-Factor</div>
              <div className="text-[9px] text-slate-400">Audited Weights</div>
            </div>

            {/* Step 3: Risk Score */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">3. Risk Score</div>
              <div className="text-cyan-400 font-bold text-sm font-['Chakra_Petch']">
                {resolvedRiskScore} / 100
              </div>
              <div className="text-[9px] text-slate-500">
                +{((Number(rainfallContribution) || 0) + (Number(wetnessContribution) || 0)).toFixed(1)} pts
              </div>
            </div>

            {/* Step 4: Classification */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">4. Classification</div>
              <div
                className={`font-bold text-[11px] ${
                  resolvedRiskLevel === 'VERY HIGH'
                    ? 'text-red-400'
                    : resolvedRiskLevel === 'HIGH'
                    ? 'text-orange-400'
                    : resolvedRiskLevel === 'MODERATE'
                    ? 'text-yellow-400'
                    : 'text-emerald-400'
                }`}
              >
                {resolvedRiskLevel}
              </div>
              <div className="text-[9px] text-slate-500">Audited Bands</div>
            </div>

            {/* Step 5: Map Visualization */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">5. Map Hotspots</div>
              <div className="text-emerald-400 font-bold text-[10px]">Active Re-render</div>
              <div className="text-[9px] text-slate-500">Heatmap & Nodes</div>
            </div>

            {/* Step 6: Alert Status */}
            <div
              className={`rounded-lg border p-2 space-y-0.5 ${
                liveAlertState.thresholdCrossed
                  ? 'border-red-600/60 bg-red-950/40 text-red-200'
                  : 'border-slate-800 bg-slate-950 text-slate-300'
              }`}
            >
              <div className="text-[9px] uppercase font-semibold">6. Alert Status</div>
              <div className="font-bold text-[10px] truncate">
                {liveAlertState.status.replace(/_/g, ' ')}
              </div>
              <div className="text-[9px] font-mono">
                {liveAlertState.thresholdCrossed ? 'Threshold Crossed' : 'Normal Watch'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state if any */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-900/60 bg-red-950/40 p-2 text-[11px] text-red-300">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded bg-red-900/60 px-2 py-0.5 text-[10px] font-medium text-red-200 hover:bg-red-800 transition"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3">
          {/* SECTION 1: PREDEFINED DEMONSTRATION SCENARIOS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Predefined Demonstration Scenarios:
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                Click any preset to simulate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {DEMONSTRATION_SCENARIOS.map((scenario, index) => {
                const isSelected = activeScenarioId === scenario.id;

                const badgeColor =
                  scenario.id === 'extreme-risk'
                    ? 'border-red-800/80 bg-red-950/60 text-red-300 hover:border-red-500'
                    : scenario.id === 'heavy-rainfall'
                    ? 'border-orange-800/80 bg-orange-950/60 text-orange-300 hover:border-orange-500'
                    : scenario.id === 'increasing-rainfall'
                    ? 'border-yellow-800/80 bg-yellow-950/60 text-yellow-300 hover:border-yellow-500'
                    : 'border-emerald-800/80 bg-emerald-950/60 text-emerald-300 hover:border-emerald-500';

                const activeRing =
                  scenario.id === 'extreme-risk'
                    ? 'ring-2 ring-red-500 bg-red-950/90 text-white font-bold'
                    : scenario.id === 'heavy-rainfall'
                    ? 'ring-2 ring-orange-500 bg-orange-950/90 text-white font-bold'
                    : scenario.id === 'increasing-rainfall'
                    ? 'ring-2 ring-yellow-500 bg-yellow-950/90 text-white font-bold'
                    : 'ring-2 ring-emerald-500 bg-emerald-950/90 text-white font-bold';

                return (
                  <button
                    key={scenario.id}
                    id={`scenario-btn-${scenario.id}`}
                    onClick={() => {
                      setRainfall(scenario.factors.rainfallMm);
                      setWetness(scenario.factors.wetnessPercent);
                      onSelectScenario(scenario.id);
                      if (onChangeFactors) {
                        onChangeFactors({
                          rainfall: scenario.factors.rainfallMm,
                          wetness: scenario.factors.wetnessPercent,
                        });
                      }
                    }}
                    disabled={isLoading}
                    className={`flex flex-col items-start justify-between rounded-lg border p-2 text-left transition-all ${
                      isSelected ? activeRing : badgeColor
                    } disabled:opacity-60`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          0{index + 1}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                        )}
                      </div>
                      <div className="mt-1 font-semibold text-[11px] leading-tight text-white">
                        {scenario.name}
                      </div>
                    </div>

                    <div className="mt-2 w-full pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-300">
                      <span>{scenario.badge}</span>
                      <span className="opacity-80 font-bold">
                        {scenario.factors.rainfallMm}mm
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: DYNAMIC ENVIRONMENTAL FACTOR SLIDERS */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold uppercase text-slate-200 text-[11px]">
                <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                <span>Adjust Environmental Factors in Real-Time</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Formula Weight: Rainfall (25%) + Soil Wetness (20%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Factor 1: 24h Rainfall (mm) */}
              <div className="space-y-1.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">24-Hour Rainfall</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-cyan-300 font-bold text-xs">{rainfall} mm</span>
                    <span className="text-[10px] text-slate-400">
                      (+{rainfallContribution} pts)
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="5"
                  value={rainfall}
                  onChange={(e) => handleRainfallChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />

                {/* Quick Presets & Steppers */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRainfallChange(rainfall - 10)}
                      disabled={isLoading || rainfall <= 0}
                      className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                      title="Decrease rainfall by 10mm"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRainfallChange(rainfall + 10)}
                      disabled={isLoading || rainfall >= 160}
                      className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                      title="Increase rainfall by 10mm"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[9px]">
                    <button
                      type="button"
                      onClick={() => handleRainfallChange(15)}
                      className={`px-1.5 py-0.5 rounded border ${
                        rainfall === 15 ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      15mm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRainfallChange(65)}
                      className={`px-1.5 py-0.5 rounded border ${
                        rainfall === 65 ? 'border-yellow-500 text-yellow-300 bg-yellow-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      65mm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRainfallChange(115)}
                      className={`px-1.5 py-0.5 rounded border ${
                        rainfall === 115 ? 'border-orange-500 text-orange-300 bg-orange-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      115mm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRainfallChange(145)}
                      className={`px-1.5 py-0.5 rounded border ${
                        rainfall === 145 ? 'border-red-500 text-red-300 bg-red-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      145mm
                    </button>
                  </div>
                </div>
              </div>

              {/* Factor 2: Soil Wetness (% Saturation) */}
              <div className="space-y-1.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-semibold text-slate-200">Soil Wetness</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-blue-300 font-bold text-xs">{wetness}% sat</span>
                    <span className="text-[10px] text-slate-400">
                      (+{wetnessContribution} pts)
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={wetness}
                  onChange={(e) => handleWetnessChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />

                {/* Quick Presets & Steppers */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleWetnessChange(wetness - 10)}
                      disabled={isLoading || wetness <= 0}
                      className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                      title="Decrease wetness by 10%"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWetnessChange(wetness + 10)}
                      disabled={isLoading || wetness >= 100}
                      className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                      title="Increase wetness by 10%"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[9px]">
                    <button
                      type="button"
                      onClick={() => handleWetnessChange(25)}
                      className={`px-1.5 py-0.5 rounded border ${
                        wetness === 25 ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWetnessChange(55)}
                      className={`px-1.5 py-0.5 rounded border ${
                        wetness === 55 ? 'border-yellow-500 text-yellow-300 bg-yellow-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      55%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWetnessChange(85)}
                      className={`px-1.5 py-0.5 rounded border ${
                        wetness === 85 ? 'border-orange-500 text-orange-300 bg-orange-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      85%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWetnessChange(95)}
                      className={`px-1.5 py-0.5 rounded border ${
                        wetness === 95 ? 'border-red-500 text-red-300 bg-red-950/40 font-bold' : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      95%
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Indicator during Recalculation */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-cyan-900/50 bg-cyan-950/30 p-2 text-[11px] text-cyan-300 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>
                  Recalculating risk with audited Phase 1 engine for {locationName || 'monitored corridors'}...
                </span>
              </div>
            )}

            {/* Live Recalculated Score & Alert Threshold Notification Banner */}
            {!isLoading && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Recalculated Risk Score:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      resolvedRiskLevel === 'VERY HIGH'
                        ? 'bg-red-950 text-red-300 border border-red-700/80 shadow-sm shadow-red-950'
                        : resolvedRiskLevel === 'HIGH'
                        ? 'bg-orange-950 text-orange-300 border border-orange-700/80'
                        : resolvedRiskLevel === 'MODERATE'
                        ? 'bg-yellow-950 text-yellow-300 border border-yellow-700/80'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                    }`}
                  >
                    {resolvedRiskScore} / 100 • {resolvedRiskLevel}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Conf: {Math.round((activeAssessment?.demonstrationConfidence ?? 0.85) * 100)}%
                  </span>
                </div>

                {/* Alert Threshold Cross Notification */}
                <div
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    liveAlertState.thresholdCrossed
                      ? liveAlertState.alertLevel === 'VERY HIGH'
                        ? 'bg-red-950/80 text-red-200 border border-red-500 shadow-sm shadow-red-950 animate-pulse'
                        : 'bg-orange-950/80 text-orange-200 border border-orange-500 shadow-sm shadow-orange-950'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  <ShieldAlert
                    className={`h-3.5 w-3.5 ${
                      liveAlertState.thresholdCrossed ? 'text-red-400' : 'text-slate-400'
                    }`}
                  />
                  <span>
                    Status: <strong className="text-white">{liveAlertState.status.replace(/_/g, ' ')}</strong>
                  </span>
                  {liveAlertState.thresholdCrossed && (
                    <span className="rounded bg-red-600 px-1.5 py-0.2 text-[9px] font-mono font-bold text-white uppercase ml-1">
                      {liveAlertState.alertLevel === 'VERY HIGH' ? 'CRITICAL (>75)' : 'THRESHOLD (>50)'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
