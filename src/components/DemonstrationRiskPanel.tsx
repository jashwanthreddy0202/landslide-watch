import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Cpu,
  Layers,
  Droplets,
  Mountain,
  History,
  Trees,
  ArrowUpRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { DemonstrationRiskAssessment, LocationRisk } from '../types';
import { fetchDemonstrationRisk } from '../services/riskService';

interface DemonstrationRiskPanelProps {
  location: LocationRisk;
  assessment?: DemonstrationRiskAssessment | null;
}

export const DemonstrationRiskPanel: React.FC<DemonstrationRiskPanelProps> = ({
  location,
  assessment: initialAssessment,
}) => {
  const [assessment, setAssessment] = useState<DemonstrationRiskAssessment | null>(
    initialAssessment || null
  );
  const [loading, setLoading] = useState<boolean>(!initialAssessment);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  useEffect(() => {
    if (initialAssessment) {
      setAssessment(initialAssessment);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchDemonstrationRisk(location.id).then((data) => {
      if (isMounted) {
        setAssessment(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [location.id, initialAssessment]);

  const getRiskLevelBadge = (level?: string) => {
    switch (level) {
      case 'VERY HIGH':
        return 'bg-red-950 text-red-300 border-red-700/60 ring-red-500/20';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-700/60 ring-orange-500/20';
      case 'MODERATE':
        return 'bg-yellow-950 text-yellow-300 border-yellow-700/60 ring-yellow-500/20';
      case 'LOW':
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/60 ring-emerald-500/20';
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-slate-950/90 p-6 shadow-xl backdrop-blur-md">
      {/* Header & Demo Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950/80 text-cyan-400 ring-1 ring-cyan-800/50">
              <Cpu className="h-4 w-4" />
            </div>
            <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white tracking-wide">
              Phase 1 Demonstration Risk Engine
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Isolated demonstration backend service for location-based landslide risk estimation
          </p>
        </div>

        {/* Prominent Demo Disclaimer Tag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-950/60 px-3 py-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider shadow-sm">
            <AlertTriangle className="h-3 w-3" />
            DEMO DATA (Not Real ML)
          </span>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Phase 1 Architecture Notice: </span>
          This calculation is an estimated demonstration heuristic using a transparent weighted formula. It is strictly isolated in{' '}
          <code className="rounded bg-slate-900 px-1 py-0.5 font-mono text-cyan-300">/api/risk/:location</code> and will be replaced by a certified trained ML inference model in future phases.
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
          <span>Executing demonstration risk calculation for {location.name}...</span>
        </div>
      ) : assessment ? (
        <div className="mt-6 space-y-6">
          {/* Main Score & Risk Tier Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col justify-center">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Calculated Demonstration Risk
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-['Chakra_Petch'] text-4xl font-bold text-white">
                  {assessment.riskScore}
                </span>
                <span className="font-mono text-sm text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Risk Classification
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 font-['Chakra_Petch'] text-base font-bold uppercase tracking-wider ${getRiskLevelBadge(
                    assessment.riskLevel
                  )}`}
                >
                  {assessment.riskLevel}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Scale: 0–25 LOW • 26–50 MOD • 51–75 HIGH • 76–100 VERY HIGH
              </div>
            </div>

            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Demonstration Confidence
              </div>
              <div className="mt-1 font-['Chakra_Petch'] text-2xl font-bold text-cyan-400">
                {Math.round((assessment.demonstrationConfidence ?? assessment.modelConfidence) * 100)}%
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Simulated indicator (not statistically validated ML probability)
              </div>
            </div>
          </div>

          {/* 6 Demonstration Factors Breakdown Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Demonstration Factors Breakdown (Transparent Weights)
              </h4>
              <button
                type="button"
                onClick={() => setShowFormula(!showFormula)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1"
              >
                <span>{showFormula ? 'Hide Formula' : 'View Formula'}</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            {showFormula && (
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs font-mono text-cyan-300 space-y-2">
                <div className="text-slate-400 text-[11px]">Weighted Demonstration Formula:</div>
                <p className="leading-relaxed">
                  {assessment.formulaDescription ||
                    'RiskScore = Round( (Rainfall × 0.25) + (Slope × 0.20) + (Wetness × 0.20) + (HistoricalActivity × 0.15) + (LandCover × 0.10) + (Elevation × 0.10) )'}
                </p>
                {assessment.calculationMethod && (
                  <p className="text-[11px] font-sans text-slate-400 border-t border-slate-800/80 pt-2 leading-relaxed">
                    {assessment.calculationMethod}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* Factor 1: Rainfall */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    {assessment.factors?.rainfall?.name ?? 'Rainfall'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{(assessment.factorContributions?.rainfall?.weightedContribution ?? assessment.factors?.rainfall?.weightedContribution ?? 0).toFixed(1)} pts
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">25% wt</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono font-bold text-white text-base">
                    {assessment.factors?.rainfall?.rawValue ?? 0} {assessment.factors?.rainfall?.unit ?? 'mm'}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Score: {assessment.factors?.rainfall?.normalizedScore ?? 0}/100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {assessment.factorContributions?.rainfall?.interpretation || assessment.factors?.rainfall?.description}
                </div>
              </div>

              {/* Factor 2: Slope */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Mountain className="h-3.5 w-3.5 text-amber-400" />
                    {assessment.factors?.slope?.name ?? 'Slope'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{(assessment.factorContributions?.slope?.weightedContribution ?? assessment.factors?.slope?.weightedContribution ?? 0).toFixed(1)} pts
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">20% wt</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono font-bold text-white text-base">
                    {assessment.factors?.slope?.rawValue ?? 0} {assessment.factors?.slope?.unit ?? '°'}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Score: {assessment.factors?.slope?.normalizedScore ?? 0}/100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {assessment.factorContributions?.slope?.interpretation || assessment.factors?.slope?.description}
                </div>
              </div>

              {/* Factor 3: Wetness */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    {assessment.factors?.wetness?.name ?? 'Wetness'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{(assessment.factorContributions?.wetness?.weightedContribution ?? assessment.factors?.wetness?.weightedContribution ?? 0).toFixed(1)} pts
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">20% wt</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono font-bold text-white text-base">
                    {assessment.factors?.wetness?.rawValue ?? 0} {assessment.factors?.wetness?.unit ?? '%'}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Score: {assessment.factors?.wetness?.normalizedScore ?? 0}/100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {assessment.factorContributions?.wetness?.interpretation || assessment.factors?.wetness?.description}
                </div>
              </div>

              {/* Factor 4: Historical Activity */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <History className="h-3.5 w-3.5 text-orange-400" />
                    {assessment.factors?.historicalActivity?.name ?? 'Historical Activity'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{(assessment.factorContributions?.historicalActivity?.weightedContribution ?? assessment.factors?.historicalActivity?.weightedContribution ?? 0).toFixed(1)} pts
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">15% wt</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono font-bold text-white text-sm truncate max-w-[180px]">
                    {String(assessment.factors?.historicalActivity?.rawValue ?? '').split('(')[0]}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Score: {assessment.factors?.historicalActivity?.normalizedScore ?? 0}/100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {assessment.factorContributions?.historicalActivity?.interpretation || assessment.factors?.historicalActivity?.description}
                </div>
              </div>

              {/* Factor 5: Land Cover */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Trees className="h-3.5 w-3.5 text-emerald-400" />
                    {assessment.factors?.landCover?.name ?? 'Land Cover'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{(assessment.factorContributions?.landCover?.weightedContribution ?? assessment.factors?.landCover?.weightedContribution ?? 0).toFixed(1)} pts
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">10% wt</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono font-bold text-white text-sm truncate max-w-[180px]">
                    {String(assessment.factors?.landCover?.rawValue ?? '').split(':')[0]}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Score: {assessment.factors?.landCover?.normalizedScore ?? 0}/100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {assessment.factorContributions?.landCover?.interpretation || assessment.factors?.landCover?.description}
                </div>
              </div>

              {/* Factor 6: Elevation */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Mountain className="h-3.5 w-3.5 text-purple-400" />
                    {assessment.factors?.elevation?.name ?? 'Elevation'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      +{(assessment.factorContributions?.elevation?.weightedContribution ?? assessment.factors?.elevation?.weightedContribution ?? 0).toFixed(1)} pts
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">10% wt</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono font-bold text-white text-base">
                    {assessment.factors?.elevation?.rawValue ?? 0} {assessment.factors?.elevation?.unit ?? 'm'}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Score: {assessment.factors?.elevation?.normalizedScore ?? 0}/100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {assessment.factorContributions?.elevation?.interpretation || assessment.factors?.elevation?.description}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
            <span className="font-mono">
              Endpoint: <code className="text-cyan-400">GET /api/risk/{location.id}</code>
            </span>
            <span className="font-mono">
              Last Evaluated: {new Date(assessment.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
