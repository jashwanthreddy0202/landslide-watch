import {
  CityHazardOverview,
  DemonstrationRiskAssessment,
  LocationRisk,
  SimulationScenario,
  ScenarioEvaluationResult,
  DemonstrationScenario,
} from '../types';
import { AIZAWL_OVERVIEW, SIMULATION_SCENARIOS } from '../data/mockData';
import { DEMONSTRATION_RISK_POINTS, DemonstrationRiskPoint } from '../data/demonstrationRiskPoints';
import { DEMONSTRATION_SCENARIOS } from '../data/demonstrationScenarios';

export type DemonstrationRiskResult =
  | { type: 'success'; data: DemonstrationRiskAssessment }
  | { type: 'notFound'; message: string; isDemoData: boolean }
  | { type: 'error'; error: string };

export interface DemonstrationRiskRequestOptions {
  scenarioId?: string | null;
  rainfall?: number;
  wetness?: number;
  slope?: number;
  signal?: AbortSignal;
}

function buildRiskQueryParams(options?: string | DemonstrationRiskRequestOptions): string {
  if (!options) return '';
  if (typeof options === 'string') {
    return options && options !== 'none' ? `?scenario=${encodeURIComponent(options)}` : '';
  }
  const params = new URLSearchParams();
  if (options.scenarioId && options.scenarioId !== 'none') {
    params.set('scenario', options.scenarioId);
  }
  if (options.rainfall !== undefined && !isNaN(options.rainfall)) {
    params.set('rainfall', String(options.rainfall));
  }
  if (options.wetness !== undefined && !isNaN(options.wetness)) {
    params.set('wetness', String(options.wetness));
  }
  if (options.slope !== undefined && !isNaN(options.slope)) {
    params.set('slope', String(options.slope));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchDemonstrationRiskPoints(
  options?: string | DemonstrationRiskRequestOptions
): Promise<DemonstrationRiskPoint[]> {
  try {
    const query = buildRiskQueryParams(options);
    const signal = typeof options === 'object' && options !== null ? options.signal : undefined;
    const url = `/api/risk/points${query}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    return DEMONSTRATION_RISK_POINTS;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    console.warn('Fallback to local demonstration risk points:', err);
    return DEMONSTRATION_RISK_POINTS;
  }
}

export async function fetchDemonstrationRiskResult(
  locationIdOrName: string,
  options?: string | DemonstrationRiskRequestOptions
): Promise<DemonstrationRiskResult> {
  try {
    const query = buildRiskQueryParams(options);
    const signal = typeof options === 'object' && options !== null ? options.signal : undefined;
    const res = await fetch(`/api/risk/${encodeURIComponent(locationIdOrName)}${query}`, { signal });
    if (res.status === 404) {
      const errorJson = await res.json().catch(() => ({}));
      return {
        type: 'notFound',
        message:
          errorJson.message ||
          `Locality "${locationIdOrName}" was not found in Landslide Watch demonstration corridors.`,
        isDemoData: true,
      };
    }
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return {
        type: 'error',
        error:
          errorJson.error ||
          errorJson.message ||
          `HTTP ${res.status}: Failed to calculate demonstration risk.`,
      };
    }
    const data: DemonstrationRiskAssessment = await res.json();
    return { type: 'success', data };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      type: 'error',
      error: `Network error connecting to demonstration risk service (${errMsg}). Please verify your connection and try again.`,
    };
  }
}

export async function fetchDemonstrationRisk(
  locationIdOrName: string,
  options?: string | DemonstrationRiskRequestOptions
): Promise<DemonstrationRiskAssessment | null> {
  try {
    const query = buildRiskQueryParams(options);
    const signal = typeof options === 'object' && options !== null ? options.signal : undefined;
    const res = await fetch(`/api/risk/${encodeURIComponent(locationIdOrName)}${query}`, { signal });
    if (!res.ok) throw new Error(`Failed to fetch demonstration risk for ${locationIdOrName}`);
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    console.warn(`Demonstration risk endpoint fallback for ${locationIdOrName}:`, err);
    return null;
  }
}

export async function evaluateDemonstrationScenario(
  scenarioId: string,
  location?: string
): Promise<ScenarioEvaluationResult> {
  const res = await fetch('/api/risk/scenarios/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, location }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to evaluate scenario`);
  return await res.json();
}

export function getDemonstrationScenarios(): DemonstrationScenario[] {
  return DEMONSTRATION_SCENARIOS;
}

export async function fetchCityOverview(): Promise<CityHazardOverview> {
  try {
    const res = await fetch('/api/telemetry/overview');
    if (!res.ok) throw new Error('Failed to fetch overview');
    return await res.json();
  } catch (err) {
    console.warn('Using fallback overview data:', err);
    return AIZAWL_OVERVIEW;
  }
}

export async function fetchScenarios(): Promise<SimulationScenario[]> {
  try {
    const res = await fetch('/api/scenarios');
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return await res.json();
  } catch (err) {
    console.warn('Using fallback scenarios:', err);
    return SIMULATION_SCENARIOS;
  }
}

export async function applySimulationScenario(scenarioId: string): Promise<{
  success: boolean;
  overview: CityHazardOverview;
  locations: LocationRisk[];
}> {
  try {
    const res = await fetch('/api/simulation/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to apply scenario');
    return await res.json();
  } catch (err) {
    console.error('Error applying scenario:', err);
    throw err;
  }
}
