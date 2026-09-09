import { GoogleGenAI } from '@google/genai';
import type { ExplainRiskRequestBody, ExplainRiskResponse } from '../../src/types';
import { resolveLocationData } from './riskEngine';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function callWithTimeout<T>(promise: Promise<T>, ms: number = 12000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini API call timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates the request body for POST /api/ai/explain-risk.
 * Rejects incomplete or malformed requests cleanly.
 * Rejects unknown locations to prevent hallucination of unmonitored areas.
 */
export function validateExplainRiskRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  const req = body as Record<string, unknown>;

  // 1. Validate location
  if (typeof req.location !== 'string' || !req.location.trim()) {
    return { valid: false, error: 'Field "location" is required and must be a non-empty string' };
  }

  const resolved = resolveLocationData(req.location);
  if (!resolved) {
    return {
      valid: false,
      error: `Unknown location "${req.location}". AI risk explanations are strictly restricted to verified Landslide Watch monitored corridors.`,
    };
  }

  // 2. Validate riskScore
  if (typeof req.riskScore !== 'number' || isNaN(req.riskScore) || req.riskScore < 0 || req.riskScore > 100) {
    return { valid: false, error: 'Field "riskScore" must be a number between 0 and 100' };
  }

  // 3. Validate riskLevel
  if (typeof req.riskLevel !== 'string' || !req.riskLevel.trim()) {
    return { valid: false, error: 'Field "riskLevel" is required and must be a non-empty string' };
  }

  // 4. Validate confidence (demonstrationConfidence or modelConfidence)
  const confidence = req.demonstrationConfidence ?? req.modelConfidence;
  if (
    confidence !== undefined &&
    (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 1)
  ) {
    return { valid: false, error: 'Field "demonstrationConfidence" (or "modelConfidence") must be a number between 0.0 and 1.0' };
  }

  // 5. Validate factors
  if (!req.factors || typeof req.factors !== 'object') {
    return { valid: false, error: 'Field "factors" is required and must be an object' };
  }

  const factors = req.factors as Record<string, unknown>;
  const requiredFactorKeys = ['rainfall', 'slope', 'wetness', 'historicalActivity', 'landCover', 'elevation'];

  for (const key of requiredFactorKeys) {
    if (typeof factors[key] !== 'number' || isNaN(factors[key] as number) || (factors[key] as number) < 0) {
      return { valid: false, error: `Factor "${key}" must be a valid non-negative number` };
    }
  }

  // 6. Validate isDemoData
  if (typeof req.isDemoData !== 'boolean') {
    return { valid: false, error: 'Field "isDemoData" is required and must be a boolean' };
  }

  return { valid: true };
}

/**
 * Deterministic rule-based fallback explainer.
 * Synthesizes an explainable risk summary strictly from existing structured risk factors.
 * - Never invents environmental observations.
 * - Never claims to come from Gemini.
 * - Explicitly labeled as "RULE-BASED DEMONSTRATION EXPLANATION".
 */
export function generateDeterministicRuleBasedExplanation(
  data: ExplainRiskRequestBody,
  fallbackReason: string = 'AI explanation temporarily unavailable. Risk assessment remains available.'
): ExplainRiskResponse {
  const conf = data.demonstrationConfidence ?? data.modelConfidence ?? 0.85;
  const factors = data.factors;

  // Evaluate factors deterministically according to their normalized score and audited weights:
  // Rainfall: 25%, Slope: 20%, Wetness: 20%, Historical: 15%, Land Cover: 10%, Elevation: 10%
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
        'Continuous rainfall infiltration elevates pore-water pressure, reducing the effective normal stress and shear resistance along potential slip planes.',
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

  // Sort factors deterministically by weighted contribution, then normalized score
  const sortedFactors = [...factorDescriptors].sort((a, b) => {
    if (b.weightedScore !== a.weightedScore) {
      return b.weightedScore - a.weightedScore;
    }
    return b.normalizedScore - a.normalizedScore;
  });

  // Select top 2-3 primary factors
  const topFactors = sortedFactors.slice(0, 3);
  const topFactorNames = topFactors.map((f) => f.name).join(', ');

  // Deterministic summary based strictly on the provided score, level, and primary factors
  let summary = '';
  if (data.riskLevel === 'VERY HIGH') {
    summary = `This demonstration assessment indicates a VERY HIGH landslide risk level (audited score: ${data.riskScore}/100) for ${data.location} based on the supplied simulated factors. Primary contributing influences are ${topFactorNames}, indicating acute susceptibility to slope instability under simulated conditions.`;
  } else if (data.riskLevel === 'HIGH') {
    summary = `This demonstration assessment indicates a HIGH landslide risk level (audited score: ${data.riskScore}/100) for ${data.location} based on the supplied simulated factors. Primary driving influences are ${topFactorNames}, producing elevated vulnerability across hillside colluvium under simulated conditions.`;
  } else if (data.riskLevel === 'MODERATE') {
    summary = `This demonstration assessment indicates a MODERATE landslide risk level (audited score: ${data.riskScore}/100) for ${data.location} based on the supplied simulated factors. Stability is sensitive to ${topFactorNames}, warranting routine drainage observation.`;
  } else {
    summary = `This demonstration assessment indicates a LOW landslide risk level (audited score: ${data.riskScore}/100) for ${data.location} based on the supplied simulated factors. All monitored environmental indicators remain within nominal baseline thresholds.`;
  }

  const mainFactors = topFactors.map((f) => f.bulletText);
  const whyTheyMatter = topFactors.map((f) => f.physicalPrinciple);

  let generalPublicGuidance = '';
  if (data.riskLevel === 'VERY HIGH' || data.riskLevel === 'HIGH') {
    generalPublicGuidance =
      'Residents in steep hillside sectors should remain observant of local disaster management advisories, inspect drainage flumes, and report visible ground tension cracks.';
  } else if (data.riskLevel === 'MODERATE') {
    generalPublicGuidance =
      'Maintain standard slope observation and check municipal disaster management updates during heavy or prolonged rainfall periods.';
  } else {
    generalPublicGuidance =
      'Continue routine environmental monitoring and ensure roadside storm drains and roof downspouts remain unobstructed.';
  }

  return {
    location: data.location,
    riskScore: data.riskScore,
    riskLevel: data.riskLevel,
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
 * Invokes Gemini to produce an explainable risk summary based ONLY on structured risk data.
 * Adheres strictly to safety, accuracy, and demonstration data constraints.
 * Implements full fault tolerance: if Gemini reaches rate limits (429), times out, returns an error,
 * or is temporarily unavailable, returns a deterministic rule-based demonstration explanation.
 */
export async function generateExplainableRiskSummary(
  data: ExplainRiskRequestBody,
  simulateFailure: boolean = false
): Promise<ExplainRiskResponse> {
  const fallbackMessage = 'AI explanation temporarily unavailable. Risk assessment remains available.';

  // Test hook for simulating service unavailability (Test Case: Gemini unavailable/rate-limited)
  if (simulateFailure || data.simulateFailure) {
    console.warn('[AI Risk Explainer] Simulated Gemini outage triggered; deploying rule-based demonstration fallback.');
    return generateDeterministicRuleBasedExplanation(data, fallbackMessage);
  }

  const ai = getGenAI();
  if (!ai) {
    console.warn('[AI Risk Explainer] Gemini API key not configured; deploying rule-based demonstration fallback.');
    return generateDeterministicRuleBasedExplanation(data, fallbackMessage);
  }

  const conf = data.demonstrationConfidence ?? data.modelConfidence ?? 0.85;

  const prompt = `
You are the AI Risk Explainer for Landslide Watch, an educational and demonstration early warning tool for Aizawl, Mizoram.
Explain the following structured risk information produced by our backend to a normal resident in concise, accessible terms.

STRUCTURED RISK DATA SUPPLIED BY BACKEND:
- Monitored Location: ${data.location}
- Demonstration Risk Score: ${data.riskScore} / 100
- Demonstration Risk Level: ${data.riskLevel}
- Demonstration Confidence: ${(conf * 100).toFixed(0)}%
- Demonstration Factor Intensities (0-100 normalized scale):
  * Antecedent rainfall trigger: ${data.factors.rainfall} / 100
  * Hillside slope gradient: ${data.factors.slope} / 100
  * Subsurface wetness & saturation: ${data.factors.wetness} / 100
  * Historical landslide activity: ${data.factors.historicalActivity} / 100
  * Land cover & vegetation cohesion: ${data.factors.landCover} / 100
  * Terrain elevation profile: ${data.factors.elevation} / 100
- Demonstration Mode: ${data.isDemoData ? 'true (SIMULATED DATA)' : 'false (Operational)'}

CRITICAL SAFETY & ACCURACY RULES:
1. The supplied values are demonstration/simulated data. Because isDemoData is true, you MUST describe the result as a demonstration estimate. Use phrasing such as: "This demonstration assessment indicates elevated landslide risk based on the supplied simulated factors."
2. DO NOT present simulated values as real measurements.
3. DO NOT invent rainfall measurements, sensor readings, satellite observations, geological measurements, or locations.
4. DO NOT claim that a landslide has occurred or that a landslide will definitely occur.
5. DO NOT create an official government warning or override government authorities.
6. DO NOT change or contradict the supplied risk score (${data.riskScore}) or risk level (${data.riskLevel}).
7. DO NOT create unsupported numerical predictions.
8. Use ONLY the structured data provided above.
9. Keep the tone calm, objective, educational, and easy for a non-technical resident to understand.

Respond with strict JSON matching this exact schema:
{
  "summary": "2-3 concise sentences providing the Risk Summary. Explicitly describe the result as a demonstration estimate based on the simulated factors.",
  "mainFactors": [
    "2 to 3 concise bullet points identifying the primary contributing factors from the supplied data"
  ],
  "whyTheyMatter": [
    "2 to 3 concise bullet points explaining why those specific physical factors (e.g. steep slope angle, high ground wetness, heavy rainfall) heighten landslide susceptibility in this demonstration"
  ],
  "generalPublicGuidance": "1-2 concise sentences of general public awareness guidance, advising residents to stay alert to local government notices and warning signs."
}
`;

  // Candidate models: prefer 'gemini-3.5-flash-lite' and 'gemini-3.6-flash'
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  let lastError: Error | null = null;

  for (const modelName of candidateModels) {
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        12000
      );

      const rawText = response.text;
      if (rawText) {
        const cleaned = sanitizeJsonString(rawText);
        const parsed = JSON.parse(cleaned);

        const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
          ? parsed.summary.trim()
          : `This demonstration assessment indicates ${data.riskLevel.toLowerCase()} landslide risk (score ${data.riskScore}/100) based on the supplied simulated factors for ${data.location}.`;

        const mainFactors = Array.isArray(parsed.mainFactors) && parsed.mainFactors.length > 0
          ? parsed.mainFactors.map(String)
          : [
              `Simulated rainfall trigger index (${data.factors.rainfall}/100)`,
              `Hillside slope steepness (${data.factors.slope}/100)`,
              `Ground wetness saturation (${data.factors.wetness}/100)`,
            ];

        const whyTheyMatter = Array.isArray(parsed.whyTheyMatter) && parsed.whyTheyMatter.length > 0
          ? parsed.whyTheyMatter.map(String)
          : [
              'Intense rainfall infiltrates hillside soil, increasing pore pressure and reducing friction along bedding planes.',
              'Steep slope inclinations amplify the downward gravitational pull acting on saturated overburden.',
              'Saturated soil loses shear strength, making slopes more vulnerable to shallow translational slides.',
            ];

        const generalPublicGuidance = typeof parsed.generalPublicGuidance === 'string' && parsed.generalPublicGuidance.trim()
          ? parsed.generalPublicGuidance.trim()
          : 'Residents in steep hillside zones should monitor local disaster management bulletins and report new surface fissures.';

        return {
          location: data.location,
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          modelConfidence: conf,
          demonstrationConfidence: conf,
          summary,
          mainFactors,
          whyTheyMatter,
          generalPublicGuidance,
          isDemoData: true,
          generatedByGemini: true,
          modelUsed: modelName,
          generatedAt: new Date().toISOString(),
          fallbackUsed: false,
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Risk Explainer] ${modelName} call failed (${errMsg.slice(0, 80)}). Trying candidate model or fallback...`);
      lastError = err instanceof Error ? err : new Error(errMsg);
    }
  }

  // Graceful deterministic fallback when Gemini API encounters rate limit (429), timeout, error, or unavailability
  console.warn(
    `[AI Risk Explainer] All candidate Gemini models unavailable (${lastError?.message?.slice(0, 80)}). Activating deterministic rule-based demonstration fallback.`
  );
  return generateDeterministicRuleBasedExplanation(data, fallbackMessage);
}
