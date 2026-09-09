export type AlertLevel = 'CRITICAL RED ALERT' | 'ORANGE ALERT' | 'YELLOW ADVISORY' | 'INFO';

export type RiskLevel = 'Critical' | 'Severe' | 'Watch' | 'Low';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface InclinometerReading {
  code: string;
  depth: string;
  velocityMmHr: number;
  status: 'Stable' | 'Accelerating' | 'Critical Strain';
}

export interface GeotechnicalProfile {
  formation: string;
  dipAngle: string;
  soilDepthM: number;
  lithology: string;
  shearStrengthKPa: number;
  frictionAngleDeg: number;
}

export interface HydrologyData {
  catchment: string;
  porePressureKPa: number;
  porePressureStatus: 'Normal' | 'Elevated' | 'Critical Saturated';
  soilMoisturePercent: number;
  piezometerShiftMmHr: number;
  rainfall24hMm: number;
  rainfall72hMm: number;
  drainageEfficiency: 'Poor' | 'Moderate' | 'Adequate';
}

export interface EvacuationInfo {
  name: string;
  distanceMeters: number;
  safeCorridor: string;
  capacity: number;
  contact: string;
  status: 'Open' | 'Standby' | 'Sheltering';
}

export interface LocationRisk {
  id: string;
  name: string;
  ward: string;
  coordinates: Coordinates;
  elevationM: number;
  slopeGradientDeg: number;
  slopeAspect: string;
  geology: GeotechnicalProfile;
  hydrology: HydrologyData;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  factorOfSafety: number; // < 1.0 failure, 1.0 - 1.2 critical, 1.2 - 1.5 moderate, > 1.5 stable
  failureProbability: number; // percentage
  vulnerableAssets: string[];
  evacuation: EvacuationInfo;
  inclinometers: InclinometerReading[];
  historicalEvents: string[];
  lastRecalculated: string;
}

export interface CityHazardOverview {
  cityThreatScore: number;
  alertLevel: string;
  alertDescription: string;
  monsoonSaturationPercent: number;
  cumulativeRainfall24h: number;
  rainfallThresholdExcess: number;
  peakIntensityMmHr: number;
  peakIntensityStation: string;
  activeDangerZonesCount: number;
  criticalWardsCount: number;
  severeWardsCount: number;
  watchWardsCount: number;
  gridCellsCount: number;
  sensorsOnlinePercent: number;
  calculationLatencySeconds: number;
  lastSyncTime: string;
  isDemonstrationData: boolean;
  dataSourceNotice: string;
}

export interface PublicAlert {
  id: string;
  location: string;
  locationId?: string;
  riskLevel: 'LOW' | 'Moderate' | 'High' | 'Very High' | string;
  title: string;
  description: string;
  issuedAt: string;
  status: string;
  isDemoData: boolean;

  // Single Source of Truth Risk Engine fields
  riskScore?: number;
  demonstrationConfidence?: number;
  modelConfidence?: number;
  factors?: DemonstrationRiskFactors;
  factorContributions?: FactorContributionsBreakdown;
  calculationMethod?: string;
  lastUpdated?: string;

  // Compatibility fields
  level?: AlertLevel | string;
  timeAgo?: string;
  timestamp?: string;
  summary?: string;
  details?: string;
  factorOfSafety?: number;
  actionRequired?: string;
  zone?: string;
  affectedLocations?: string[];
  roadClosures?: string[];
  bulletinNo?: string;
}

export interface FissureReport {
  id: string;
  reporterName: string;
  phone: string;
  ward: string;
  locationDescription: string;
  fissureWidthCm: number;
  fissureLengthMeters: number;
  waterSeepageObserved: boolean;
  structureCracking: boolean;
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  timestamp: string;
  status: 'Pending Verification' | 'Dispatched Inspection' | 'Resolved';
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  rainMultiplier: number;
  porePressureOffsetKPa: number;
  saturationOffsetPercent: number;
}

export interface AIExplanationResult {
  locationId: string;
  locationName: string;
  riskLevel: string;
  factorOfSafety: number;
  summary: string;
  geotechnicalFactors: string[];
  immediateActions: string[];
  mizoSafetyAdvice: string;
  generatedByGemini: boolean;
  modelUsed: string;
  generatedAt: string;
}

// Phase 1 Demonstration Landslide Risk Engine Types
export type Phase1RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';

export interface DemonstrationFactor {
  name: string;
  rawValue: number | string;
  unit?: string;
  normalizedScore: number; // 0 - 100
  weight: number; // e.g. 0.25 (25%)
  weightedContribution: number; // normalizedScore * weight
  description: string;
  isDemoData: boolean;
}

export interface DemonstrationRiskFactors {
  rainfall: DemonstrationFactor;
  slope: DemonstrationFactor;
  elevation: DemonstrationFactor;
  wetness: DemonstrationFactor;
  historicalActivity: DemonstrationFactor;
  landCover: DemonstrationFactor;
}

export interface FactorContribution {
  name: string;
  weight: number; // e.g. 0.25
  weightPercent: number; // e.g. 25
  rawValue: number | string;
  unit?: string;
  normalizedScore: number; // 0 - 100
  weightedContribution: number; // normalizedScore * weight
  interpretation: string;
}

export interface FactorContributionsBreakdown {
  rainfall: FactorContribution;
  slope: FactorContribution;
  wetness: FactorContribution;
  historicalActivity: FactorContribution;
  landCover: FactorContribution;
  elevation: FactorContribution;
}

export interface DemonstrationRiskAssessment {
  location: string | {
    id: string;
    targetLocationId?: string;
    name: string;
    ward?: string;
    coordinates?: Coordinates;
  };
  riskScore: number; // 0 - 100
  riskLevel: Phase1RiskLevel;
  demonstrationConfidence: number; // 0.0 - 1.0 (e.g. 0.85)
  modelConfidence: number; // 0.0 - 1.0 (kept for backward compatibility)
  engine: string; // "Phase 1 Demonstration Risk Engine"
  calculationMethod: string;
  factors: DemonstrationRiskFactors;
  factorContributions: FactorContributionsBreakdown;
  riskFactors?: string[];
  mainRiskFactors?: string[];
  factorOfSafety?: number;
  estimatedRisk?: string;
  lastUpdated: string;
  isDemoData: boolean;
  formulaDescription?: string;
  disclaimer?: string;
}

// Step 10 Gemini Explainable Risk Summaries Types
export interface ExplainRiskFactors {
  rainfall: number;
  slope: number;
  wetness: number;
  historicalActivity: number;
  landCover: number;
  elevation: number;
}

export interface ExplainRiskRequestBody {
  location: string;
  riskScore: number;
  riskLevel: string;
  modelConfidence?: number;
  demonstrationConfidence?: number;
  factors: ExplainRiskFactors;
  isDemoData: boolean;
  simulateFailure?: boolean;
}

export interface ExplainRiskResponse {
  location: string;
  riskScore: number;
  riskLevel: string;
  modelConfidence: number;
  demonstrationConfidence?: number;
  summary: string;
  mainFactors: string[];
  whyTheyMatter: string[];
  generalPublicGuidance?: string;
  isDemoData: boolean;
  generatedByGemini: boolean;
  modelUsed: string;
  generatedAt: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

// Step 13 Demonstration Scenarios Types (Audited Backend Single Source of Truth)
export type DemonstrationScenarioId =
  | 'normal'
  | 'increasing-rainfall'
  | 'heavy-rainfall'
  | 'extreme-risk';

export interface DemonstrationScenarioFactors {
  rainfallMm: number;
  wetnessPercent: number;
  slopeDeg: number;
  historicalActivityLevel: string | number;
  elevationM?: number;
  landCoverType?: string | number;
}

export interface DemonstrationScenario {
  id: DemonstrationScenarioId;
  name: string;
  badge: string;
  conditionSummary: string;
  factors: DemonstrationScenarioFactors;
  expectedResult: string;
  expectedRiskLevel: Phase1RiskLevel;
  explanation: string;
  isDemoData: boolean;
}

export interface DemonstrationAlertState {
  status: 'ROUTINE_OBSERVATION' | 'SEASONAL_WATCH' | 'WARNING_ADVISORY' | 'EMERGENCY_BULLETIN';
  alertLevel: Phase1RiskLevel;
  thresholdCrossed: boolean;
  thresholdDescription: string;
  recommendedAction: string;
  isDemoData: boolean;
}

export interface ScenarioEvaluationResult {
  scenario: DemonstrationScenario;
  assessment: DemonstrationRiskAssessment;
  alertState: DemonstrationAlertState;
  isDemoData: boolean;
  isDemoScenario: boolean;
}
