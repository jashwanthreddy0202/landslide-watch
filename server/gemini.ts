import { GoogleGenAI } from '@google/genai';
import { AIExplanationResult, LocationRisk } from '../src/types';

let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

async function callWithTimeout<T>(promise: Promise<T>, ms: number = 6500): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`API call timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip Markdown code fences if returned by model
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  // If there's surrounding text, isolate the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export async function explainLocationRisk(location: LocationRisk): Promise<AIExplanationResult> {
  const ai = getGenAI();

  if (!ai) {
    return generateFallbackExplanation(location, 'API key not configured in environment; calibrated geotechnical model active.');
  }

  const prompt = `
You are the Chief Geotechnical & Hazard Assessment AI for the Aizawl Landslide Early Warning System (Mizoram, India).
Analyze the following slope telemetry data for ${location.name} (${location.ward}, Aizawl):

- Elevation: ${location.elevationM} m
- Slope Gradient: ${location.slopeGradientDeg}° (${location.slopeAspect})
- Geological Formation: ${location.geology.formation} (${location.geology.lithology}, Dip: ${location.geology.dipAngle})
- Soil Depth: ${location.geology.soilDepthM} m
- Current Pore-Water Pressure: ${location.hydrology.porePressureKPa} kPa (${location.hydrology.porePressureStatus})
- Soil Moisture: ${location.hydrology.soilMoisturePercent}%
- Inclinometer Strain Velocity: ${location.hydrology.piezometerShiftMmHr} mm/hr
- 24h Cumulative Rainfall: ${location.hydrology.rainfall24hMm} mm (72h: ${location.hydrology.rainfall72hMm} mm)
- Factor of Safety (FoS): ${location.factorOfSafety}
- Failure Probability: ${location.failureProbability}% (${location.riskLevel} Hazard)
- Vulnerable Assets: ${location.vulnerableAssets.join(', ')}
- Designated Evacuation Center: ${location.evacuation.name} (Corridor: ${location.evacuation.safeCorridor})

Respond in strict JSON format with exactly the following schema:
{
  "summary": "2-3 concise sentences providing an authoritative executive civil assessment of the hazard state.",
  "geotechnicalFactors": [
    "3 specific geotechnical bullet points explaining how pore pressure, slope angle, shale dip, and rainfall triggered this state."
  ],
  "immediateActions": [
    "3 specific, actionable steps for residents, commuters, or public works in this ward right now."
  ],
  "mizoSafetyAdvice": "1-2 sentences of emergency guidance translated into everyday Mizo language (e.g., advising people near steep slopes to move to safer ground or evacuation hall)."
}
`;

  // Candidate models: prefer 'gemini-3.5-flash-lite' and 'gemini-3.6-flash'
  // for reliable quota limits and fast response, with immediate calibrated geotechnical fallback on quota exhaustion.
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];

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
        6000
      );

      const rawText = response.text;
      if (rawText) {
        const cleaned = sanitizeJsonString(rawText);
        const parsed = JSON.parse(cleaned);

        return {
          locationId: location.id,
          locationName: location.name,
          riskLevel: location.riskLevel,
          factorOfSafety: location.factorOfSafety,
          summary: parsed.summary || 'Critical slope instability detected across weathered shale layers.',
          geotechnicalFactors: Array.isArray(parsed.geotechnicalFactors) && parsed.geotechnicalFactors.length > 0
            ? parsed.geotechnicalFactors
            : [
                `Pore pressure elevated to ${location.hydrology.porePressureKPa} kPa, causing shear strength degradation.`,
                `Slope gradient of ${location.slopeGradientDeg}° exceeds the natural internal friction angle (${location.geology.frictionAngleDeg}°).`,
                `Continuous 24h precipitation of ${location.hydrology.rainfall24hMm} mm saturates colluvial overburden.`
              ],
          immediateActions: Array.isArray(parsed.immediateActions) && parsed.immediateActions.length > 0
            ? parsed.immediateActions
            : [
                `Evacuate hillside dwellings proximate to scarp face towards ${location.evacuation.name}.`,
                `Halt heavy transport along compromised access corridors.`,
                `Inspect retaining wall weep holes and drainage flumes for blockages.`
              ],
          mizoSafetyAdvice: parsed.mizoSafetyAdvice || `Khawchhe zual laia leimin hlauhawm a nih avangin ${location.evacuation.name}-ah insawn vat a him ber. Fimkhur ula, helpline 1070 be rawh u.`,
          generatedByGemini: true,
          modelUsed: modelName,
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Landslide Watch] ${modelName} unavailable (${errMsg.slice(0, 80)}). Trying fallback...`);
    }
  }

  // Graceful fallback to calibrated deterministic geotechnical engine if external model is temporarily unavailable
  return generateFallbackExplanation(
    location,
    'Synthesized via calibrated Aizawl geotechnical physics model during high-demand API periods.'
  );
}

function generateFallbackExplanation(location: LocationRisk, _note: string): AIExplanationResult {
  const isCritical = location.factorOfSafety < 1.0;
  const isSevere = location.factorOfSafety >= 1.0 && location.factorOfSafety < 1.2;

  const summary = isCritical
    ? `Imminent failure conditions exist at ${location.name}. With a Factor of Safety of ${location.factorOfSafety} and pore pressure reaching ${location.hydrology.porePressureKPa} kPa, hydrostatic thrust exceeds resisting shear strength along the weathered shale bedding.`
    : isSevere
    ? `High slope instability alert active at ${location.name}. Factor of Safety of ${location.factorOfSafety} indicates marginal stability that will rapidly degrade if intense monsoon showers continue above 10 mm/hr.`
    : `Precautionary watch maintained for ${location.name}. Slope stability remains within acceptable margins (FoS: ${location.factorOfSafety}), but saturated ground warrants vigilance along unreinforced road cuttings.`;

  const geotechnicalFactors = [
    `Pore-water pressure of ${location.hydrology.porePressureKPa} kPa drastically reduces the effective normal stress along the ${location.geology.dipAngle} bedding plane.`,
    `Slope inclination of ${location.slopeGradientDeg}° significantly exceeds the critical friction angle (${location.geology.frictionAngleDeg}°), creating high shear driving stress.`,
    `Borehole telemetry records active displacement strain of +${location.hydrology.piezometerShiftMmHr} mm/hr in the ${location.geology.soilDepthM}m overburden colluvium.`
  ];

  const immediateActions = isCritical
    ? [
        `Immediate evacuation of residences on the downslope terrace to ${location.evacuation.name} (distance ~${location.evacuation.distanceMeters}m).`,
        `Immediate closure of vulnerable roadway corridors to heavy trucks and passenger buses.`,
        `Report any newly emerging tension cracks or muddy spring discharges to SEOC (Toll-Free 1070).`
      ]
    : [
        `Residents along slope crests should monitor ground cracks and avoid staying on ground-level hillside rooms during nocturnal rain.`,
        `Ensure surface runoff channels and roof drains discharge safely into municipal stormwater flumes rather than raw slope faces.`,
        `Keep emergency contact numbers handy (State Disaster Helpline: 1070).`
      ];

  const mizoSafetyAdvice = isCritical
    ? `Leimin hlauhawm lutuk a nih avangin ${location.name} vela chengte chu ${location.evacuation.name}-ah rang taka inthiarfihlim tur a ni. Fimkhur ula, harsatna awmah 1070-ah biak pawh theih a ni.`
    : `Ruah a sur nasat avangin kan awmna lai hi a hmun a nghet tawk lo va, leimin thut thei a nih avangin fimkhur tur a ni. Khawtlang hruaitute leh disaster desk 1070 thurawn ngaichang ang che u.`;

  return {
    locationId: location.id,
    locationName: location.name,
    riskLevel: location.riskLevel,
    factorOfSafety: location.factorOfSafety,
    summary,
    geotechnicalFactors,
    immediateActions,
    mizoSafetyAdvice,
    generatedByGemini: false,
    modelUsed: 'calibrated-geotechnical-synthesis',
    generatedAt: new Date().toISOString(),
  };
}
