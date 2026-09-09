import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  ArrowRight,
  AlertTriangle,
  Droplets,
  Mountain,
  Layers,
  History,
  Trees,
  RefreshCw,
  Info,
  Clock,
  Gauge,
  HelpCircle,
  ChevronRight,
  X,
} from 'lucide-react';
import { DemonstrationRiskAssessment, LocationRisk } from '../types';
import { fetchDemonstrationRiskResult } from '../services/riskService';

interface CheckMyAreaSearchProps {
  locations: LocationRisk[];
  onNavigateToLocationDetails: (locationId: string) => void;
}

export interface MonitoredLocality {
  id: string;
  name: string;
  shortName: string;
  ward: string;
  baselineLevel: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
}

export const DEMONSTRATION_LOCALITIES: MonitoredLocality[] = [
  {
    id: 'thuampui-bypass',
    name: 'Thuampui & Zemabawk Bypass',
    shortName: 'Thuampui',
    ward: 'Ward XIX (AMC)',
    baselineLevel: 'VERY HIGH',
  },
  {
    id: 'durtlang-leitan',
    name: 'Durtlang Leitan Corridor',
    shortName: 'Durtlang',
    ward: 'Ward XX (AMC)',
    baselineLevel: 'VERY HIGH',
  },
  {
    id: 'melthum-quarry',
    name: 'Melthum Quarry Corridor',
    shortName: 'Melthum',
    ward: 'AMC S. Boundary',
    baselineLevel: 'VERY HIGH',
  },
  {
    id: 'laipuitlang-ridge',
    name: 'Laipuitlang Ridge & Memorial Scarp',
    shortName: 'Laipuitlang',
    ward: 'Ward IX (AMC)',
    baselineLevel: 'VERY HIGH',
  },
  {
    id: 'bawngkawn-south',
    name: 'Bawngkawn South & Junction',
    shortName: 'Bawngkawn',
    ward: 'Ward XII (AMC)',
    baselineLevel: 'HIGH',
  },
  {
    id: 'khatla-south',
    name: 'Khatla South & Secretariat Descent',
    shortName: 'Khatla',
    ward: 'Ward VIII (AMC)',
    baselineLevel: 'HIGH',
  },
  {
    id: 'tuikual-valley',
    name: 'Tuikual Valley & Rangvamual Road',
    shortName: 'Tuikual',
    ward: 'Ward VI (AMC)',
    baselineLevel: 'VERY HIGH',
  },
  {
    id: 'ramhlun-vengthlang',
    name: 'Ramhlun Vengthlang & Sports Complex',
    shortName: 'Ramhlun',
    ward: 'Ward XI (AMC)',
    baselineLevel: 'HIGH',
  },
  {
    id: 'chanmari-west',
    name: 'Chanmari West & Ramhlun Scarp',
    shortName: 'Chanmari',
    ward: 'Ward X (AMC)',
    baselineLevel: 'HIGH',
  },
  {
    id: 'mission-veng',
    name: 'Mission Veng & Model Veng Flank',
    shortName: 'Mission Veng',
    ward: 'Ward VII (AMC)',
    baselineLevel: 'MODERATE',
  },
  {
    id: 'chaltlang-peak',
    name: 'Chaltlang Crest & Tourist Lodge Slope',
    shortName: 'Chaltlang',
    ward: 'Ward XIII (AMC)',
    baselineLevel: 'MODERATE',
  },
  {
    id: 'zarkawt-square',
    name: 'Zarkawt & Treasury Square Flank',
    shortName: 'Zarkawt',
    ward: 'Ward XIV (AMC)',
    baselineLevel: 'MODERATE',
  },
  {
    id: 'kulikawn-slope',
    name: 'Kulikawn Hospital Ridge',
    shortName: 'Kulikawn',
    ward: 'Ward I (AMC)',
    baselineLevel: 'HIGH',
  },
  {
    id: 'sairang-descent',
    name: 'Sairang Valley Flank Corridor',
    shortName: 'Sairang',
    ward: 'NH-54 Approach',
    baselineLevel: 'HIGH',
  },
];

export const CheckMyAreaSearch: React.FC<CheckMyAreaSearchProps> = ({
  locations,
  onNavigateToLocationDetails,
}) => {
  const [query, setQuery] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DemonstrationRiskAssessment | null>(null);
  const [notFoundInfo, setNotFoundInfo] = useState<{ searched: string; message: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter demonstration suggestions matching current query
  const matchingSuggestions = query.trim().length > 0
    ? DEMONSTRATION_LOCALITIES.filter((loc) => {
        const q = query.toLowerCase().trim();
        return (
          loc.name.toLowerCase().includes(q) ||
          loc.shortName.toLowerCase().includes(q) ||
          loc.id.toLowerCase().includes(q) ||
          loc.ward.toLowerCase().includes(q)
        );
      })
    : [];

  const executeSearch = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    setShowSuggestions(false);

    // 1. Validate Input: Handle empty search
    if (!trimmed) {
      setValidationError('Please enter an Aizawl locality or ward name to check demonstration risk.');
      setResult(null);
      setNotFoundInfo(null);
      setApiError(null);
      return;
    }

    setValidationError(null);
    setLoading(true);
    setResult(null);
    setNotFoundInfo(null);
    setApiError(null);
    setSearchedQuery(trimmed);

    // 2. Call GET /api/risk/:location via service
    const outcome = await fetchDemonstrationRiskResult(trimmed);

    setLoading(false);

    if (outcome.type === 'success') {
      setResult(outcome.data);
    } else if (outcome.type === 'notFound') {
      setNotFoundInfo({
        searched: trimmed,
        message: outcome.message,
      });
    } else {
      setApiError(outcome.error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSelectSuggestion = (loc: MonitoredLocality) => {
    setQuery(loc.name);
    setValidationError(null);
    setShowSuggestions(false);
    executeSearch(loc.name);
  };

  const handleChipClick = (localityName: string) => {
    setQuery(localityName);
    setValidationError(null);
    setShowSuggestions(false);
    executeSearch(localityName);
  };

  // Color mapping based on Phase 1 Risk Level
  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'VERY HIGH':
        return {
          badge: 'bg-red-950/80 text-red-300 border-red-700/60 ring-1 ring-red-500/30',
          text: 'text-red-400',
          bar: 'bg-red-500',
          border: 'border-red-800/60',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-950/80 text-orange-300 border-orange-700/60 ring-1 ring-orange-500/30',
          text: 'text-orange-400',
          bar: 'bg-orange-500',
          border: 'border-orange-800/60',
        };
      case 'MODERATE':
        return {
          badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60 ring-1 ring-yellow-500/30',
          text: 'text-yellow-400',
          bar: 'bg-yellow-400',
          border: 'border-yellow-800/60',
        };
      case 'LOW':
      default:
        return {
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 ring-1 ring-emerald-500/30',
          text: 'text-emerald-400',
          bar: 'bg-emerald-500',
          border: 'border-emerald-800/60',
        };
    }
  };

  // Resolves the best target location key for navigation to Location Details
  const resolveTargetLocationId = (): string => {
    if (!result) return 'thuampui-bypass';

    // 1. If backend matched structured location with ID
    if (typeof result.location === 'object' && result.location?.id) {
      return result.location.id;
    }

    // 2. Try to match name from known locations catalog
    const locName = typeof result.location === 'object' ? result.location.name : String(result.location);
    const searchTarget = (locName || searchedQuery).toLowerCase().trim();

    const matched = locations.find((l) => {
      const idMatch = l.id.toLowerCase().includes(searchTarget) || searchTarget.includes(l.id.toLowerCase());
      const nameMatch = l.name.toLowerCase().includes(searchTarget) || searchTarget.includes(l.name.toLowerCase());
      const wardMatch = l.ward.toLowerCase().includes(searchTarget) || searchTarget.includes(l.ward.toLowerCase());
      return idMatch || nameMatch || wardMatch;
    });

    if (matched) return matched.id;

    if (typeof result.location === 'object' && result.location.id) {
      return result.location.id;
    }

    return searchedQuery.toLowerCase().replace(/\s+/g, '-') || 'thuampui-bypass';
  };

  const colors = getRiskColor(result?.riskLevel);
  const locationDisplayName =
    result && typeof result.location === 'object'
      ? result.location.name
      : typeof result?.location === 'string'
      ? result.location
      : searchedQuery;

  const locationWard =
    result && typeof result.location === 'object' && result.location.ward
      ? result.location.ward
      : 'Aizawl Monitored Corridor (Demonstration)';

  const formatLastUpdated = (rawDateStr?: string) => {
    if (!rawDateStr) return 'DEMO DATA (Phase 1 Baseline)';
    if (rawDateStr.includes('IST')) return rawDateStr;
    try {
      const d = new Date(rawDateStr);
      if (isNaN(d.getTime())) return rawDateStr;
      return (
        d.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST (DEMO DATA)'
      );
    } catch {
      return rawDateStr;
    }
  };

  return (
    <section className="relative border-t border-slate-800/80 bg-gradient-to-b from-[#060a14] via-[#081123] to-[#070b14] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Container */}
        <div
          ref={containerRef}
          className="relative overflow-visible rounded-2xl border border-cyan-900/40 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {/* Subtle Ambient Background Light */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-400 uppercase">
                <Search className="h-3.5 w-3.5" />
                <span>CHECK MY AREA</span>
                <span>•</span>
                <span className="text-amber-400">DEMO DATA</span>
                <span>•</span>
                <span>PHASE 1 ENGINE</span>
              </div>
              <h2 className="mt-1 font-['Chakra_Petch'] text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Demonstration Locality Risk Lookup
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-3xl">
                Search any demonstration locality across Aizawl to calculate simulated slope hazard scores via{' '}
                <code className="text-cyan-300 font-mono">GET /api/risk/:location</code>. All assessments use synthetic demonstration data and a transparent weighted formula.
              </p>
            </div>

            {/* Prominent DEMO DATA Badge */}
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/60 px-3.5 py-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                DEMO DATA ONLY
              </span>
            </div>
          </div>

          {/* Locality Search Form */}
          <form onSubmit={handleSubmit} className="mt-6 relative">
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                </div>
                <input
                  ref={inputRef}
                  id="check-my-area-input"
                  type="text"
                  value={query}
                  autoComplete="off"
                  onFocus={() => {
                    if (query.trim().length > 0) setShowSuggestions(true);
                  }}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (validationError) setValidationError(null);
                    setShowSuggestions(e.target.value.trim().length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="Enter demonstration locality (e.g., Thuampui, Durtlang, Melthum, Bawngkawn, Khatla...)"
                  className={`w-full rounded-xl border ${
                    validationError ? 'border-red-500/80 bg-red-950/20' : 'border-slate-700 bg-slate-900/90'
                  } py-3.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 shadow-inner transition focus:border-cyan-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {showSuggestions && matchingSuggestions.length > 0 && (
                  <div
                    id="check-my-area-suggestions"
                    className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-cyan-800/60 bg-slate-950 p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-black/50"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Matching Monitored Corridors ({matchingSuggestions.length})
                    </div>
                    {matchingSuggestions.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(loc)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-slate-900 hover:text-cyan-300"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-white">{loc.name}</span>
                            <span className="ml-2 text-[11px] text-slate-400">({loc.ward})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                              loc.baselineLevel === 'VERY HIGH'
                                ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                                : loc.baselineLevel === 'HIGH'
                                ? 'bg-orange-950/80 text-orange-300 border border-orange-800/60'
                                : 'bg-yellow-950/80 text-yellow-300 border border-yellow-800/60'
                            }`}
                          >
                            {loc.baselineLevel}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                id="check-my-area-submit-btn"
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Check Locality</span>
                  </>
                )}
              </button>
            </div>

            {/* Validation Message: Empty Search */}
            {validationError && (
              <div
                id="check-my-area-validation-error"
                className="mt-2.5 flex items-center gap-2 text-xs font-medium text-red-400"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Demonstration Locality Quick Selection Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Monitored Demonstration Corridors:</span>
              {DEMONSTRATION_LOCALITIES.slice(0, 8).map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleChipClick(loc.shortName)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-cyan-800 hover:bg-slate-800 hover:text-cyan-300"
                >
                  {loc.shortName}
                </button>
              ))}
            </div>
          </form>

          {/* Loading State */}
          {loading && (
            <div
              id="check-my-area-loading-state"
              className="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 py-10 text-cyan-400"
            >
              <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />
              <div className="text-center">
                <p className="font-mono text-xs font-semibold text-cyan-300 tracking-wider uppercase">
                  Querying GET /api/risk/{encodeURIComponent(searchedQuery)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Calculating synthetic demonstration risk scores and slope stability indicators...
                </p>
              </div>
            </div>
          )}

          {/* Unknown Locality State (404 Handling) */}
          {notFoundInfo && !loading && (
            <div
              id="check-my-area-not-found-state"
              className="mt-6 rounded-2xl border border-amber-800/60 bg-amber-950/25 p-6 text-amber-200"
            >
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Chakra_Petch'] text-base font-bold text-amber-300">
                      Location Not Found: &ldquo;{notFoundInfo.searched}&rdquo;
                    </h3>
                    <span className="rounded bg-amber-900/60 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-700/50">
                      DEMO DATA
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {notFoundInfo.message} For Phase 1 demonstration, risk values are not invented for unmonitored areas. Please choose from the active monitored corridors below:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {DEMONSTRATION_LOCALITIES.slice(0, 8).map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleChipClick(loc.shortName)}
                        className="rounded-lg border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-800/60 hover:text-white"
                      >
                        {loc.shortName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Error State */}
          {apiError && !loading && (
            <div
              id="check-my-area-api-error-state"
              className="mt-6 rounded-2xl border border-red-800/70 bg-red-950/30 p-5 text-red-300"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-['Chakra_Petch'] text-sm font-bold text-red-200">
                    Demonstration Risk API Error
                  </h3>
                  <p className="text-xs text-red-300/90">{apiError}</p>
                  <button
                    type="button"
                    onClick={() => executeSearch(searchedQuery)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-700/60 bg-red-900/50 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry Search</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Returned Compact Risk Information Card */}
          {result && !loading && (
            <div
              id="check-my-area-result-card"
              className={`mt-8 overflow-hidden rounded-2xl border ${colors.border} bg-slate-900/80 shadow-xl transition-all`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900/90 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        id="check-my-area-location-name"
                        className="font-['Chakra_Petch'] text-lg font-bold text-white"
                      >
                        {locationDisplayName}
                      </h3>
                      {/* DEMO DATA Tag */}
                      <span className="rounded bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                        DEMO DATA
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{locationWard}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Risk Level Badge */}
                  <span
                    id="check-my-area-risk-level-badge"
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wider ${colors.badge}`}
                  >
                    {result.riskLevel} RISK
                  </span>

                  {/* "View Full Risk Details" Action Button */}
                  <button
                    id="check-my-area-view-details-btn"
                    type="button"
                    onClick={() => onNavigateToLocationDetails(resolveTargetLocationId())}
                    className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/50 transition hover:bg-cyan-500 active:scale-[0.98]"
                  >
                    <span>View Full Risk Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Core Returned Risk Metrics */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Risk Score & Confidence Box */}
                  <div className="md:col-span-5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                        Risk Score
                      </span>
                      {/* Demonstration Confidence */}
                      <span
                        id="check-my-area-confidence"
                        className="font-mono text-xs font-semibold text-cyan-400"
                        title="Simulated indicator (not a statistically validated ML probability)"
                      >
                        Demo Confidence: {Math.round((result.demonstrationConfidence ?? result.modelConfidence) * 100)}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span
                        id="check-my-area-risk-score"
                        className={`font-['Chakra_Petch'] text-4xl font-extrabold ${colors.text}`}
                      >
                        {result.riskScore}
                      </span>
                      <span className="font-mono text-sm text-slate-400">/ 100</span>
                      <span className="ml-auto text-xs font-semibold text-slate-300">
                        Level: <strong className={colors.text}>{result.riskLevel}</strong>
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                        style={{ width: `${result.riskScore}%` }}
                      />
                    </div>

                    {/* Scale Reference */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                      <span>0-25 LOW • 26-50 MOD • 51-75 HIGH • 76-100 VERY HIGH</span>
                    </div>

                    {/* Last Updated Display */}
                    <div
                      id="check-my-area-last-updated"
                      className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1"
                    >
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>
                        <strong className="text-slate-300">Last updated:</strong>{' '}
                        {formatLastUpdated(result.lastUpdated)}
                      </span>
                    </div>
                  </div>

                  {/* Demonstration Risk Factors Breakdown */}
                  <div className="md:col-span-7 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-300 pb-1 border-b border-slate-800">
                      <span className="font-bold">Calculated Demonstration Factors (Transparent Formula)</span>
                      <span className="rounded bg-amber-950/70 border border-amber-800/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">
                        DEMO DATA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* Rainfall */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Droplets className="h-3 w-3 text-cyan-400" />
                          <span>Rainfall (25%)</span>
                        </div>
                        <div className="mt-1 font-mono font-bold text-white text-xs">
                          {result.factors.rainfall.rawValue} {result.factors.rainfall.unit}
                        </div>
                      </div>

                      {/* Slope */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Mountain className="h-3 w-3 text-amber-400" />
                          <span>Slope (20%)</span>
                        </div>
                        <div className="mt-1 font-mono font-bold text-white text-xs">
                          {result.factors.slope.rawValue}°
                        </div>
                      </div>

                      {/* Wetness */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Layers className="h-3 w-3 text-blue-400" />
                          <span>Wetness (20%)</span>
                        </div>
                        <div className="mt-1 font-mono font-bold text-white text-xs">
                          {result.factors.wetness.rawValue}%
                        </div>
                      </div>

                      {/* Historical Activity */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <History className="h-3 w-3 text-orange-400" />
                          <span>History (15%)</span>
                        </div>
                        <div className="mt-1 font-mono font-bold text-white text-xs truncate">
                          {String(result.factors.historicalActivity.rawValue).split('(')[0]}
                        </div>
                      </div>

                      {/* Land Cover */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Trees className="h-3 w-3 text-emerald-400" />
                          <span>Land Cover (10%)</span>
                        </div>
                        <div className="mt-1 font-mono font-bold text-white text-xs truncate">
                          {String(result.factors.landCover.rawValue).split(':')[0]}
                        </div>
                      </div>

                      {/* Elevation */}
                      <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Mountain className="h-3 w-3 text-purple-400" />
                          <span>Elevation (10%)</span>
                        </div>
                        <div className="mt-1 font-mono font-bold text-white text-xs">
                          {result.factors.elevation.rawValue}m
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Notice & Secondary Navigation Link */}
                <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-2.5 text-xs text-amber-200/90">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-amber-300 font-semibold">DEMO DATA NOTICE: </strong>
                      Calculated using Phase 1 weighted formula. Not certified ML model inference or live sensor measurements.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToLocationDetails(resolveTargetLocationId())}
                    className="group inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 shrink-0"
                  >
                    <span>View Full Risk Details</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
