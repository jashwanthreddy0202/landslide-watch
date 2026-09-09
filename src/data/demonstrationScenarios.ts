import { DemonstrationScenario, DemonstrationAlertState, Phase1RiskLevel } from '../types';

export const DEMO_SCENARIO_EXPLANATION =
  'This scenario demonstrates how changing environmental factors can affect the calculated risk. It does not represent real-time measurements.';

export const DEMONSTRATION_SCENARIOS: DemonstrationScenario[] = [
  {
    id: 'normal',
    name: 'Normal Conditions',
    badge: 'Low Trigger Baseline',
    conditionSummary: 'Low rainfall (15 mm), moderate wetness (25%), moderate slope (18°), low historical activity',
    factors: {
      rainfallMm: 15,
      wetnessPercent: 25,
      slopeDeg: 18,
      historicalActivityLevel: 'Low',
      elevationM: 850,
      landCoverType: 'Vegetated slope & standard terrace',
    },
    expectedResult: 'Generally LOW or MODERATE',
    expectedRiskLevel: 'LOW',
    explanation: DEMO_SCENARIO_EXPLANATION,
    isDemoData: true,
  },
  {
    id: 'increasing-rainfall',
    name: 'Increasing Rainfall',
    badge: 'Precipitation Surge',
    conditionSummary: 'Increased rainfall (55 mm), increased wetness (50%), moderate slope (24°), moderate historical activity',
    factors: {
      rainfallMm: 55,
      wetnessPercent: 50,
      slopeDeg: 24,
      historicalActivityLevel: 'Moderate',
      elevationM: 950,
      landCoverType: 'Standard Valley Hillside',
    },
    expectedResult: 'Risk increases compared with Normal Conditions (MODERATE)',
    expectedRiskLevel: 'MODERATE',
    explanation: DEMO_SCENARIO_EXPLANATION,
    isDemoData: true,
  },
  {
    id: 'heavy-rainfall',
    name: 'Heavy Rainfall',
    badge: 'Intense Downpour',
    conditionSummary: 'High rainfall (100 mm), high wetness (75%), moderate/high slope (35°), some historical activity',
    factors: {
      rainfallMm: 100,
      wetnessPercent: 75,
      slopeDeg: 35,
      historicalActivityLevel: 'High',
      elevationM: 1050,
      landCoverType: 'Stepped residential structures with drainage surcharge',
    },
    expectedResult: 'Generally HIGH risk',
    expectedRiskLevel: 'HIGH',
    explanation: DEMO_SCENARIO_EXPLANATION,
    isDemoData: true,
  },
  {
    id: 'extreme-risk',
    name: 'Extreme Risk Conditions',
    badge: 'Severe Monsoonal Crisis',
    conditionSummary: 'Very high rainfall (145 mm), very high wetness (95%), steep slope (48°), high historical activity',
    factors: {
      rainfallMm: 145,
      wetnessPercent: 95,
      slopeDeg: 48,
      historicalActivityLevel: 'Critical',
      elevationM: 1200,
      landCoverType: 'Disturbed road cut / Quarry scree',
    },
    expectedResult: 'Generally VERY HIGH risk',
    expectedRiskLevel: 'VERY HIGH',
    explanation: DEMO_SCENARIO_EXPLANATION,
    isDemoData: true,
  },
];

/**
 * Computes demonstration alert state according to the calculated risk score
 * strictly using the audited thresholds:
 * 0–25   = LOW
 * 26–50  = MODERATE
 * 51–75  = HIGH
 * 76–100 = VERY HIGH
 */
export function deriveDemonstrationAlertState(
  riskScore: number,
  riskLevel: Phase1RiskLevel
): DemonstrationAlertState {
  if (riskScore >= 76 || riskLevel === 'VERY HIGH') {
    return {
      status: 'EMERGENCY_BULLETIN',
      alertLevel: 'VERY HIGH',
      thresholdCrossed: true,
      thresholdDescription: 'CRITICAL EMERGENCY THRESHOLD CROSSED (>75). Severe imminent slope failure hazard.',
      recommendedAction: 'Trigger immediate evacuation protocol. Seal vulnerable arterial roads and clear toe zones.',
      isDemoData: true,
    };
  }

  if (riskScore >= 51 || riskLevel === 'HIGH') {
    return {
      status: 'WARNING_ADVISORY',
      alertLevel: 'HIGH',
      thresholdCrossed: true,
      thresholdDescription: 'WARNING THRESHOLD CROSSED (>50). Elevated hydrostatic pore-fluid pressure.',
      recommendedAction: 'Precautionary evacuation readiness recommended. Restrict heavy transit across cut slopes.',
      isDemoData: true,
    };
  }

  if (riskScore >= 26 || riskLevel === 'MODERATE') {
    return {
      status: 'SEASONAL_WATCH',
      alertLevel: 'MODERATE',
      thresholdCrossed: false,
      thresholdDescription: 'Seasonal Watch threshold reached (26–50). Antecedent moisture rising.',
      recommendedAction: 'Maintain visual observation of drainage weep holes, retaining masonry, and slope toe scours.',
      isDemoData: true,
    };
  }

  return {
    status: 'ROUTINE_OBSERVATION',
    alertLevel: 'LOW',
    thresholdCrossed: false,
    thresholdDescription: 'Below warning threshold (0–25). Normal baseline observation.',
    recommendedAction: 'Standard routine surveillance and slope monitoring. No evacuation needed.',
    isDemoData: true,
  };
}
