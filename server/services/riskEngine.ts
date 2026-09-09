import {
  DemonstrationFactor,
  DemonstrationRiskAssessment,
  DemonstrationRiskFactors,
  FactorContributionsBreakdown,
  Phase1RiskLevel,
  LocationRisk,
} from '../../src/types';
import { AIZAWL_LOCATIONS } from '../data/mockData';
import {
  DEMONSTRATION_RISK_POINTS,
  DemonstrationRiskPoint,
} from '../../src/data/demonstrationRiskPoints';

/**
 * ============================================================================
 * PHASE 1 DEMONSTRATION LANDSLIDE RISK ENGINE
 *
 * IMPORTANT ARCHITECTURAL SPECIFICATION:
 * - Engine Name: Phase 1 Demonstration Risk Engine
 * - Nature: Deterministic, transparent weighted heuristic for demonstration & UI testing.
 * - DISCLAIMER: NOT certified ML model inference or live physical sensor measurements.
 *   All factor values and risk scores are synthetic demonstration estimates.
 * - This service is strictly isolated to allow seamless replacement by a certified,
 *   trained ML inference model using real geospatial & environmental data in future phases.
 * ============================================================================
 */

export interface GeographicRiskInput {
  locationId?: string;
  name?: string;
  ward?: string;
  coordinates?: { lat: number; lng: number };
  rainfallMm?: number;
  slopeDeg?: number;
  elevationM?: number;
  wetnessPercent?: number;
  historicalActivityLevel?: 'None' | 'Low' | 'Moderate' | 'High' | 'Critical' | string | number;
  landCoverType?: string | number;
}

/**
 * Explicit Demonstration Factor Weights (Sum = 1.00 / 100%)
 */
export const FACTOR_WEIGHTS = {
  rainfall: 0.25, // 25% weight: 24h antecedent precipitation trigger
  slope: 0.20, // 20% weight: terrain inclination steepness
  wetness: 0.20, // 20% weight: soil moisture saturation and pore-fluid state
  historicalActivity: 0.15, // 15% weight: documented past failure scars & crack recurrence
  landCover: 0.10, // 10% weight: vegetative shear binding vs disturbed cut slopes
  elevation: 0.10, // 10% weight: topographic relief & drainage head (gently sloping plateaus remain low risk)
} as const;

export const TRANSPARENT_FORMULA_EXPLANATION =
  'DEMO FORMULA: RiskScore = Round((Rainfall × 0.25) + (Slope × 0.20) + (Wetness × 0.20) + (HistoricalActivity × 0.15) + (LandCover × 0.10) + (Elevation × 0.10))';

export const CALCULATION_METHOD_DESCRIPTION =
  'Phase 1 uses a transparent weighted demonstration heuristic. Real-world deployment will replace this with a trained and validated ML model using real geospatial and environmental data.';

export const DEMO_DATA_DISCLAIMER =
  'DEMO DATA (Phase 1 Prototype) — All values are synthetic demonstration estimates produced by a transparent heuristic formula. NOT certified ML model inference or live sensor measurements.';

/**
 * Determines Phase 1 Risk Level according to the required thresholds:
 * 0–25   = LOW
 * 26–50  = MODERATE
 * 51–75  = HIGH
 * 76–100 = VERY HIGH
 */
export function getPhase1RiskLevel(score: number): Phase1RiskLevel {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped <= 25) return 'LOW';
  if (clamped <= 50) return 'MODERATE';
  if (clamped <= 75) return 'HIGH';
  return 'VERY HIGH';
}

/**
 * Normalizes 24-hour rainfall (mm) to a 0–100 scale.
 * Interpretation: Higher rainfall -> higher demonstration risk (intense precipitation surges pore-water pressure).
 * 0 mm = 0, 140+ mm = 100.
 */
function normalizeRainfall(rainfallMm: number): { score: number; value: number } {
  const val = Math.max(0, Number(rainfallMm));
  const normalized = Math.min(100, Math.max(0, Math.round((val / 140) * 100)));
  return { score: normalized, value: val };
}

/**
 * Normalizes slope gradient (degrees) to a 0–100 scale.
 * Interpretation: Higher slope -> higher demonstration risk (steeper inclination increases gravitational shear stress).
 * 0° = 0, 55°+ = 100 (Aizawl steep escarpments range 35°–55°).
 */
function normalizeSlope(slopeDeg: number): { score: number; value: number } {
  const val = Math.max(0, Number(slopeDeg));
  const normalized = Math.min(100, Math.max(0, Math.round((val / 55) * 100)));
  return { score: normalized, value: val };
}

/**
 * Normalizes subsurface wetness / soil saturation (percent) to a 0–100 scale.
 * Interpretation: Higher wetness -> higher demonstration risk (saturation reduces effective friction and cohesion).
 * 0% = 0, 100% = 100.
 */
function normalizeWetness(wetnessPercent: number): { score: number; value: number } {
  const val = Math.max(0, Math.min(100, Number(wetnessPercent)));
  return { score: Math.round(val), value: val };
}

/**
 * Normalizes topographic relief / elevation profile to a 0–100 scale.
 * Interpretation: Topographic relief and drainage head.
 * IMPORTANT: High elevation alone does NOT mean high landslide risk; high broad plateaus
 * with gentle slope remain low risk.
 */
function normalizeElevation(elevationM: number, slopeDeg?: number): { score: number; value: number } {
  const val = Math.max(0, Number(elevationM));
  // If terrain is a flat summit plateau (slope <= 15°), relief energy is low
  if (slopeDeg !== undefined && slopeDeg <= 15) {
    return { score: 15, value: val };
  }
  // Normalizes valley floors (~600m) to crest escarpments (~1400m)
  const normalized = Math.min(100, Math.max(10, Math.round(((val - 600) / 800) * 100)));
  return { score: normalized, value: val };
}

/**
 * Normalizes historical activity to a 0–100 scale.
 * Interpretation: Higher historical activity -> higher demonstration risk (past failure scars indicate pre-existing weak planes).
 */
function normalizeHistoricalActivity(level?: string | number): { score: number; label: string } {
  if (typeof level === 'number') {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return { score: clamped, label: `Historical index score: ${clamped}/100` };
  }
  const norm = (level || '').toLowerCase();
  if (norm.includes('critical') || norm.includes('frequent') || norm.includes('subsidence')) {
    return { score: 94, label: 'Critical (Documented historical scars & recurrent tension cracks)' };
  }
  if (norm.includes('high') || norm.includes('severe') || norm.includes('2023') || norm.includes('2024') || norm.includes('2020') || norm.includes('2019') || norm.includes('2013')) {
    return { score: 75, label: 'High (Documented historical ground creep & toe scours)' };
  }
  if (norm.includes('moderate') || norm.includes('medium')) {
    return { score: 45, label: 'Moderate (Intermittent seasonal road cracking)' };
  }
  if (norm.includes('low') || norm.includes('watch')) {
    return { score: 30, label: 'Low (Minor localized surface creep history)' };
  }
  return { score: 20, label: 'Baseline (No major historical failure recorded)' };
}

/**
 * Normalizes land cover condition to a 0–100 scale.
 * Interpretation: More destabilizing land-cover condition -> higher demonstration risk (unvegetated cuts lack root shear binding).
 */
function normalizeLandCover(landCover?: string | number): { score: number; label: string } {
  if (typeof landCover === 'number') {
    const clamped = Math.max(0, Math.min(100, Math.round(landCover)));
    return { score: clamped, label: `Land cover vulnerability index: ${clamped}/100` };
  }
  const norm = (landCover || '').toLowerCase();
  if (norm.includes('quarry') || norm.includes('scree') || norm.includes('unreinforced cut')) {
    return { score: 92, label: 'High Vulnerability: Disturbed road cut / Quarry scree' };
  }
  if (norm.includes('settlement') || norm.includes('dense urban') || norm.includes('residential')) {
    return { score: 70, label: 'Moderate-High Vulnerability: Stepped residential structures with drainage surcharge' };
  }
  if (norm.includes('sparse') || norm.includes('scrub')) {
    return { score: 55, label: 'Moderate Vulnerability: Degraded hillside scrub' };
  }
  if (norm.includes('dense forest') || norm.includes('bamboo') || norm.includes('retaining') || norm.includes('plateau')) {
    return { score: 20, label: 'Low Vulnerability: Vegetated canopy with root shear binding' };
  }
  return { score: 45, label: 'Standard Valley Hillside: Mixed colluvium and terrace cultivation' };
}

/**
 * Resolves baseline demonstration geographic data for a given location query.
 * Matches known Aizawl locations or demonstration risk points.
 */
export function resolveLocationData(
  query: string | GeographicRiskInput,
  overrides?: Partial<GeographicRiskInput>
): {
  locationDisplay: {
    id: string;
    targetLocationId?: string;
    name: string;
    ward?: string;
    coordinates?: { lat: number; lng: number };
  };
  rainfallMm: number;
  slopeDeg: number;
  elevationM: number;
  wetnessPercent: number;
  historicalActivity: string | number;
  landCover: string | number;
  matchedPoint?: DemonstrationRiskPoint;
  matchedLoc?: LocationRisk;
} | null {
  const queryStr = typeof query === 'string' ? query : query.name || query.locationId || '';
  const cleanKey = queryStr.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  if (!cleanKey) return null;

  // 1. Try matching against demonstration risk points first (used by Risk Map hotspots)
  const matchedPoint = DEMONSTRATION_RISK_POINTS.find((pt) => {
    const ptId = pt.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ptTarget = pt.targetLocationId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ptLoc = pt.location.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ptWard = pt.ward.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      ptId === cleanKey ||
      ptTarget === cleanKey ||
      ptLoc === cleanKey ||
      ptId.includes(cleanKey) ||
      cleanKey.includes(ptId) ||
      ptTarget.includes(cleanKey) ||
      cleanKey.includes(ptTarget) ||
      ptLoc.includes(cleanKey) ||
      cleanKey.includes(ptLoc) ||
      ptWard.includes(cleanKey)
    );
  });

  // 2. Try matching against catalog of known Aizawl demonstration locations
  const matchedLoc = AIZAWL_LOCATIONS.find((loc) => {
    const locId = loc.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const locName = loc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const locWard = loc.ward.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      locId === cleanKey ||
      locName === cleanKey ||
      locId.includes(cleanKey) ||
      cleanKey.includes(locId) ||
      locName.includes(cleanKey) ||
      cleanKey.includes(locName) ||
      locWard.includes(cleanKey)
    );
  });

  if (matchedPoint) {
    const refLoc =
      AIZAWL_LOCATIONS.find((l) => l.id === matchedPoint.targetLocationId) || AIZAWL_LOCATIONS[0];

    return {
      locationDisplay: {
        id: matchedPoint.id,
        targetLocationId: matchedPoint.targetLocationId,
        name: matchedPoint.location,
        ward: matchedPoint.ward,
        coordinates: { lat: matchedPoint.latitude, lng: matchedPoint.longitude },
      },
      rainfallMm: overrides?.rainfallMm ?? matchedPoint.rainfall24hMm ?? refLoc.hydrology.rainfall24hMm,
      slopeDeg: overrides?.slopeDeg ?? matchedPoint.slopeDeg ?? refLoc.slopeGradientDeg,
      elevationM: overrides?.elevationM ?? matchedPoint.elevationM ?? refLoc.elevationM,
      wetnessPercent: overrides?.wetnessPercent ?? matchedPoint.soilSaturation ?? refLoc.hydrology.soilMoisturePercent,
      historicalActivity: overrides?.historicalActivityLevel ?? (refLoc.historicalEvents[0] || 'Historical slope instability'),
      landCover: overrides?.landCoverType ?? 'Hillside slope & residential approach',
      matchedPoint,
      matchedLoc: refLoc,
    };
  }

  if (matchedLoc) {
    const histSummary =
      matchedLoc.historicalEvents.length > 0
        ? matchedLoc.historicalEvents[0]
        : matchedLoc.riskLevel === 'Critical'
        ? 'High (Historical tension cracks)'
        : 'Low';

    const landCoverSummary = matchedLoc.name.toLowerCase().includes('quarry')
      ? 'Quarry scree & open cut slopes'
      : matchedLoc.vulnerableAssets.length > 0
      ? 'Stepped hillside residential settlements'
      : 'Mixed hillside terrain';

    return {
      locationDisplay: {
        id: matchedLoc.id,
        targetLocationId: matchedLoc.id,
        name: matchedLoc.name,
        ward: matchedLoc.ward,
        coordinates: matchedLoc.coordinates,
      },
      rainfallMm: overrides?.rainfallMm ?? matchedLoc.hydrology.rainfall24hMm,
      slopeDeg: overrides?.slopeDeg ?? matchedLoc.slopeGradientDeg,
      elevationM: overrides?.elevationM ?? matchedLoc.elevationM,
      wetnessPercent: overrides?.wetnessPercent ?? matchedLoc.hydrology.soilMoisturePercent,
      historicalActivity: overrides?.historicalActivityLevel ?? histSummary,
      landCover: overrides?.landCoverType ?? landCoverSummary,
      matchedLoc,
    };
  }

  // Location not recognized
  return null;
}

/**
 * Calculates demonstration landslide risk for a specified geographic location.
 *
 * Core Output Schema:
 * {
 *   location,
 *   riskScore,
 *   riskLevel,
 *   demonstrationConfidence,
 *   modelConfidence,
 *   engine,
 *   factors,
 *   factorContributions,
 *   calculationMethod,
 *   formulaDescription,
 *   lastUpdated,
 *   isDemoData,
 *   disclaimer
 * }
 */
export function calculateDemonstrationRisk(
  query: string | GeographicRiskInput,
  overrides?: Partial<GeographicRiskInput>
): DemonstrationRiskAssessment | null {
  const resolved = resolveLocationData(query, overrides);
  if (!resolved) {
    return null;
  }

  const { matchedPoint, matchedLoc } = resolved;
  const hasManualOverrides = Boolean(
    overrides && Object.values(overrides).some((v) => v !== undefined)
  );

  // Determine normalized factor values:
  // If matched to a calibrated demonstration hotspot and no manual query overrides are supplied,
  // use the calibrated normalized scores for 100% deterministic reproducibility.
  let rainNorm: { score: number; value: number };
  let slopeNorm: { score: number; value: number };
  let wetnessNorm: { score: number; value: number };
  let elevationNorm: { score: number; value: number };
  let histNorm: { score: number; label: string };
  let landCoverNorm: { score: number; label: string };

  if (!hasManualOverrides && matchedPoint?.normalizedScores) {
    const ns = matchedPoint.normalizedScores;
    rainNorm = { score: ns.rainfall, value: resolved.rainfallMm };
    slopeNorm = { score: ns.slope, value: resolved.slopeDeg };
    wetnessNorm = { score: ns.wetness, value: resolved.wetnessPercent };
    elevationNorm = { score: ns.elevation, value: resolved.elevationM };
    histNorm = { score: ns.historicalActivity, label: String(resolved.historicalActivity) };
    landCoverNorm = { score: ns.landCover, label: String(resolved.landCover) };
  } else {
    rainNorm = normalizeRainfall(resolved.rainfallMm);
    slopeNorm = normalizeSlope(resolved.slopeDeg);
    wetnessNorm = normalizeWetness(resolved.wetnessPercent);
    elevationNorm = normalizeElevation(resolved.elevationM, resolved.slopeDeg);
    histNorm = normalizeHistoricalActivity(resolved.historicalActivity);
    landCoverNorm = normalizeLandCover(resolved.landCover);
  }

  // Calculate weighted factor contributions
  const rainContrib = Number((rainNorm.score * FACTOR_WEIGHTS.rainfall).toFixed(2));
  const slopeContrib = Number((slopeNorm.score * FACTOR_WEIGHTS.slope).toFixed(2));
  const wetnessContrib = Number((wetnessNorm.score * FACTOR_WEIGHTS.wetness).toFixed(2));
  const histContrib = Number((histNorm.score * FACTOR_WEIGHTS.historicalActivity).toFixed(2));
  const landCoverContrib = Number((landCoverNorm.score * FACTOR_WEIGHTS.landCover).toFixed(2));
  const elevationContrib = Number((elevationNorm.score * FACTOR_WEIGHTS.elevation).toFixed(2));

  // Compute total risk score (0–100) strictly from the weighted sum
  const rawTotalScore =
    rainContrib + slopeContrib + wetnessContrib + histContrib + landCoverContrib + elevationContrib;
  const riskScore = Math.max(0, Math.min(100, Math.round(rawTotalScore)));

  // Derive risk level strictly based on the calculated riskScore
  const riskLevel: Phase1RiskLevel = getPhase1RiskLevel(riskScore);

  // Demonstration confidence (0.0 - 1.0)
  const demonstrationConfidence =
    matchedPoint?.demonstrationConfidence ?? matchedPoint?.modelConfidence ?? 0.85;
  const modelConfidence = demonstrationConfidence; // backward compatibility

  // Last Updated: matches Risk Map hotspot or timestamp
  const lastUpdated = matchedPoint?.lastUpdated || '14:28 IST (DEMO DATA)';

  // Risk Factors (Main drivers): matches the Risk Map hotspot key drivers
  const riskFactors = matchedPoint?.mainRiskFactors || [
    `24h Cumulative Precipitation: ${resolved.rainfallMm} mm (Trigger excess)`,
    `Slope gradient: ${resolved.slopeDeg}° angle`,
    `Subsurface wetness & pore pressure: ${resolved.wetnessPercent}% saturation`,
    String(resolved.historicalActivity),
  ];

  // Build factor detail objects, clearly labeled as DEMO DATA
  const factors: DemonstrationRiskFactors = {
    rainfall: {
      name: 'Antecedent Rainfall (24h)',
      rawValue: rainNorm.value,
      unit: 'mm/24h',
      normalizedScore: rainNorm.score,
      weight: FACTOR_WEIGHTS.rainfall,
      weightedContribution: rainContrib,
      description: 'DEMO DATA: Estimated 24-hour antecedent rainfall intensity triggering pore-fluid surge',
      isDemoData: true,
    },
    slope: {
      name: 'Slope Gradient',
      rawValue: slopeNorm.value,
      unit: 'degrees',
      normalizedScore: slopeNorm.score,
      weight: FACTOR_WEIGHTS.slope,
      weightedContribution: slopeContrib,
      description: 'DEMO DATA: Slope gradient inclination angle and planar sliding geometry',
      isDemoData: true,
    },
    elevation: {
      name: 'Topographic Relief & Elevation',
      rawValue: elevationNorm.value,
      unit: 'meters',
      normalizedScore: elevationNorm.score,
      weight: FACTOR_WEIGHTS.elevation,
      weightedContribution: elevationContrib,
      description: 'DEMO DATA: Elevation profile reflecting gravitational head and drainage relief',
      isDemoData: true,
    },
    wetness: {
      name: 'Subsurface Wetness & Saturation',
      rawValue: wetnessNorm.value,
      unit: '% saturation',
      normalizedScore: wetnessNorm.score,
      weight: FACTOR_WEIGHTS.wetness,
      weightedContribution: wetnessContrib,
      description: 'DEMO DATA: Estimated soil moisture saturation index and pore-water pressure state',
      isDemoData: true,
    },
    historicalActivity: {
      name: 'Historical Slide Activity',
      rawValue: histNorm.label,
      normalizedScore: histNorm.score,
      weight: FACTOR_WEIGHTS.historicalActivity,
      weightedContribution: histContrib,
      description: 'DEMO DATA: Archive frequency of historical ground movement and tension crack re-emergence',
      isDemoData: true,
    },
    landCover: {
      name: 'Land Cover & Vegetation Cohesion',
      rawValue: landCoverNorm.label,
      normalizedScore: landCoverNorm.score,
      weight: FACTOR_WEIGHTS.landCover,
      weightedContribution: landCoverContrib,
      description: 'DEMO DATA: Surface root shear binding vs disturbed cut slopes and residential loading',
      isDemoData: true,
    },
  };

  // Build transparent factor contributions breakdown
  const factorContributions: FactorContributionsBreakdown = {
    rainfall: {
      name: 'Antecedent Rainfall (24h)',
      weight: FACTOR_WEIGHTS.rainfall,
      weightPercent: 25,
      rawValue: rainNorm.value,
      unit: 'mm/24h',
      normalizedScore: rainNorm.score,
      weightedContribution: rainContrib,
      interpretation: 'Higher rainfall -> higher demonstration risk (excess precipitation triggers pore-fluid saturation)',
    },
    slope: {
      name: 'Slope Gradient',
      weight: FACTOR_WEIGHTS.slope,
      weightPercent: 20,
      rawValue: slopeNorm.value,
      unit: 'degrees',
      normalizedScore: slopeNorm.score,
      weightedContribution: slopeContrib,
      interpretation: 'Higher slope -> higher demonstration risk (steeper inclination increases gravitational shear driving stress)',
    },
    wetness: {
      name: 'Subsurface Wetness & Saturation',
      weight: FACTOR_WEIGHTS.wetness,
      weightPercent: 20,
      rawValue: wetnessNorm.value,
      unit: '% saturation',
      normalizedScore: wetnessNorm.score,
      weightedContribution: wetnessContrib,
      interpretation: 'Higher wetness -> higher demonstration risk (elevated saturation reduces effective soil friction and cohesion)',
    },
    historicalActivity: {
      name: 'Historical Slide Activity',
      weight: FACTOR_WEIGHTS.historicalActivity,
      weightPercent: 15,
      rawValue: histNorm.label,
      normalizedScore: histNorm.score,
      weightedContribution: histContrib,
      interpretation: 'Higher historical activity -> higher demonstration risk (past failure scars indicate pre-existing shear weakness)',
    },
    landCover: {
      name: 'Land Cover & Vegetation Cohesion',
      weight: FACTOR_WEIGHTS.landCover,
      weightPercent: 10,
      rawValue: landCoverNorm.label,
      normalizedScore: landCoverNorm.score,
      weightedContribution: landCoverContrib,
      interpretation: 'More destabilizing land-cover condition -> higher demonstration risk (disturbed road cuts lack root shear binding)',
    },
    elevation: {
      name: 'Topographic Relief & Elevation',
      weight: FACTOR_WEIGHTS.elevation,
      weightPercent: 10,
      rawValue: elevationNorm.value,
      unit: 'meters',
      normalizedScore: elevationNorm.score,
      weightedContribution: elevationContrib,
      interpretation: 'Topographic relief & drainage head (does not imply high elevation alone causes risk; high plateaus remain low risk due to gentle slope)',
    },
  };

  return {
    location: resolved.locationDisplay,
    riskScore,
    riskLevel,
    demonstrationConfidence,
    modelConfidence,
    engine: 'Phase 1 Demonstration Risk Engine',
    factors,
    factorContributions,
    calculationMethod: CALCULATION_METHOD_DESCRIPTION,
    riskFactors,
    mainRiskFactors: riskFactors,
    factorOfSafety: matchedPoint?.factorOfSafety ?? matchedLoc?.factorOfSafety,
    estimatedRisk: matchedPoint?.estimatedRisk,
    lastUpdated,
    isDemoData: true,
    formulaDescription: TRANSPARENT_FORMULA_EXPLANATION,
    disclaimer: DEMO_DATA_DISCLAIMER,
  };
}
