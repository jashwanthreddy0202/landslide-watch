import { LocationRisk, RiskLevel } from '../../src/types';

/**
 * Geotechnical Physical Slope Stability Calculation (Infinite Slope Model)
 *
 * Parameters:
 * - c: effective cohesion (kPa)
 * - phi: effective internal friction angle (degrees)
 * - beta: slope inclination angle (degrees)
 * - gamma: bulk unit weight of soil (kN/m³) ~ 18.5 kN/m³ in Aizawl shale/colluvium
 * - z: depth of failure plane (m)
 * - u: pore water pressure (kPa)
 */
export function calculateFactorOfSafety(
  slopeGradientDeg: number,
  soilDepthM: number,
  porePressureKPa: number,
  cohesionKPa: number = 24.0,
  frictionAngleDeg: number = 22.0
): number {
  const gamma = 18.5; // Soil unit weight kN/m³
  const betaRad = (slopeGradientDeg * Math.PI) / 180;
  const phiRad = (frictionAngleDeg * Math.PI) / 180;

  const cosBeta = Math.cos(betaRad);
  const sinBeta = Math.sin(betaRad);
  const tanPhi = Math.tan(phiRad);

  const totalNormalStress = gamma * soilDepthM * cosBeta * cosBeta;
  const effectiveNormalStress = Math.max(0.1, totalNormalStress - porePressureKPa);

  const shearStrength = cohesionKPa + effectiveNormalStress * tanPhi;
  const drivingShearStress = Math.max(1.0, gamma * soilDepthM * sinBeta * cosBeta);

  const fos = shearStrength / drivingShearStress;
  return Number(Math.max(0.4, Math.min(3.0, fos)).toFixed(2));
}

/**
 * Computes failure probability and risk categorization from Factor of Safety (FoS)
 */
export function deriveRiskLevelFromFoS(fos: number): {
  level: RiskLevel;
  probability: number;
  score: number;
} {
  if (fos < 1.0) {
    // Critical / Imminent Failure
    const prob = Number((90 + (1.0 - fos) * 15).toFixed(1));
    const cappedProb = Math.min(99.4, prob);
    return {
      level: 'Critical',
      probability: cappedProb,
      score: cappedProb
    };
  } else if (fos < 1.20) {
    // Severe / Unstable under sustained rain
    const prob = Number((70 + (1.20 - fos) * 100).toFixed(1));
    return {
      level: 'Severe',
      probability: prob,
      score: prob
    };
  } else if (fos < 1.50) {
    // Watch / Marginally stable
    const prob = Number((40 + (1.50 - fos) * 90).toFixed(1));
    return {
      level: 'Watch',
      probability: prob,
      score: prob
    };
  } else {
    // Low / Safe
    const prob = Number(Math.max(10, (2.0 - fos) * 25).toFixed(1));
    return {
      level: 'Low',
      probability: prob,
      score: prob
    };
  }
}

/**
 * Applies environmental simulation modifiers to a location
 */
export function recalculateLocationRisk(
  location: LocationRisk,
  rainMultiplier: number = 1.0,
  porePressureOffsetKPa: number = 0,
  saturationOffsetPercent: number = 0
): LocationRisk {
  const adjustedRain24 = Number((location.hydrology.rainfall24hMm * rainMultiplier).toFixed(1));
  const adjustedRain72 = Number((location.hydrology.rainfall72hMm * rainMultiplier).toFixed(1));
  const adjustedPorePressure = Math.max(
    15,
    Number((location.hydrology.porePressureKPa + porePressureOffsetKPa).toFixed(1))
  );
  const adjustedSaturation = Math.min(
    99,
    Math.max(45, Number((location.hydrology.soilMoisturePercent + saturationOffsetPercent).toFixed(1)))
  );

  const newFos = calculateFactorOfSafety(
    location.slopeGradientDeg,
    location.geology.soilDepthM,
    adjustedPorePressure,
    location.geology.shearStrengthKPa,
    location.geology.frictionAngleDeg
  );

  const { level, probability, score } = deriveRiskLevelFromFoS(newFos);

  // Pore pressure status label
  let porePressureStatus: 'Normal' | 'Elevated' | 'Critical Saturated' = 'Normal';
  if (adjustedPorePressure >= 70) {
    porePressureStatus = 'Critical Saturated';
  } else if (adjustedPorePressure >= 50) {
    porePressureStatus = 'Elevated';
  }

  return {
    ...location,
    hydrology: {
      ...location.hydrology,
      rainfall24hMm: adjustedRain24,
      rainfall72hMm: adjustedRain72,
      porePressureKPa: adjustedPorePressure,
      porePressureStatus,
      soilMoisturePercent: adjustedSaturation,
      piezometerShiftMmHr: Number(
        Math.max(0.5, (location.hydrology.piezometerShiftMmHr * (adjustedPorePressure / location.hydrology.porePressureKPa))).toFixed(1)
      )
    },
    factorOfSafety: newFos,
    riskScore: score,
    riskLevel: level,
    failureProbability: probability,
    lastRecalculated: 'Just now (Simulated)'
  };
}
