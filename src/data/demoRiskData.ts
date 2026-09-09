import { CityHazardOverview, SimulationScenario } from '../types';

export const demoRiskOverview: CityHazardOverview = {
  cityThreatScore: 78,
  alertLevel: 'HIGH RISK (ORANGE ALERT)',
  alertDescription: 'Monsoon saturation index reached 88.4%. High vulnerability on eastern slopes.',
  monsoonSaturationPercent: 88.4,
  cumulativeRainfall24h: 118.4,
  rainfallThresholdExcess: 42.0,
  peakIntensityMmHr: 14.8,
  peakIntensityStation: 'Thuampui AWS',
  activeDangerZonesCount: 12,
  criticalWardsCount: 3,
  severeWardsCount: 5,
  watchWardsCount: 4,
  gridCellsCount: 12482,
  sensorsOnlinePercent: 99.8,
  calculationLatencySeconds: 2.1,
  lastSyncTime: '14:28:02 IST',
  isDemonstrationData: true,
  dataSourceNotice: 'DEMONSTRATION DATA (Phase 1 MVP) — Synthesized from Geological Survey of India historical archives & pilot sensor specs. Not connected to active government telemetry.'
};

export const demoScenarios: SimulationScenario[] = [
  {
    id: 'current-monsoon',
    name: 'Active Monsoon Trigger (Current Baseline)',
    description: '118.4 mm 24h rainfall, saturated eastern ridgelines (88.4% saturation), 3 critical hotspots.',
    rainMultiplier: 1.0,
    porePressureOffsetKPa: 0,
    saturationOffsetPercent: 0
  },
  {
    id: 'extreme-cloudburst',
    name: 'Extreme Cloudburst Event (+50mm in 2 hours)',
    description: 'Simulates convective cloudburst dump. Pore pressure spikes +18 kPa across all wards, pushing 7 wards into Critical failure state.',
    rainMultiplier: 1.65,
    porePressureOffsetKPa: 18.0,
    saturationOffsetPercent: 8.5
  },
  {
    id: 'post-monsoon-drainage',
    name: 'Dry Weather Drainage Phase',
    description: 'Simulates 48 hours of clear weather. Pore pressure diminishes, moisture drops to 62%, restoring Factor of Safety > 1.25 across all corridors.',
    rainMultiplier: 0.2,
    porePressureOffsetKPa: -28.0,
    saturationOffsetPercent: -24.0
  }
];

export const AIZAWL_OVERVIEW = demoRiskOverview;
export const SIMULATION_SCENARIOS = demoScenarios;
