import { AIExplanationResult, ExplainRiskRequestBody, ExplainRiskResponse } from '../types';
import { AIZAWL_LOCATIONS } from '../data/mockData';

function generateClientSafeExplanation(locationId: string): AIExplanationResult {
  const loc = AIZAWL_LOCATIONS.find((l) => l.id === locationId) || AIZAWL_LOCATIONS[0];
  const isCritical = loc.factorOfSafety < 1.0;
  return {
    locationId: loc.id,
    locationName: loc.name,
    riskLevel: loc.riskLevel,
    factorOfSafety: loc.factorOfSafety,
    summary: isCritical
      ? `Imminent failure state identified at ${loc.name}. Factor of Safety of ${loc.factorOfSafety} indicates that shear driving stresses exceed resisting forces along the weathered shale bedding plane.`
      : `Precautionary geotechnical monitoring active at ${loc.name}. Current factor of safety is ${loc.factorOfSafety}, with pore-water pressure at ${loc.hydrology.porePressureKPa} kPa.`,
    geotechnicalFactors: [
      `Elevated pore pressure (${loc.hydrology.porePressureKPa} kPa) degrades effective normal stress.`,
      `Slope gradient (${loc.slopeGradientDeg}°) combined with ${loc.geology.dipAngle} formation dip increases sliding vulnerability.`,
      `Accumulated precipitation of ${loc.hydrology.rainfall24hMm} mm continues to saturate soil overburden.`
    ],
    immediateActions: [
      `Maintain emergency readiness for downslope residents towards ${loc.evacuation.name}.`,
      `Inspect retaining wall weep holes and culvert flumes for structural clearance.`,
      `Contact Mizoram State Disaster Helpline (1070) for emergency reports.`
    ],
    mizoSafetyAdvice: `Fimkhur ula, leimin hlauhawm a nih avangin ${loc.evacuation.name}-ah insawn vat a him ber.`,
    generatedByGemini: false,
    modelUsed: 'calibrated-geotechnical-synthesis',
    generatedAt: new Date().toISOString(),
  };
}

export async function requestAIGeotechnicalExplanation(locationId: string): Promise<AIExplanationResult> {
  try {
    const res = await fetch('/api/gemini/explain-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    });
    if (!res.ok) throw new Error('Failed to generate explanation');
    return await res.json();
  } catch (err) {
    console.warn('Backend explanation API unavailable; using calibrated geotechnical synthesis:', err);
    return generateClientSafeExplanation(locationId);
  }
}

/**
 * Deterministic rule-based demonstration explanation generator.
 * Synthesizes an explainable summary strictly from structured risk factors.
 * - Never invents environmental observations.
 * - Never claims to come from Gemini.
 * - Explicitly labeled as "RULE-BASED DEMONSTRATION EXPLANATION".
 */
export function generateClientRuleBasedExplanation(
  payload: ExplainRiskRequestBody,
  fallbackReason: string = 'AI explanation temporarily unavailable. Risk assessment remains available.'
): ExplainRiskResponse {
  const conf = payload.demonstrationConfidence ?? payload.modelConfidence ?? 0.85;
  const factors = payload.factors;

  interface FactorDescriptor {
    id: keyof typeof factors;
    name: string;
    normalizedScore: number;
    weight: number;
    weightedScore: number;
    bulletText: string;
    physicalPrinciple: string;
  }

  const factorDescriptors: FactorDescriptor[] = [
    {
      id: 'rainfall',
      name: '24-hour antecedent rainfall',
      normalizedScore: factors.rainfall,
      weight: 0.25,
      weightedScore: factors.rainfall * 0.25,
      bulletText: `Simulated 24-hour rainfall trigger index (${factors.rainfall}/100)`,
      physicalPrinciple:
        'Continuous rainfall infiltration elevates pore-water pressure, reducing effective normal stress and shear resistance along potential slip planes.',
    },
    {
      id: 'slope',
      name: 'hillside slope steepness',
      normalizedScore: factors.slope,
      weight: 0.20,
      weightedScore: factors.slope * 0.20,
      bulletText: `Terrain slope gradient index (${factors.slope}/100)`,
      physicalPrinciple:
        'Steep hillside inclinations amplify gravitational shear stress acting on unconsolidated colluvial overburden.',
    },
    {
      id: 'wetness',
      name: 'subsurface soil moisture saturation',
      normalizedScore: factors.wetness,
      weight: 0.20,
      weightedScore: factors.wetness * 0.20,
      bulletText: `Subsurface soil wetness saturation index (${factors.wetness}/100)`,
      physicalPrinciple:
        'Elevated soil moisture saturation degrades intergranular cohesion and increases overburden weight, accelerating downslope creep.',
    },
    {
      id: 'historicalActivity',
      name: 'historical landslide activity',
      normalizedScore: factors.historicalActivity,
      weight: 0.15,
      weightedScore: factors.historicalActivity * 0.15,
      bulletText: `Historical landslide susceptibility rating (${factors.historicalActivity}/100)`,
      physicalPrinciple:
        'Locations with documented historical instability possess pre-sheared rupture planes with lower residual shear strength.',
    },
    {
      id: 'landCover',
      name: 'surface vegetation and ground cover',
      normalizedScore: factors.landCover,
      weight: 0.10,
      weightedScore: factors.landCover * 0.10,
      bulletText: `Land cover vulnerability index (${factors.landCover}/100)`,
      physicalPrinciple:
        'Sparse vegetative cover and exposed soil allow rapid runoff infiltration and lack mechanical root-cohesion reinforcement.',
    },
    {
      id: 'elevation',
      name: 'topographic elevation profile',
      normalizedScore: factors.elevation,
      weight: 0.10,
      weightedScore: factors.elevation * 0.10,
      bulletText: `Topographic elevation and relief index (${factors.elevation}/100)`,
      physicalPrinciple:
        'Steep elevation drops concentrate hydraulic gradients and provide prolonged downslope runout trajectories.',
    },
  ];

  const sortedFactors = [...factorDescriptors].sort((a, b) => {
    if (b.weightedScore !== a.weightedScore) {
      return b.weightedScore - a.weightedScore;
    }
    return b.normalizedScore - a.normalizedScore;
  });

  const topFactors = sortedFactors.slice(0, 3);
  const topFactorNames = topFactors.map((f) => f.name).join(', ');

  let summary = '';
  if (payload.riskLevel === 'VERY HIGH') {
    summary = `This demonstration assessment indicates a VERY HIGH landslide risk level (audited score: ${payload.riskScore}/100) for ${payload.location} based on the supplied simulated factors. Primary contributing influences are ${topFactorNames}, indicating acute susceptibility to slope instability under simulated conditions.`;
  } else if (payload.riskLevel === 'HIGH') {
    summary = `This demonstration assessment indicates a HIGH landslide risk level (audited score: ${payload.riskScore}/100) for ${payload.location} based on the supplied simulated factors. Primary driving influences are ${topFactorNames}, producing elevated vulnerability across hillside colluvium under simulated conditions.`;
  } else if (payload.riskLevel === 'MODERATE') {
    summary = `This demonstration assessment indicates a MODERATE landslide risk level (audited score: ${payload.riskScore}/100) for ${payload.location} based on the supplied simulated factors. Stability is sensitive to ${topFactorNames}, warranting routine drainage observation.`;
  } else {
    summary = `This demonstration assessment indicates a LOW landslide risk level (audited score: ${payload.riskScore}/100) for ${payload.location} based on the supplied simulated factors. All monitored environmental indicators remain within nominal baseline thresholds.`;
  }

  const mainFactors = topFactors.map((f) => f.bulletText);
  const whyTheyMatter = topFactors.map((f) => f.physicalPrinciple);

  let generalPublicGuidance = '';
  if (payload.riskLevel === 'VERY HIGH' || payload.riskLevel === 'HIGH') {
    generalPublicGuidance =
      'Residents in steep hillside sectors should remain observant of local disaster management advisories, inspect drainage flumes, and report visible ground tension cracks.';
  } else if (payload.riskLevel === 'MODERATE') {
    generalPublicGuidance =
      'Maintain standard slope observation and check municipal disaster management updates during heavy or prolonged rainfall periods.';
  } else {
    generalPublicGuidance =
      'Continue routine environmental monitoring and ensure roadside storm drains and roof downspouts remain unobstructed.';
  }

  return {
    location: payload.location,
    riskScore: payload.riskScore,
    riskLevel: payload.riskLevel,
    modelConfidence: conf,
    demonstrationConfidence: conf,
    summary,
    mainFactors,
    whyTheyMatter,
    generalPublicGuidance,
    isDemoData: true,
    generatedByGemini: false,
    fallbackUsed: true,
    fallbackReason,
    modelUsed: 'RULE-BASED DEMONSTRATION EXPLANATION',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Step 10 & 15: Requests an explainable risk summary from POST /api/ai/explain-risk.
 * Strictly sends only structured risk data to backend.
 * Handles failure gracefully without crashing the parent risk page.
 * If Gemini is unavailable, rate-limited (429), times out, or errors,
 * provides a deterministic rule-based demonstration explanation without inventing observations.
 */
export async function explainRiskWithGemini(
  payload: ExplainRiskRequestBody,
  simulateFailure: boolean = false
): Promise<ExplainRiskResponse> {
  const url = simulateFailure
    ? '/api/ai/explain-risk?simulateFailure=true'
    : '/api/ai/explain-risk';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[AI Risk Explainer] Server returned HTTP ${res.status}; activating rule-based fallback.`);
      try {
        const errData = await res.json();
        if (errData.summary && errData.mainFactors) {
          return errData as ExplainRiskResponse;
        }
      } catch {
        // ignore parse error
      }
      return generateClientRuleBasedExplanation(
        payload,
        'AI explanation temporarily unavailable. Risk assessment remains available.'
      );
    }

    const data: ExplainRiskResponse = await res.json();
    return data;
  } catch (networkError) {
    console.warn('[AI Risk Explainer] Network or service error; activating client-side rule-based fallback:', networkError);
    return generateClientRuleBasedExplanation(
      payload,
      'AI explanation temporarily unavailable. Risk assessment remains available.'
    );
  }
}

