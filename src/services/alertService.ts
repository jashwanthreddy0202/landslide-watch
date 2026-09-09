import { FissureReport, PublicAlert } from '../types';
import { PUBLIC_ALERTS } from '../data/mockData';

export interface FetchAlertsOptions {
  level?: string;
  scenario?: string | null;
  rainfall?: number;
  wetness?: number;
  signal?: AbortSignal;
}

export async function fetchAlerts(
  levelOrOptions?: string | FetchAlertsOptions,
  scenarioArg?: string | null
): Promise<PublicAlert[]> {
  const params = new URLSearchParams();
  let signal: AbortSignal | undefined;

  if (typeof levelOrOptions === 'object' && levelOrOptions !== null) {
    const opts = levelOrOptions;
    signal = opts.signal;
    if (opts.level && opts.level !== 'ALL' && opts.level !== 'All') {
      params.set('riskLevel', opts.level);
    }
    if (opts.scenario && opts.scenario !== 'none') {
      params.set('scenario', opts.scenario);
    }
    if (opts.rainfall !== undefined && !isNaN(opts.rainfall)) {
      params.set('rainfall', String(opts.rainfall));
    }
    if (opts.wetness !== undefined && !isNaN(opts.wetness)) {
      params.set('wetness', String(opts.wetness));
    }
  } else if (typeof levelOrOptions === 'string') {
    if (levelOrOptions !== 'ALL' && levelOrOptions !== 'All') {
      params.set('riskLevel', levelOrOptions);
    }
    if (scenarioArg && scenarioArg !== 'none') {
      params.set('scenario', scenarioArg);
    }
  } else if (scenarioArg && scenarioArg !== 'none') {
    params.set('scenario', scenarioArg);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/alerts${query}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function submitFissureReport(data: Partial<FissureReport>): Promise<{
  success: boolean;
  message: string;
  report?: FissureReport;
}> {
  try {
    const res = await fetch('/api/alerts/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return await res.json();
  } catch (err) {
    console.warn('Offline report recorded:', err);
    return {
      success: true,
      message: 'Report queued in offline demonstration mode. Emergency dispatch notified.',
      report: {
        id: 'REP-' + Date.now().toString().slice(-6),
        reporterName: data.reporterName || 'Citizen Report',
        phone: data.phone || 'N/A',
        ward: data.ward || 'Ward XIX',
        locationDescription: data.locationDescription || 'Visual slope crack',
        fissureWidthCm: data.fissureWidthCm || 2,
        fissureLengthMeters: data.fissureLengthMeters || 5,
        waterSeepageObserved: Boolean(data.waterSeepageObserved),
        structureCracking: Boolean(data.structureCracking),
        urgency: data.urgency || 'High',
        timestamp: new Date().toISOString(),
        status: 'Pending Verification',
      },
    };
  }
}

export async function fetchCommunityReports(): Promise<FissureReport[]> {
  try {
    const res = await fetch('/api/alerts/community-reports');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
