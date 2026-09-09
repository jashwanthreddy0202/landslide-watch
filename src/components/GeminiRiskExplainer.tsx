import React, { useState } from 'react';
import { Sparkles, Bot, AlertTriangle, CheckCircle2, Globe, RefreshCw } from 'lucide-react';
import { AIExplanationResult, LocationRisk } from '../types';
import { requestAIGeotechnicalExplanation } from '../services/api';

interface GeminiRiskExplainerProps {
  location: LocationRisk;
}

export const GeminiRiskExplainer: React.FC<GeminiRiskExplainerProps> = ({ location }) => {
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestAIGeotechnicalExplanation(location.id);
      setExplanation(result);
    } catch (err) {
      console.error(err);
      setError('Unable to reach AI explanation service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-800/50 bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/20 p-6 shadow-xl">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white">
                Gemini AI Geotechnical Brief
              </h3>
              <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 ring-1 ring-cyan-500/30">
                {explanation?.modelUsed ? explanation.modelUsed.toUpperCase() : 'GEMINI 3.8 FLASH'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous slope failure physics analysis and civil safety instructions for {location.name}.
            </p>
          </div>
        </div>

        <button
          id="generate-gemini-explanation-btn"
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing Telemetry...</span>
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              <span>{explanation ? 'Regenerate Brief' : 'Generate AI Risk Brief'}</span>
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-950/40 p-3 text-xs text-red-300 border border-red-800/50">
          {error}
        </div>
      )}

      {/* Content display */}
      {!explanation && !loading && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-800 p-8 text-center">
          <Bot className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">
            No Geotechnical Brief Generated Yet
          </h4>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
            Click "Generate AI Risk Brief" to synthesize pore-water pressure, slope aspect, rainfall infiltration, and factor of safety metrics using Gemini AI.
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50"></span>
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-300">
            Gemini AI synthesizing Surma shale geology, pore pressure (
            {location.hydrology.porePressureKPa} kPa), and FoS ({location.factorOfSafety})...
          </p>
        </div>
      )}

      {explanation && !loading && (
        <div className="mt-6 space-y-5 text-xs text-slate-300">
          {/* Executive Summary */}
          <div className="rounded-xl border border-cyan-900/40 bg-slate-900/60 p-4 leading-relaxed">
            <div className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase mb-1">
              Executive Hazard Assessment
            </div>
            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              {explanation.summary}
            </p>
          </div>

          {/* 2 Column breakdown: Geotechnical Factors + Immediate Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Geotechnical Factors */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 mb-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Geotechnical Failure Drivers</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {explanation.geotechnicalFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Immediate Civil Actions */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Mandated Civil Mitigation</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {explanation.immediateActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mizo Language Translation Box */}
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/30 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-1.5">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Mizo Tawn Fimkhurna Thuchah (Civil Safety Advisory in Mizo)</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-200 italic font-sans">
              "{explanation.mizoSafetyAdvice}"
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>Model: <strong className="text-slate-300 font-mono">{explanation.modelUsed}</strong></span>
              <span>•</span>
              <span>Generated: {new Date(explanation.generatedAt).toLocaleTimeString()}</span>
            </div>
            <span className="text-cyan-400 font-medium">
              Factor of Safety: {explanation.factorOfSafety} ({explanation.riskLevel})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
