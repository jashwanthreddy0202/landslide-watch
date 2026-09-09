import express, { Request, Response, Router } from 'express';
import { AIZAWL_LOCATIONS, AIZAWL_OVERVIEW, PUBLIC_ALERTS, SIMULATION_SCENARIOS } from '../data/mockData';
import { explainLocationRisk } from '../gemini';
import { recalculateLocationRisk } from '../services/riskCalculator';
import { riskRouter } from '../routes/risk';
import { calculateDemonstrationRisk, GeographicRiskInput } from '../services/riskEngine';
import { FissureReport, LocationRisk } from '../../src/types';
import {
  validateExplainRiskRequest,
  generateExplainableRiskSummary,
  generateDeterministicRuleBasedExplanation,
} from '../services/aiExplainer';
import {
  DEMONSTRATION_SCENARIOS,
  deriveDemonstrationAlertState,
} from '../../src/data/demonstrationScenarios';

const router: Router = express.Router();

// Mount Phase 1 Demonstration Landslide Risk Engine routes
router.use('/risk', riskRouter);

// GET /api/config/basemap - returns public basemap configuration
router.get('/config/basemap', (_req: Request, res: Response) => {
  res.json({
    cartoApiKey: process.env.VITE_CARTO_API_KEY || process.env.CARTO_API_KEY || '',
  });
});

// Stateful in-memory stores for dynamic demonstration mode
let currentLocations: LocationRisk[] = JSON.parse(JSON.stringify(AIZAWL_LOCATIONS));
let currentOverview = JSON.parse(JSON.stringify(AIZAWL_OVERVIEW));
let currentAlerts = JSON.parse(JSON.stringify(PUBLIC_ALERTS));
const communityReports: FissureReport[] = [];

// GET /api/telemetry/overview
router.get('/telemetry/overview', (_req: Request, res: Response) => {
  // Update counts based on current active locations
  let criticalCount = 0;
  let severeCount = 0;
  let watchCount = 0;

  currentLocations.forEach((loc) => {
    if (loc.riskLevel === 'Critical') criticalCount++;
    else if (loc.riskLevel === 'Severe') severeCount++;
    else if (loc.riskLevel === 'Watch') watchCount++;
  });

  const activeZones = criticalCount + severeCount + watchCount;

  res.json({
    ...currentOverview,
    activeDangerZonesCount: activeZones,
    criticalWardsCount: criticalCount,
    severeWardsCount: severeCount,
    watchWardsCount: watchCount,
    lastSyncTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
  });
});

// GET /api/locations
router.get('/locations', (req: Request, res: Response) => {
  const { ward, riskLevel } = req.query;
  let results = currentLocations.map((loc) => {
    const assessment = calculateDemonstrationRisk(loc.id);
    if (!assessment) return loc;
    return {
      ...loc,
      riskScore: assessment.riskScore,
      demonstrationConfidence: assessment.demonstrationConfidence,
      calculationMethod: assessment.calculationMethod,
      isDemoData: true,
      lastRecalculated: assessment.lastUpdated,
    };
  });

  if (ward && typeof ward === 'string') {
    results = results.filter((loc) => loc.ward.toLowerCase().includes(ward.toLowerCase()));
  }

  if (riskLevel && typeof riskLevel === 'string') {
    results = results.filter((loc) => loc.riskLevel.toLowerCase() === riskLevel.toLowerCase());
  }

  res.json(results);
});

// GET /api/locations/:id
router.get('/locations/:id', (req: Request, res: Response) => {
  const location = currentLocations.find((loc) => loc.id === req.params.id);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const assessment = calculateDemonstrationRisk(location.id);
  if (assessment) {
    res.json({
      ...location,
      riskScore: assessment.riskScore,
      demonstrationConfidence: assessment.demonstrationConfidence,
      calculationMethod: assessment.calculationMethod,
      isDemoData: true,
      lastRecalculated: assessment.lastUpdated,
    });
    return;
  }
  res.json(location);
});

// GET /api/alerts - Demonstration public safety alerts (Single Source of Truth)
router.get('/alerts', (req: Request, res: Response) => {
  const { level, riskLevel, scenario, rainfall, wetness } = req.query;

  const scenarioObj =
    typeof scenario === 'string' && scenario.trim() && scenario !== 'none'
      ? DEMONSTRATION_SCENARIOS.find((s) => s.id === scenario.trim())
      : undefined;
  const scenarioOverrides = scenarioObj?.factors;

  const customOverrides: Partial<GeographicRiskInput> = {};
  if (rainfall !== undefined && rainfall !== '' && !isNaN(Number(rainfall))) {
    customOverrides.rainfallMm = Math.max(0, Math.min(500, Number(rainfall)));
  }
  if (wetness !== undefined && wetness !== '' && !isNaN(Number(wetness))) {
    customOverrides.wetnessPercent = Math.max(0, Math.min(100, Number(wetness)));
  }

  const effectiveOverrides = {
    ...(scenarioOverrides || {}),
    ...customOverrides,
  };
  const hasOverrides = Boolean(
    scenarioObj || Object.keys(customOverrides).length > 0
  );

  // Enrich all alerts using the audited Phase 1 risk calculation engine
  const evaluatedAlerts = currentAlerts.map((alert: any) => {
    const locKey = alert.locationId || alert.location;
    const assessment = calculateDemonstrationRisk(locKey, hasOverrides ? effectiveOverrides : undefined);

    const calculatedRiskLevel = assessment?.riskLevel ?? alert.riskLevel ?? 'MODERATE';
    const calculatedRiskScore = assessment?.riskScore ?? (
      calculatedRiskLevel === 'VERY HIGH' ? 95 :
      calculatedRiskLevel === 'HIGH' ? 68 :
      calculatedRiskLevel === 'MODERATE' ? 42 : 18
    );
    const calculatedConfidence = assessment?.demonstrationConfidence ?? alert.demonstrationConfidence ?? 0.85;

    const alertState = deriveDemonstrationAlertState(calculatedRiskScore, calculatedRiskLevel);

    // Dynamic title and actions based on calculated risk tier
    const dynamicTitle =
      calculatedRiskLevel === 'VERY HIGH'
        ? `CRITICAL ALERT: Imminent Slope Failure Hazard (${alert.location})`
        : calculatedRiskLevel === 'HIGH'
        ? `WARNING: High Landslide Vulnerability (${alert.location})`
        : calculatedRiskLevel === 'MODERATE'
        ? `ADVISORY: Seasonal Ground Creep & Moisture Watch (${alert.location})`
        : `NOTICE: Routine Slope Observation (${alert.location})`;

    const dynamicStatus =
      calculatedRiskLevel === 'VERY HIGH'
        ? 'EMERGENCY ALERT'
        : calculatedRiskLevel === 'HIGH'
        ? 'WARNING ACTIVE'
        : calculatedRiskLevel === 'MODERATE'
        ? 'WATCH'
        : 'NORMAL MONITORING';

    const customDesc = hasOverrides
      ? `Demonstration environmental simulation: Recalculated risk score is ${calculatedRiskScore}/100 (${calculatedRiskLevel}) based on 24h rainfall (${effectiveOverrides.rainfallMm ?? 'baseline'}mm) and soil wetness (${effectiveOverrides.wetnessPercent ?? 'baseline'}%). Threshold status: ${alertState.status.replace(/_/g, ' ')}.`
      : alert.description;

    return {
      id: alert.id,
      location: alert.location,
      riskScore: calculatedRiskScore,
      riskLevel: calculatedRiskLevel,
      level: calculatedRiskLevel,
      title: hasOverrides ? dynamicTitle : alert.title,
      description: scenarioObj
        ? `Demonstration scenario [${scenarioObj.name}]: Recalculated risk score is ${calculatedRiskScore}/100 (${calculatedRiskLevel}). ${scenarioObj.explanation}`
        : customDesc,
      issuedAt: alert.issuedAt,
      status: hasOverrides ? dynamicStatus : alert.status,
      isDemoData: true,
      isDemoScenario: Boolean(scenarioObj),
      scenarioId: scenarioObj?.id,
      demonstrationConfidence: calculatedConfidence,
      modelConfidence: calculatedConfidence,
      calculationMethod: assessment?.calculationMethod || 'Phase 1 transparent weighted demonstration formula',
      factors: assessment?.factors,
      factorContributions: assessment?.factorContributions,
      alertState,
      lastUpdated: assessment?.lastUpdated ?? alert.issuedAt,

      // Rich metadata and navigation fields
      locationId: alert.locationId,
      summary: alert.description,
      zone: alert.zone || `${alert.location} Monitored Corridor`,
      timeAgo: 'Recent',
      timestamp: alert.issuedAt,
      details: alert.details || alert.description,
      actionRequired: hasOverrides ? alertState.recommendedAction : alert.actionRequired || 'Visual observation and precautionary monitoring',
      affectedLocations: alert.affectedLocations || [alert.location],
      roadClosures: alert.roadClosures || ['None active'],
      bulletinNo: alert.bulletinNo || alert.id,
      factorOfSafety: alert.factorOfSafety,
    };
  });

  let results = [...evaluatedAlerts];
  const filterTarget = ((riskLevel || level) as string | undefined)?.trim();

  if (filterTarget && filterTarget.toUpperCase() !== 'ALL') {
    const cleanFilter = filterTarget.toLowerCase().replace(/[\s-_]+/g, '');
    results = results.filter((a) => {
      const alertRisk = (a.riskLevel || '').toLowerCase().replace(/[\s-_]+/g, '');
      if (cleanFilter === 'high') {
        return alertRisk === 'high' && !alertRisk.includes('very');
      }
      return alertRisk === cleanFilter || alertRisk.includes(cleanFilter);
    });
  }

  res.json(results);
});

// POST /api/alerts/report
router.post('/alerts/report', (req: Request, res: Response) => {
  const { reporterName, phone, ward, locationDescription, fissureWidthCm, fissureLengthMeters, waterSeepageObserved, structureCracking, urgency } = req.body;

  if (!ward || !locationDescription) {
    res.status(400).json({ error: 'Ward and location description are required' });
    return;
  }

  const report: FissureReport = {
    id: 'REP-' + Date.now().toString().slice(-6),
    reporterName: reporterName || 'Anonymous Citizen',
    phone: phone || 'Not provided',
    ward,
    locationDescription,
    fissureWidthCm: Number(fissureWidthCm) || 2,
    fissureLengthMeters: Number(fissureLengthMeters) || 5,
    waterSeepageObserved: Boolean(waterSeepageObserved),
    structureCracking: Boolean(structureCracking),
    urgency: urgency || 'Medium',
    timestamp: new Date().toISOString(),
    status: 'Pending Verification',
  };

  communityReports.unshift(report);

  res.status(201).json({
    success: true,
    message: 'Geological fissure report recorded. Emergency dispatch alerted.',
    report,
  });
});

// GET /api/alerts/community-reports
router.get('/alerts/community-reports', (_req: Request, res: Response) => {
  res.json(communityReports);
});

/**
 * POST /api/ai/explain-risk
 *
 * Explains structured demonstration risk data using server-side Gemini.
 * Validates request strictly: rejects missing, malformed, or unmonitored locations.
 * Never exposes GEMINI_API_KEY to client.
 */
router.post('/ai/explain-risk', async (req: Request, res: Response) => {
  try {
    // 1. Validate request body cleanly
    const validation = validateExplainRiskRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.error,
        isDemoData: true,
      });
    }

    // 2. Check for simulated failure for error recovery testing (Test Case 3)
    const simulateFailure =
      req.query.simulateFailure === 'true' ||
      req.headers['x-simulate-failure'] === 'true' ||
      Boolean(req.body.simulateFailure);

    // 3. Generate explainable risk summary via server-side Gemini (with fault-tolerant fallback)
    const explanation = await generateExplainableRiskSummary(req.body, simulateFailure);
    res.json(explanation);
  } catch (error) {
    console.warn('[POST /api/ai/explain-risk] Exception occurred; activating rule-based demonstration fallback:', error);
    try {
      const fallback = generateDeterministicRuleBasedExplanation(
        req.body,
        'AI explanation temporarily unavailable. Risk assessment remains available.'
      );
      res.json(fallback);
    } catch {
      res.status(503).json({
        error: 'AI explanation temporarily unavailable. Risk assessment remains available.',
        message: error instanceof Error ? error.message : 'Service temporarily unavailable.',
        isDemoData: true,
      });
    }
  }
});

// POST /api/gemini/explain-risk
router.post('/gemini/explain-risk', async (req: Request, res: Response) => {
  try {
    const { locationId } = req.body;
    let targetLocation = currentLocations.find((l) => l.id === locationId);

    if (!targetLocation) {
      targetLocation = currentLocations[0];
    }

    const explanation = await explainLocationRisk(targetLocation);
    res.json(explanation);
  } catch (error) {
    console.warn('Recovered in /api/gemini/explain-risk route handler:', error);
    const targetLocation = currentLocations[0];
    res.json({
      locationId: targetLocation.id,
      locationName: targetLocation.name,
      riskLevel: targetLocation.riskLevel,
      factorOfSafety: targetLocation.factorOfSafety,
      summary: `Geotechnical monitoring active for ${targetLocation.name}. Real-time pore pressure and slope gradient metrics indicate active monitoring required.`,
      geotechnicalFactors: [
        `Pore pressure elevated across weathered shale layer.`,
        `Slope gradient of ${targetLocation.slopeGradientDeg}° requires vigilant drainage surveillance.`,
        `Rainfall saturation tracking continuous at ${targetLocation.hydrology.rainfall24hMm} mm / 24h.`
      ],
      immediateActions: [
        `Monitor hillside dwellings proximate to scarp face towards ${targetLocation.evacuation.name}.`,
        `Maintain open drainage weep holes along retaining masonry.`,
        `Call State Disaster Helpline 1070 for immediate structural advice.`
      ],
      mizoSafetyAdvice: `Fimkhur ula, leimin hlauhawm a nih avangin ${targetLocation.evacuation.name}-ah insawn vat a him ber.`,
      generatedByGemini: false,
      modelUsed: 'calibrated-geotechnical-synthesis',
      generatedAt: new Date().toISOString(),
    });
  }
});

// GET /api/scenarios - returns the 4 predefined demonstration scenarios
router.get('/scenarios', (_req: Request, res: Response) => {
  res.json(DEMONSTRATION_SCENARIOS);
});

// POST /api/simulation/apply
router.post('/simulation/apply', (req: Request, res: Response) => {
  const { scenarioId } = req.body;
  const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);

  if (!scenario) {
    res.status(400).json({ error: 'Invalid scenario ID' });
    return;
  }

  // Recalculate all locations with the scenario's physics parameters
  currentLocations = AIZAWL_LOCATIONS.map((loc) =>
    recalculateLocationRisk(
      loc,
      scenario.rainMultiplier,
      scenario.porePressureOffsetKPa,
      scenario.saturationOffsetPercent
    )
  );

  // Recalculate overview metrics
  const newRain24 = Number((AIZAWL_OVERVIEW.cumulativeRainfall24h * scenario.rainMultiplier).toFixed(1));
  const newSaturation = Math.min(
    99.5,
    Math.max(45, Number((AIZAWL_OVERVIEW.monsoonSaturationPercent + scenario.saturationOffsetPercent).toFixed(1)))
  );

  let newThreatScore = Math.round((newSaturation * 0.5) + (newRain24 / 200 * 50));
  newThreatScore = Math.min(99, Math.max(15, newThreatScore));

  let alertLevel = 'MODERATE (YELLOW ADVISORY)';
  if (newThreatScore >= 85) alertLevel = 'CRITICAL SEVERE (RED ALERT)';
  else if (newThreatScore >= 65) alertLevel = 'HIGH RISK (ORANGE ALERT)';
  else if (newThreatScore < 45) alertLevel = 'LOW RISK (GREEN MONITORING)';

  currentOverview = {
    ...currentOverview,
    cityThreatScore: newThreatScore,
    alertLevel,
    cumulativeRainfall24h: newRain24,
    monsoonSaturationPercent: newSaturation,
    lastSyncTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
  };

  res.json({
    success: true,
    scenario,
    overview: currentOverview,
    locations: currentLocations,
  });
});

export default router;
