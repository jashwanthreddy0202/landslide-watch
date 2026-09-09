import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  PhoneCall,
  Clock,
  ShieldCheck,
  FileText,
  MapPin,
  Car,
  CheckCircle2,
  Radio,
  RefreshCw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { FissureReport, PublicAlert, DemonstrationScenarioId } from '../types';
import { fetchCommunityReports } from '../services/api';
import { fetchAlerts, FetchAlertsOptions } from '../services/alertService';
import { AlertCard } from '../components/AlertCard';

interface AlertsPageProps {
  alerts?: PublicAlert[];
  onNavigate?: (page: string, contextId?: string) => void;
  onOpenReportModal: () => void;
  onOpenEvacuationProtocol: () => void;
}

type FilterOption = 'All' | 'Low' | 'Moderate' | 'High' | 'Very High';
const FILTER_OPTIONS: FilterOption[] = ['All', 'Low', 'Moderate', 'High', 'Very High'];

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts: initialAlerts,
  onNavigate,
  onOpenReportModal,
  onOpenEvacuationProtocol,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('All');
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [allAlerts, setAllAlerts] = useState<PublicAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [communityReports, setCommunityReports] = useState<FissureReport[]>([]);

  // Demonstration Scenario State
  const [activeScenarioId, setActiveScenarioId] = useState<DemonstrationScenarioId | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [simulatedFactors, setSimulatedFactors] = useState<{ rainfall?: number; wetness?: number }>({});

  // Request cancellation and sequence tracking to prevent race conditions and stale overwrites
  const alertAbortControllerRef = useRef<AbortController | null>(null);
  const alertRequestIdRef = useRef<number>(0);

  // Fetch alerts from API: GET /api/alerts
  const loadAlerts = useCallback(
    async (
      filter: FilterOption,
      scenarioId?: DemonstrationScenarioId | null,
      factors?: { rainfall?: number; wetness?: number }
    ) => {
      // Abort prior in-flight request
      if (alertAbortControllerRef.current) {
        alertAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      alertAbortControllerRef.current = abortController;
      const currentRequestId = ++alertRequestIdRef.current;

      setLoading(true);
      setError(null);
      const effectiveScenario =
        scenarioId !== undefined ? scenarioId : activeScenarioId;
      const effectiveRainfall =
        factors?.rainfall !== undefined ? factors.rainfall : simulatedFactors.rainfall;
      const effectiveWetness =
        factors?.wetness !== undefined ? factors.wetness : simulatedFactors.wetness;

      const opts: FetchAlertsOptions = {
        scenario: effectiveScenario || undefined,
        rainfall: effectiveRainfall,
        wetness: effectiveWetness,
        signal: abortController.signal,
      };

      try {
        const [data, all] = await Promise.all([
          fetchAlerts({
            ...opts,
            level: filter === 'All' ? undefined : filter,
          }),
          filter === 'All'
            ? Promise.resolve(null)
            : fetchAlerts(opts),
        ]);

        if (currentRequestId !== alertRequestIdRef.current) {
          return;
        }

        setAlerts(data);
        if (filter === 'All') {
          setAllAlerts(data);
        } else if (all) {
          setAllAlerts(all);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to load demonstration alerts from API (${msg}). Retaining previous alerts.`);
      } finally {
        if (currentRequestId === alertRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [activeScenarioId, simulatedFactors]
  );

  useEffect(() => {
    loadAlerts(selectedFilter);
  }, [selectedFilter, loadAlerts]);

  const handleSelectScenario = async (scenarioId: DemonstrationScenarioId) => {
    setActiveScenarioId(scenarioId);
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      await loadAlerts(selectedFilter, scenarioId, simulatedFactors);
    } catch {
      setScenarioError('Failed to apply demonstration scenario to alerts.');
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
      await loadAlerts(selectedFilter, null, { rainfall: 15, wetness: 30 });
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
      await loadAlerts(selectedFilter, activeScenarioId, factors);
    } catch {
      setScenarioError('Failed to recalculate alerts for environmental factors.');
    } finally {
      setScenarioLoading(false);
    }
  };

  // Fetch community ground reports
  useEffect(() => {
    fetchCommunityReports().then((data) => setCommunityReports(data));
  }, []);

  const handleFilterChange = (filter: FilterOption) => {
    setSelectedFilter(filter);
  };

  const handleViewAffectedArea = (locationIdOrName: string) => {
    if (onNavigate) {
      onNavigate('risk-map', locationIdOrName);
    } else {
      window.history.pushState(
        { page: 'risk-map', location: locationIdOrName },
        '',
        `/risk-map?location=${encodeURIComponent(locationIdOrName)}`
      );
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Filter count calculation
  const getFilterCount = (filter: FilterOption) => {
    const list = allAlerts.length > 0 ? allAlerts : alerts;
    if (filter === 'All') return list.length;
    return list.filter((a) => {
      const level = (a.riskLevel || a.level || '').toLowerCase().replace(/[\s-_]+/g, '');
      const target = filter.toLowerCase().replace(/[\s-_]+/g, '');
      if (target === 'high') {
        return level === 'high' && !level.includes('very');
      }
      return level === target || level.includes(target);
    }).length;
  };

  return (
    <div className="min-h-screen bg-[#060a14] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>DEMONSTRATION ALERT SYSTEM</span>
              <span>•</span>
              <span className="text-cyan-400">PHASE 1 ENGINE</span>
            </div>
            <h1 className="mt-1 font-['Chakra_Petch'] text-2xl sm:text-3xl font-extrabold text-white">
              Public Safety Alerts & Bulletins
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-3xl">
              Simulated early warning bulletins for monitored corridors in Aizawl. All alerts below are synthetic demonstration estimates for Phase 1 prototype evaluation and do not represent official government declarations or civil defense orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="report-ground-fissure-btn"
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-950/60 px-4 py-2.5 text-xs font-bold text-red-200 transition hover:bg-red-900/50"
            >
              <FileText className="h-4 w-4" />
              <span>Report Ground Fissure</span>
            </button>

            <button
              id="view-evacuation-checklist-btn"
              type="button"
              onClick={onOpenEvacuationProtocol}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-cyan-500"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Evacuation Guide</span>
            </button>
          </div>
        </div>

        {/* Small Disclaimer Banner */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="leading-relaxed">
            <span className="font-bold text-amber-300">Disclaimer:</span> Demonstration alerts only. Always follow official instructions from local authorities.
          </p>
        </div>

        {/* Emergency Helpline Banner */}
        <div className="rounded-2xl border border-red-900/60 bg-gradient-to-r from-red-950/80 to-slate-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Official Disaster Control Helpline: 1070
                </h3>
                <span className="rounded bg-red-900/60 px-2 py-0.5 text-[10px] font-mono text-red-200">
                  Real-World Emergency
                </span>
              </div>
              <p className="text-xs text-red-200">
                Direct lines to AMC Quick Response Team & State Disaster Management Authority (SEOC Aizawl) for real-world emergencies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:1070"
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-red-950 hover:bg-slate-100 transition shadow"
            >
              Dial 1070 Toll-Free
            </a>
            <a
              href="tel:03892335837"
              className="rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
            >
              0389-2335837
            </a>
          </div>
        </div>

        {/* Severity Filter Pills: All, Moderate, High, Very High */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Filter Alerts:
            </span>
            {FILTER_OPTIONS.map((filter) => {
              const isSelected = selectedFilter === filter;
              const count = getFilterCount(filter);
              return (
                <button
                  key={filter}
                  id={`filter-${filter.toLowerCase().replace(/\s+/g, '-')}-btn`}
                  type="button"
                  onClick={() => handleFilterChange(filter)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {filter} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => loadAlerts(selectedFilter)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Alerts</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="font-mono text-xs text-cyan-300 uppercase tracking-wider">
              Fetching demonstration alerts from GET /api/alerts...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-800/80 bg-red-950/30 p-6 text-red-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-red-200">Alerts Backend Connection Error</h3>
                <p className="text-xs text-red-300/90">{error}</p>
                <button
                  type="button"
                  onClick={() => loadAlerts(selectedFilter)}
                  className="rounded-lg bg-red-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Bulletin Grid */}
        {!loading && !error && alerts.length > 0 && (
          <div className="space-y-6">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onOpenEvacuationProtocol={onOpenEvacuationProtocol}
                onViewAffectedArea={handleViewAffectedArea}
              />
            ))}
          </div>
        )}

        {/* Empty Filter State */}
        {!loading && !error && alerts.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center text-slate-400">
            <Info className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <h3 className="text-sm font-semibold text-white">
              No Demonstration Alerts for Filter &ldquo;{selectedFilter}&rdquo;
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              There are currently no demonstration advisories matching this risk level.
            </p>
            <button
              type="button"
              onClick={() => setSelectedFilter('All')}
              className="mt-4 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-500"
            >
              Show All Bulletins
            </button>
          </div>
        )}

        {/* Community Fissure Reports Feed (If any exist) */}
        {communityReports.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <h3 className="font-['Chakra_Petch'] text-base font-bold text-white">
                  Citizen Verified Ground Reports ({communityReports.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Recent crowdsourced submissions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {communityReports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400">{rep.id}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-amber-300 font-semibold">
                      {rep.status}
                    </span>
                  </div>
                  <div className="font-medium text-slate-200">{rep.ward}</div>
                  <p className="text-slate-400 text-[11px]">{rep.locationDescription}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Fissure: {rep.fissureWidthCm}cm wide • {rep.fissureLengthMeters}m long
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
