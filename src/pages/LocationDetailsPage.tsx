import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Mountain,
  Droplets,
  Layers,
  Activity,
  ShieldAlert,
  LifeBuoy,
  History,
  Phone,
  ArrowLeft,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Home,
  Sparkles,
} from 'lucide-react';
import {
  LocationRisk,
  DemonstrationRiskAssessment,
  ExplainRiskRequestBody,
  ExplainRiskResponse,
  DemonstrationScenarioId,
} from '../types';
import { explainRiskWithGemini, generateClientRuleBasedExplanation } from '../services/api';
import { RiskFactorCard } from '../components/RiskFactorCard';
import { RiskBadge } from '../components/RiskBadge';
import { deriveDemonstrationAlertState } from '../data/demonstrationScenarios';

interface LocationDetailsPageProps {
  locations: LocationRisk[];
  selectedLocationId?: string;
  onSelectLocation: (id: string) => void;
  onBackToMap: () => void;
  onOpenEvacuationProtocol: () => void;
  onNavigateHome?: () => void;
}

export const LocationDetailsPage: React.FC<LocationDetailsPageProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onBackToMap,
  onOpenEvacuationProtocol,
  onNavigateHome,
}) => {
  const [riskAssessment, setRiskAssessment] = useState<DemonstrationRiskAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Demonstration Scenario state (interactive SIH environmental simulation)
  const [activeScenarioId, setActiveScenarioId] = useState<DemonstrationScenarioId | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.get('scenario') as DemonstrationScenarioId) || null;
  });
  const [simulatedFactors, setSimulatedFactors] = useState<{ rainfall?: number; wetness?: number }>({});
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  // Step 10: Gemini Explainable Risk Summary States
  const [aiExplanation, setAiExplanation] = useState<ExplainRiskResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Read location param from URL or props
  const getLocationParam = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return selectedLocationId || urlParams.get('location') || 'thuampui-bypass';
  }, [selectedLocationId]);

  const activeQuery = getLocationParam();

  // Load Gemini explainable risk summary based strictly on backend structured data
  const loadAiExplanation = useCallback(
    async (assessment: DemonstrationRiskAssessment, forceSimulateFailure = false) => {
      if (!assessment || !assessment.factors) return;

      setAiLoading(true);
      setAiError(null);

      const locName =
        typeof assessment.location === 'object'
          ? assessment.location.name
          : assessment.location;

      // Allow testing failure simulation via URL param or function argument
      const urlParams = new URLSearchParams(window.location.search);
      const shouldSimulateFailure =
        forceSimulateFailure || urlParams.get('simulateAiFailure') === 'true';

      const payload: ExplainRiskRequestBody = {
        location: locName,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        modelConfidence: assessment.modelConfidence,
        demonstrationConfidence: assessment.demonstrationConfidence ?? assessment.modelConfidence,
        factors: {
          rainfall: assessment.factors.rainfall.normalizedScore,
          slope: assessment.factors.slope.normalizedScore,
          wetness: assessment.factors.wetness.normalizedScore,
          historicalActivity: assessment.factors.historicalActivity.normalizedScore,
          landCover: assessment.factors.landCover.normalizedScore,
          elevation: assessment.factors.elevation.normalizedScore,
        },
        isDemoData: true,
        simulateFailure: shouldSimulateFailure,
      };

      try {
        const result = await explainRiskWithGemini(payload, shouldSimulateFailure);
        setAiExplanation(result);
        setAiError(null);
      } catch (err) {
        console.warn('AI risk explanation failed, deploying rule-based fallback:', err);
        const fallback = generateClientRuleBasedExplanation(
          payload,
          'AI explanation temporarily unavailable. Risk assessment remains available.'
        );
        setAiExplanation(fallback);
        setAiError(null);
      } finally {
        setAiLoading(false);
      }
    },
    []
  );

  // Request cancellation and sequence tracking to prevent race conditions and stale overwrites
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const fetchRequestIdRef = useRef<number>(0);

  // Fetch GET /api/risk/:location function with optional demonstration scenario and factor overrides
  const fetchRiskData = useCallback(
    async (
      targetLoc: string,
      scenarioId?: DemonstrationScenarioId | null,
      factors?: { rainfall?: number; wetness?: number }
    ) => {
      // Cancel prior in-flight request
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      fetchAbortControllerRef.current = abortController;
      const currentRequestId = ++fetchRequestIdRef.current;

      setLoading(true);
      setNotFound(false);
      setApiError(null);

      const effectiveScenario =
        scenarioId !== undefined ? scenarioId : activeScenarioId;

      const effectiveRainfall =
        factors?.rainfall !== undefined ? factors.rainfall : simulatedFactors.rainfall;

      const effectiveWetness =
        factors?.wetness !== undefined ? factors.wetness : simulatedFactors.wetness;

      try {
        const params = new URLSearchParams();
        if (effectiveScenario && effectiveScenario !== 'none') {
          params.set('scenario', effectiveScenario);
        }
        if (effectiveRainfall !== undefined) {
          params.set('rainfall', String(effectiveRainfall));
        }
        if (effectiveWetness !== undefined) {
          params.set('wetness', String(effectiveWetness));
        }

        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`/api/risk/${encodeURIComponent(targetLoc)}${qs}`, {
          signal: abortController.signal,
        });

        if (currentRequestId !== fetchRequestIdRef.current) {
          return;
        }

        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const data: DemonstrationRiskAssessment = await res.json();
        if (currentRequestId !== fetchRequestIdRef.current) {
          return;
        }

        if ((data as any).notFound) {
          setNotFound(true);
        } else {
          setRiskAssessment(data);
          // Automatically trigger Gemini explanation after risk data loads successfully
          loadAiExplanation(data);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch dynamic risk assessment:', err);
        setApiError(err instanceof Error ? err.message : 'Failed to retrieve risk data. Retaining last valid assessment.');
      } finally {
        if (currentRequestId === fetchRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [activeScenarioId, simulatedFactors, loadAiExplanation]
  );

  const handleSelectScenario = async (scenarioId: DemonstrationScenarioId) => {
    setActiveScenarioId(scenarioId);
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      await fetchRiskData(activeQuery, scenarioId, simulatedFactors);
    } catch {
      setScenarioError('Failed to apply demonstration scenario.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleResetScenario = async () => {
    setActiveScenarioId(null);
    setSimulatedFactors({ rainfall: 15, wetness: 30 });
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      await fetchRiskData(activeQuery, null, { rainfall: 15, wetness: 30 });
    } catch {
      setScenarioError('Failed to reset demonstration scenario.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleChangeFactors = async (factors: { rainfall: number; wetness: number }) => {
    setSimulatedFactors(factors);
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      await fetchRiskData(activeQuery, activeScenarioId, factors);
    } catch {
      setScenarioError('Failed to recalculate risk for environmental factors.');
    } finally {
      setScenarioLoading(false);
    }
  };

  // Fetch whenever selectedLocationId or search params change
  useEffect(() => {
    const targetLoc = getLocationParam();
    fetchRiskData(targetLoc);
  }, [selectedLocationId, getLocationParam, fetchRiskData]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="font-mono text-xs tracking-wider text-slate-300">
            FETCHING RISK ASSESSMENT FOR <span className="text-cyan-300 font-bold">"{activeQuery}"</span>...
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            GET /api/risk/{encodeURIComponent(activeQuery)}
          </span>
        </div>
      </div>
    );
  }

  // 2. API Error State
  if (apiError) {
    return (
      <div className="min-h-screen bg-[#060a14] py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6 pt-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-lg shadow-red-950/40">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div>
            <div className="inline-block rounded-full bg-red-950/80 px-3 py-1 font-mono text-[11px] font-bold text-red-400 ring-1 ring-red-500/40 uppercase tracking-wider mb-3">
              DEMO DATA • TELEMETRY API ERROR
            </div>
            <h1 className="font-['Chakra_Petch'] text-3xl sm:text-4xl font-extrabold text-white">
              Risk Service Unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Unable to retrieve risk assessment from <code className="text-cyan-300 font-mono">GET /api/risk/{activeQuery}</code>: {apiError}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchRiskData(activeQuery)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-950"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Request</span>
            </button>
            <button
              onClick={onBackToMap}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Interactive Map</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Location Not Found State
  if (notFound || !riskAssessment) {
    return (
      <div className="min-h-screen bg-[#060a14] py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6 pt-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-950/40">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div>
            <div className="inline-block rounded-full bg-red-950/80 px-3 py-1 font-mono text-[11px] font-bold text-red-400 ring-1 ring-red-500/40 uppercase tracking-wider mb-3">
              DEMO DATA • LOCATION NOT FOUND
            </div>
            <h1 className="font-['Chakra_Petch'] text-3xl sm:text-4xl font-extrabold text-white">
              Location Not Found
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              No landslide risk telemetry or monitoring station was found matching{' '}
              <span className="font-mono text-cyan-300 font-bold">"{activeQuery}"</span> in Landslide Watch records.
            </p>
          </div>

          {/* Quick Select Monitored Hotspots */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-left space-y-4 shadow-xl">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select an Active Monitored Corridor in Aizawl:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => onSelectLocation(loc.id)}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-cyan-500/50 hover:bg-slate-900 text-slate-200"
                >
                  <span className="font-semibold truncate">{loc.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      loc.riskLevel === 'Critical'
                        ? 'bg-red-950 text-red-400 ring-1 ring-red-500/30'
                        : loc.riskLevel === 'Severe'
                        ? 'bg-orange-950 text-orange-400 ring-1 ring-orange-500/30'
                        : 'bg-yellow-950 text-yellow-400 ring-1 ring-yellow-500/30'
                    }`}
                  >
                    {loc.riskLevel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onBackToMap}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-950"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Interactive Map</span>
            </button>
            <button
              onClick={() => onSelectLocation('thuampui-bypass')}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              View Thuampui & Zemabawk
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Missing Risk Data State
  if (!riskAssessment.factors || riskAssessment.riskScore === undefined) {
    return (
      <div className="min-h-screen bg-[#060a14] py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6 pt-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-950/40">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <div className="inline-block rounded-full bg-amber-950/80 px-3 py-1 font-mono text-[11px] font-bold text-amber-400 ring-1 ring-amber-500/40 uppercase tracking-wider mb-3">
              DEMO DATA • INCOMPLETE RISK DATA
            </div>
            <h1 className="font-['Chakra_Petch'] text-3xl sm:text-4xl font-extrabold text-white">
              Risk Telemetry Incomplete
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              The risk assessment response for <span className="text-cyan-300 font-bold">"{activeQuery}"</span> is missing required geotechnical factor values.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchRiskData(activeQuery)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-950"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Calculation</span>
            </button>
            <button
              onClick={onBackToMap}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Interactive Map</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic values resolved from riskAssessment
  const locationName =
    typeof riskAssessment.location === 'object'
      ? riskAssessment.location.name
      : riskAssessment.location;

  const locationId =
    typeof riskAssessment.location === 'object'
      ? riskAssessment.location.id
      : activeQuery;

  // Match geotechnical details from locations dataset
  const location =
    locations.find(
      (l) =>
        (typeof riskAssessment.location === 'object' &&
          riskAssessment.location.targetLocationId &&
          l.id.toLowerCase() === riskAssessment.location.targetLocationId.toLowerCase()) ||
        l.id.toLowerCase() === locationId.toLowerCase() ||
        l.name.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(l.name.toLowerCase()) ||
        l.id.toLowerCase().includes(locationId.toLowerCase())
    ) || locations[0];

  const locationWard =
    typeof riskAssessment.location === 'object' && riskAssessment.location.ward
      ? riskAssessment.location.ward
      : location.ward;

  const locationCoords =
    typeof riskAssessment.location === 'object' && riskAssessment.location.coordinates
      ? riskAssessment.location.coordinates
      : location.coordinates;

  const isCritical = riskAssessment.riskLevel === 'VERY HIGH';
  const isSevere = riskAssessment.riskLevel === 'HIGH';
  const isModerate = riskAssessment.riskLevel === 'MODERATE';

  // Format dynamic Last Updated
  const formattedLastUpdated = riskAssessment.lastUpdated.includes('IST')
    ? riskAssessment.lastUpdated
    : !isNaN(Date.parse(riskAssessment.lastUpdated))
    ? new Date(riskAssessment.lastUpdated).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' IST (DEMO DATA)'
    : riskAssessment.lastUpdated;

  return (
    <div className="min-h-screen bg-[#060a14] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <>
                <button
                  id="location-details-home-btn"
                  onClick={onNavigateHome}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  <Home className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Home</span>
                </button>
                <span className="text-slate-600">/</span>
              </>
            )}
            <button
              onClick={onBackToMap}
              className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Interactive Map</span>
            </button>
          </div>

          {/* Quick Location Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                Switch Corridor: <strong className="text-cyan-300">{locationName}</strong>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-72 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc.id);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                        loc.id === location.id
                          ? 'bg-cyan-950/80 text-cyan-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="truncate">{loc.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          loc.riskLevel === 'Critical'
                            ? 'bg-red-950 text-red-400'
                            : loc.riskLevel === 'Severe'
                            ? 'bg-orange-950 text-orange-400'
                            : 'bg-yellow-950 text-yellow-400'
                        }`}
                      >
                        {loc.factorOfSafety}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Corridor Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <span className="shrink-0 font-bold uppercase tracking-wider text-[10px] text-slate-500">
            Aizawl Hotspots:
          </span>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc.id)}
              className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                loc.id === location.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {loc.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Public Safety Alert State Banner for Threshold Crossed */}
        {riskAssessment.alertState?.thresholdCrossed && (
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              riskAssessment.alertState.thresholdCrossed
                ? riskAssessment.alertState.alertLevel === 'VERY HIGH'
                  ? 'border-red-600 bg-red-950/80 text-red-100'
                  : 'border-orange-600 bg-orange-950/80 text-orange-100'
                : 'border-cyan-900 bg-slate-950/80 text-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  riskAssessment.alertState.thresholdCrossed
                    ? riskAssessment.alertState.alertLevel === 'VERY HIGH'
                      ? 'border-red-500 bg-red-900 text-red-200 animate-pulse'
                      : 'border-orange-500 bg-orange-900 text-orange-200 animate-pulse'
                    : 'border-cyan-700 bg-cyan-950 text-cyan-400'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-['Chakra_Petch'] text-sm sm:text-base font-bold uppercase tracking-wider">
                    {riskAssessment.alertState.status.replace(/_/g, ' ')}
                  </span>
                  {riskAssessment.alertState.thresholdCrossed && (
                    <span className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-mono font-bold text-white uppercase animate-pulse">
                      THRESHOLD CROSSED
                    </span>
                  )}
                  <span className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    DEMO DATA
                  </span>
                </div>
                <p className="mt-1 text-xs opacity-90 leading-relaxed">
                  {riskAssessment.alertState.thresholdDescription}
                </p>
                <div className="mt-2 text-xs font-semibold flex items-center gap-1.5">
                  <span className="opacity-75">Demonstration Directive:</span>
                  <span className="underline decoration-dotted">{riskAssessment.alertState.recommendedAction}</span>
                </div>
              </div>
            </div>

            {riskAssessment.alertState.thresholdCrossed && (
              <button
                onClick={onOpenEvacuationProtocol}
                className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-slate-200"
              >
                View Evacuation Protocol
              </button>
            )}
          </div>
        )}

        {/* Corridor Hero / Geotechnical Header */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* DEMO DATA label */}
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">
                  DEMO DATA
                </span>
                <span className="text-slate-500">•</span>
                <span className="rounded bg-cyan-950 px-2 py-0.5 font-mono font-bold text-cyan-400 ring-1 ring-cyan-500/30">
                  {locationWard}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">Elevation {riskAssessment.factors.elevation.rawValue}m AMSL</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">
                  {locationCoords?.lat != null ? locationCoords.lat.toFixed(4) : '23.7300'}°N, {locationCoords?.lng != null ? locationCoords.lng.toFixed(4) : '92.7173'}°E
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-[11px]">
                  Last Updated: <strong className="text-slate-200">{formattedLastUpdated}</strong>
                </span>
              </div>

              <h1 className="mt-2 font-['Chakra_Petch'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                {locationName}
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Slope Aspect: <strong className="text-slate-200">{location.slopeAspect}</strong> • Catchment: <strong className="text-slate-200">{location.hydrology.catchment}</strong> • Demo Confidence: <strong className="text-cyan-300">{Math.round((riskAssessment.demonstrationConfidence ?? riskAssessment.modelConfidence) * 100)}%</strong>
              </p>
            </div>

            {/* Factor of Safety & Dynamic Risk Score Card */}
            <div className="flex items-center gap-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Risk Score
                  </span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400 ring-1 ring-amber-500/30">
                    DEMO
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={`font-['Chakra_Petch'] text-4xl font-extrabold ${
                      isCritical ? 'text-red-400' : isSevere ? 'text-orange-400' : isModerate ? 'text-yellow-400' : 'text-emerald-400'
                    }`}
                  >
                    {riskAssessment.riskScore}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-cyan-300">
                  {Math.round((riskAssessment.demonstrationConfidence ?? riskAssessment.modelConfidence) * 100)}% Demonstration Confidence
                </div>
              </div>

              <div
                className={`rounded-xl px-3.5 py-3 text-center text-xs font-extrabold uppercase ring-1 ${
                  isCritical
                    ? 'bg-red-950 text-red-400 ring-red-500/40'
                    : isSevere
                    ? 'bg-orange-950 text-orange-400 ring-orange-500/40'
                    : isModerate
                    ? 'bg-yellow-950 text-yellow-400 ring-yellow-500/40'
                    : 'bg-emerald-950 text-emerald-400 ring-emerald-500/40'
                }`}
              >
                <div>{riskAssessment.riskLevel}</div>
                <div className="text-[10px] font-normal text-slate-300">Hazard Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Why is this area at risk? */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-['Chakra_Petch'] text-lg sm:text-xl font-bold text-white tracking-wide">
                Why is this area at risk?
              </h2>
              <p className="text-xs text-slate-400">
                Primary geotechnical failure drivers and hydrological trigger mechanisms for {locationName}
              </p>
            </div>
          </div>

          {/* Identified Critical Risk Factors List */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Identified Primary Risk Factors & Failure Triggers:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(riskAssessment.riskFactors || riskAssessment.mainRiskFactors || []).map((factor, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-red-900/30 bg-red-950/20 p-3.5 text-xs"
                >
                  <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                  <span className="text-slate-200 leading-relaxed font-medium">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Core Hydrological & Geotechnical Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <RiskFactorCard
              title="Slope Character"
              value="Steep Cut-Slope"
              statusColor={riskAssessment.factors.slope.normalizedScore > 75 ? 'red' : 'cyan'}
              note="Over-steepened hillside corridor"
              icon={Mountain}
            />
            <RiskFactorCard
              title="Pore-Water Drainage"
              value="Elevated Pressure"
              subtitle="Hydrological runoff convergence"
              statusColor="red"
              icon={Droplets}
            />
            <RiskFactorCard
              title="Field Moisture Saturation"
              value="Critical Saturation"
              note="Antecedent monsoon moisture accumulation"
              statusColor="cyan"
              icon={Activity}
            />
            <RiskFactorCard
              title="Subsurface Displacement"
              value="Active Surveillance"
              subtitle="Monitored shear strain zone"
              statusColor="red"
              icon={Activity}
            />
          </div>

          {/* Step 10: AI Risk Explanation (Gemini-powered explainable risk summary) */}
          <div
            id="ai-risk-explanation-container"
            className="rounded-xl border border-cyan-900/50 bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/20 p-5 sm:p-6 space-y-5 mt-4"
          >
            {/* Header: Title and Demonstration Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-['Chakra_Petch'] text-base sm:text-lg font-bold text-white tracking-wide">
                      AI Risk Explanation
                    </h3>
                    {aiExplanation?.fallbackUsed ? (
                      <span
                        id="rule-based-fallback-badge"
                        className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 ring-1 ring-amber-500/40"
                      >
                        RULE-BASED DEMONSTRATION EXPLANATION
                      </span>
                    ) : (
                      <span
                        id="gemini-explanation-badge"
                        className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 ring-1 ring-cyan-500/30"
                      >
                        GEMINI AI EXPLANATION
                      </span>
                    )}
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 ring-1 ring-amber-500/30">
                      DEMO DATA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Clear narrative synthesis explaining structured risk factors for {locationName}
                  </p>
                </div>
              </div>

              {/* Status & Retry/Regenerate Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {aiExplanation && !aiLoading && (
                  <>
                    {aiExplanation.fallbackUsed ? (
                      <button
                        id="test-gemini-live-btn"
                        onClick={() => loadAiExplanation(riskAssessment, false)}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/60 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition"
                        title="Retry Live Gemini API"
                      >
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                        <span>Retry Live Gemini</span>
                      </button>
                    ) : (
                      <button
                        id="test-fallback-btn"
                        onClick={() => loadAiExplanation(riskAssessment, true)}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-900/40 hover:text-amber-100 transition"
                        title="Simulate Gemini outage/rate limit to test rule-based fallback"
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        <span>Simulate AI Outage</span>
                      </button>
                    )}
                    <button
                      id="regenerate-ai-explanation-btn"
                      onClick={() => loadAiExplanation(riskAssessment, false)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      title="Regenerate explanation"
                    >
                      <RefreshCw className="h-3 w-3 text-cyan-400" />
                      <span>Regenerate</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 1. Loading State */}
            {aiLoading && (
              <div
                id="ai-explanation-loading"
                className="flex flex-col items-center justify-center py-7 text-center space-y-3"
              >
                <div className="relative flex h-10 w-10 items-center justify-center">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40"></span>
                  <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Generating explainable risk summary for{' '}
                    <span className="text-cyan-300 font-bold">{locationName}</span>...
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    POST /api/ai/explain-risk
                  </div>
                </div>
              </div>
            )}

            {/* 2. Clear Notice when AI is unavailable or rate-limited */}
            {aiExplanation?.fallbackUsed && !aiLoading && (
              <div
                id="ai-explanation-fallback-notice"
                className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-1.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-300 font-mono tracking-wide">
                      AI explanation temporarily unavailable. Risk assessment remains available.
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      The Gemini API is temporarily unavailable, rate-limited, or in simulation mode. Below is a deterministic fallback explanation generated strictly from the existing structured risk factors.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Explanation Content (Gemini or Deterministic Rule-Based Fallback) */}
            {aiExplanation && !aiLoading && (
              <div id="ai-explanation-content" className="space-y-4 text-xs">
                {/* Section A: Risk Summary */}
                <div className="rounded-xl border border-cyan-900/40 bg-slate-900/70 p-4 space-y-1.5">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    Risk Summary
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                    {aiExplanation.summary}
                  </p>
                </div>

                {/* Section B & C: Main Factors & Why They Matter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Main Contributing Factors */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider font-mono">
                      Main Factors
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      {aiExplanation.mainFactors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-orange-400 font-bold shrink-0 mt-0.5">•</span>
                          <span className="font-medium">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Why They Matter */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono">
                      Why They Matter
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      {aiExplanation.whyTheyMatter.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section D: General Public Awareness Guidance */}
                {aiExplanation.generalPublicGuidance && (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-200">Public Awareness Guidance: </span>
                    {aiExplanation.generalPublicGuidance}
                  </div>
                )}

                {/* Metadata & Demonstration Notice Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>
                      Engine:{' '}
                      <strong className={aiExplanation.fallbackUsed ? 'text-amber-300 font-mono font-bold' : 'text-slate-400 font-mono'}>
                        {aiExplanation.modelUsed}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      {aiExplanation.fallbackUsed
                        ? 'Deterministic synthesis from structured factors'
                        : `Generated: ${new Date(aiExplanation.generatedAt).toLocaleTimeString()}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {aiExplanation.fallbackUsed ? (
                      <span className="text-amber-400 font-mono text-[10px] font-bold">
                        RULE-BASED DEMONSTRATION EXPLANATION
                      </span>
                    ) : (
                      <span className="text-amber-400/80 font-mono text-[10px]">
                        DEMO ESTIMATE • NOT LIVE SENSOR READINGS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Geotechnical & Civil Infrastructure Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Geological Stratigraphy & Lithology */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-white">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Geological Stratigraphy & Lithology</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Geological Formation:</span>
                <span className="font-semibold text-slate-200 text-right">{location.geology.formation}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Bedding Dip & Attitude:</span>
                <span className="font-semibold text-cyan-300 text-right">{location.geology.dipAngle}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Colluvial Overburden Depth:</span>
                <span className="font-mono text-slate-200">{location.geology.soilDepthM} meters</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Internal Friction Angle (φ):</span>
                <span className="font-mono text-slate-200">{location.geology.frictionAngleDeg}°</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Effective Soil Cohesion (c'):</span>
                <span className="font-mono text-slate-200">{location.geology.shearStrengthKPa} kPa</span>
              </div>

              <div className="pt-2">
                <span className="text-slate-400">Lithological Characteristics:</span>
                <p className="mt-1 text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                  {location.geology.lithology}
                </p>
              </div>
            </div>

            {/* Inclinometer Telemetry Table */}
            <div className="pt-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Borehole Inclinometer Telemetry:
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="p-2.5">Station</th>
                      <th className="p-2.5">Depth</th>
                      <th className="p-2.5">Displacement</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {location.inclinometers.map((inc) => (
                      <tr key={inc.code} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-mono font-bold text-cyan-400">{inc.code}</td>
                        <td className="p-2.5">{inc.depth}</td>
                        <td className="p-2.5 font-mono text-red-400 font-bold">+{inc.velocityMmHr} mm/hr</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              inc.status === 'Critical Strain'
                                ? 'bg-red-950 text-red-400'
                                : inc.status === 'Accelerating'
                                ? 'bg-orange-950 text-orange-400'
                                : 'bg-emerald-950 text-emerald-400'
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Column 2: What should you do? / Civil Safety & Evacuation */}
          <div className="space-y-6">
            {/* Section: What should you do? */}
            <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-slate-950 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-cyan-300">
                  <LifeBuoy className="h-4 w-4" />
                  <span>What should you do?</span>
                </div>
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                  {location.evacuation.status.toUpperCase()}
                </span>
              </div>

              {/* Action Recommendations */}
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>1. Monitor Hillside Warning Signs:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">
                    Inspect building foundations and retaining walls for new tension cracks. Avoid sleeping in rooms facing steep slope cuts or unsupported colluvial banks.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>2. Divert Surface Stormwater Runoff:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">
                    Ensure road drains and household roof runoff discharge safely into engineered storm channels, rather than soaking raw slope crests.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>3. Designated Evacuation Center:</span>
                  </div>
                  <div className="pl-5 pt-0.5">
                    <h4 className="text-sm font-bold text-white">{location.evacuation.name}</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Distance: <strong className="text-cyan-300">~{location.evacuation.distanceMeters} meters</strong> • Capacity: <strong className="text-cyan-300">{location.evacuation.capacity} citizens</strong>
                    </p>
                    <div className="mt-1 text-slate-300 text-[11px]">
                      <span className="text-slate-400 font-medium">Safe Corridor: </span>
                      {location.evacuation.safeCorridor}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400">Emergency Operations Desk:</span>
                <span className="font-mono text-cyan-400 font-semibold">{location.evacuation.contact}</span>
              </div>

              <button
                onClick={onOpenEvacuationProtocol}
                className="mt-2 w-full rounded-xl bg-cyan-600/30 border border-cyan-500/40 py-2.5 font-semibold text-xs text-cyan-200 transition hover:bg-cyan-600/50"
              >
                View Hillside Evacuation Checklist →
              </button>
            </div>

            {/* Vulnerable Assets Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-white">
                <ShieldAlert className="h-4 w-4 text-orange-400" />
                <span>Civil Assets in Threat Zone</span>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                {location.vulnerableAssets.map((asset, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-900/60 p-2.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span className="font-medium text-slate-200">{asset}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Historical Landslide Incidents in this Ward */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-white">
                <History className="h-4 w-4 text-cyan-400" />
                <span>Historical Landslide Record (GSI Archive)</span>
              </div>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                {location.historicalEvents.map((event, i) => (
                  <li key={i} className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 leading-relaxed">
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 uppercase tracking-wide block">
              Landslide Watch Demonstration Safety Disclaimer
            </span>
            <p>
              {riskAssessment.disclaimer ||
                'DEMO DATA (Phase 1 Prototype) — All values are synthetic demonstration estimates produced for Aizawl Phase 1 geotechnical testing. Not certified ML model inference or real-time life-safety telemetry.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

