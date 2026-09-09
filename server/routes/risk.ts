import { Router, Request, Response } from 'express';
import { calculateDemonstrationRisk, getPhase1RiskLevel, GeographicRiskInput } from '../services/riskEngine';
import { AIZAWL_LOCATIONS, DEMONSTRATION_RISK_POINTS } from '../data/mockData';
import {
  DEMONSTRATION_SCENARIOS,
  deriveDemonstrationAlertState,
  DEMO_SCENARIO_EXPLANATION,
} from '../../src/data/demonstrationScenarios';

export const riskRouter = Router();

/**
 * Evaluates all demonstration points through the single source of truth risk engine.
 * Supports scenario factor overrides and dynamic environmental factor overrides (rainfall, wetness, slope).
 */
function getEvaluatedPoints(
  scenarioId?: string,
  customOverrides?: Partial<GeographicRiskInput>
) {
  const scenarioObj = scenarioId
    ? DEMONSTRATION_SCENARIOS.find((s) => s.id === scenarioId)
    : undefined;
  const baseOverrides = scenarioObj?.factors || {};
  const overrides: Partial<GeographicRiskInput> = {
    ...baseOverrides,
    ...(customOverrides?.rainfallMm !== undefined ? { rainfallMm: customOverrides.rainfallMm } : {}),
    ...(customOverrides?.wetnessPercent !== undefined ? { wetnessPercent: customOverrides.wetnessPercent } : {}),
    ...(customOverrides?.slopeDeg !== undefined ? { slopeDeg: customOverrides.slopeDeg } : {}),
  };

  const hasAnyOverrides = Boolean(
    scenarioObj ||
    (customOverrides && Object.values(customOverrides).some((v) => v !== undefined))
  );

  return DEMONSTRATION_RISK_POINTS.map((pt) => {
    const assessment = calculateDemonstrationRisk(pt.id, hasAnyOverrides ? overrides : undefined);
    const riskScore = assessment?.riskScore ?? pt.riskScore;
    const riskLevel = assessment?.riskLevel ?? pt.riskLevel;
    const alertState = deriveDemonstrationAlertState(riskScore, riskLevel);

    return {
      ...pt,
      riskScore,
      riskLevel,
      demonstrationConfidence:
        assessment?.demonstrationConfidence ?? pt.demonstrationConfidence ?? 0.85,
      modelConfidence: assessment?.modelConfidence ?? pt.modelConfidence ?? 0.85,
      calculationMethod: assessment?.calculationMethod,
      formulaDescription: assessment?.formulaDescription,
      factors: assessment?.factors,
      factorContributions: assessment?.factorContributions,
      lastUpdated: assessment?.lastUpdated ?? pt.lastUpdated,
      isDemoData: true,
      isScenarioActive: hasAnyOverrides,
      scenarioId: scenarioObj?.id,
      scenarioName: scenarioObj?.name || (hasAnyOverrides ? 'Dynamic Environmental Simulation' : undefined),
      alertState,
      disclaimer: assessment?.disclaimer,
    };
  });
}

/**
 * GET /api/risk/scenarios
 * Returns the 4 predefined demonstration scenarios and their environmental factors.
 */
riskRouter.get('/scenarios', (_req: Request, res: Response) => {
  res.json({
    scenarios: DEMONSTRATION_SCENARIOS,
    explanation: DEMO_SCENARIO_EXPLANATION,
    isDemoData: true,
    boundaries: {
      low: '0–25',
      moderate: '26–50',
      high: '51–75',
      veryHigh: '76–100',
    },
  });
});

/**
 * POST /api/risk/scenarios/evaluate
 *
 * Evaluates a demonstration scenario on a specified location (or default hotspot)
 * using the audited backend risk engine as the single source of truth.
 * Recalculates:
 * - riskScore
 * - riskLevel
 * - factorContributions
 * - Demonstration Confidence
 * - calculationMethod
 * - demonstration alert state
 */
riskRouter.post('/scenarios/evaluate', (req: Request, res: Response) => {
  try {
    const { scenarioId, location, customFactors } = req.body;

    if (!scenarioId || typeof scenarioId !== 'string') {
      return res.status(400).json({
        error: 'Missing scenarioId',
        message: 'A valid demonstration scenario identifier (normal, increasing-rainfall, heavy-rainfall, extreme-risk) is required.',
        isDemoData: true,
      });
    }

    const scenario = DEMONSTRATION_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) {
      return res.status(404).json({
        error: 'Scenario not found',
        message: `Unknown scenario "${scenarioId}". Available scenarios: ${DEMONSTRATION_SCENARIOS.map((s) => s.id).join(', ')}`,
        isDemoData: true,
      });
    }

    // Combine scenario factors with any optional caller overrides
    const factorOverrides: Partial<GeographicRiskInput> = {
      ...scenario.factors,
      ...customFactors,
    };

    const targetLoc = location && typeof location === 'string' && location.trim()
      ? location.trim()
      : DEMONSTRATION_RISK_POINTS[0].id;

    const assessment = calculateDemonstrationRisk(targetLoc, factorOverrides);
    if (!assessment) {
      return res.status(404).json({
        error: 'Location not found',
        message: `Location "${targetLoc}" not found in monitored corridors.`,
        isDemoData: true,
      });
    }

    const alertState = deriveDemonstrationAlertState(assessment.riskScore, assessment.riskLevel);

    res.json({
      scenario,
      assessment,
      alertState,
      isDemoData: true,
      isDemoScenario: true,
      explanation: DEMO_SCENARIO_EXPLANATION,
    });
  } catch (err) {
    console.error('Error evaluating demonstration scenario:', err);
    res.status(500).json({
      error: 'Failed to evaluate scenario',
      message: err instanceof Error ? err.message : String(err),
      isDemoData: true,
    });
  }
});

/**
 * GET /api/risk/points
 * Returns all demonstration risk points evaluated by the audited Phase 1 risk engine.
 * Accepts ?scenario=<scenarioId>&rainfall=<mm>&wetness=<%>&slope=<deg> to evaluate all points under dynamic environmental conditions.
 */
riskRouter.get('/points', (req: Request, res: Response) => {
  try {
    const { scenario, rainfall, wetness, slope } = req.query;
    const scenarioId = typeof scenario === 'string' && scenario.trim() && scenario !== 'none'
      ? scenario.trim()
      : undefined;

    const customOverrides: Partial<GeographicRiskInput> = {};
    if (rainfall !== undefined && rainfall !== '' && !isNaN(Number(rainfall))) {
      customOverrides.rainfallMm = Math.max(0, Math.min(500, Number(rainfall)));
    }
    if (wetness !== undefined && wetness !== '' && !isNaN(Number(wetness))) {
      customOverrides.wetnessPercent = Math.max(0, Math.min(100, Number(wetness)));
    }
    if (slope !== undefined && slope !== '' && !isNaN(Number(slope))) {
      customOverrides.slopeDeg = Math.max(0, Math.min(90, Number(slope)));
    }

    const points = getEvaluatedPoints(scenarioId, customOverrides);
    res.json(points);
  } catch (err) {
    console.error('Error calculating demonstration points list:', err);
    res.status(500).json({
      error: 'Failed to generate demonstration points list',
      isDemoData: true,
    });
  }
});

/**
 * GET /api/risk
 * Returns demonstration risk assessments for all primary Aizawl monitored corridors,
 * or handles query parameter ?location=...
 */
riskRouter.get('/', (req: Request, res: Response) => {
  const { location } = req.query;

  // If query parameter location was provided, delegate to location evaluator
  if (location && typeof location === 'string' && location.trim()) {
    try {
      const assessment = calculateDemonstrationRisk(location.trim());
      if (!assessment) {
        return res.status(404).json({
          error: 'Location not found',
          message: `Location "${location}" does not correspond to an existing demonstration location in monitored corridors.`,
          notFound: true,
          isDemoData: true,
        });
      }
      return res.json(assessment);
    } catch (err) {
      console.error(`Error calculating demonstration risk for location query "${location}":`, err);
      return res.status(500).json({
        error: 'Failed to calculate demonstration risk',
        message: err instanceof Error ? err.message : String(err),
        isDemoData: true,
      });
    }
  }

  try {
    const points = getEvaluatedPoints();
    res.json(points);
  } catch (err) {
    console.error('Error calculating demonstration risk list:', err);
    res.status(500).json({
      error: 'Failed to generate demonstration risk list',
      isDemoData: true,
    });
  }
});

/**
 * GET /api/risk/:location
 *
 * Evaluates Phase 1 Demonstration landslide risk for a specified location.
 *
 * Query Params (optional overrides for testing the weighted formula):
 * - rainfall: number (0 - 500 mm/24h)
 * - slope: number (0 - 90 degrees)
 * - elevation: number (0 - 4000 meters)
 * - wetness: number (0 - 100 percent)
 * - historical: string or number (0 - 100)
 * - landCover: string or number (0 - 100)
 */
riskRouter.get('/:location', (req: Request, res: Response) => {
  const { location } = req.params;
  const { rainfall, slope, elevation, wetness, historical, landCover, scenario } = req.query;

  // 1. Validate location parameter
  if (!location || typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({
      error: 'Invalid location parameter',
      message: 'A valid location identifier or name must be provided.',
      isDemoData: true,
    });
  }

  const scenarioObj = typeof scenario === 'string' && scenario.trim() && scenario !== 'none'
    ? DEMONSTRATION_SCENARIOS.find((s) => s.id === scenario.trim())
    : undefined;

  // 2. Validate optional numeric factor overrides
  if (rainfall !== undefined) {
    const r = Number(rainfall);
    if (isNaN(r) || !isFinite(r) || r < 0 || r > 500) {
      return res.status(400).json({
        error: 'Validation error: rainfall',
        message: 'The rainfall factor must be a valid numeric value between 0 and 500 mm/24h.',
        isDemoData: true,
      });
    }
  }

  if (slope !== undefined) {
    const s = Number(slope);
    if (isNaN(s) || !isFinite(s) || s < 0 || s > 90) {
      return res.status(400).json({
        error: 'Validation error: slope',
        message: 'The slope factor must be a valid numeric gradient between 0 and 90 degrees.',
        isDemoData: true,
      });
    }
  }

  if (elevation !== undefined) {
    const e = Number(elevation);
    if (isNaN(e) || !isFinite(e) || e < 0 || e > 4000) {
      return res.status(400).json({
        error: 'Validation error: elevation',
        message: 'The elevation factor must be a valid numeric height between 0 and 4000 meters.',
        isDemoData: true,
      });
    }
  }

  if (wetness !== undefined) {
    const w = Number(wetness);
    if (isNaN(w) || !isFinite(w) || w < 0 || w > 100) {
      return res.status(400).json({
        error: 'Validation error: wetness',
        message: 'The wetness factor must be a valid numeric percentage between 0 and 100%.',
        isDemoData: true,
      });
    }
  }

  if (historical !== undefined && !isNaN(Number(historical))) {
    const h = Number(historical);
    if (h < 0 || h > 100) {
      return res.status(400).json({
        error: 'Validation error: historical',
        message: 'If historical activity is provided as a number, it must be between 0 and 100.',
        isDemoData: true,
      });
    }
  }

  if (landCover !== undefined && !isNaN(Number(landCover))) {
    const lc = Number(landCover);
    if (lc < 0 || lc > 100) {
      return res.status(400).json({
        error: 'Validation error: landCover',
        message: 'If land cover is provided as a number, it must be between 0 and 100.',
        isDemoData: true,
      });
    }
  }

  try {
    const overrides: Partial<GeographicRiskInput> = {
      rainfallMm: rainfall !== undefined ? Number(rainfall) : scenarioObj?.factors.rainfallMm,
      slopeDeg: slope !== undefined ? Number(slope) : scenarioObj?.factors.slopeDeg,
      elevationM: elevation !== undefined ? Number(elevation) : scenarioObj?.factors.elevationM,
      wetnessPercent: wetness !== undefined ? Number(wetness) : scenarioObj?.factors.wetnessPercent,
      historicalActivityLevel: historical
        ? (isNaN(Number(historical)) ? (historical as any) : Number(historical))
        : scenarioObj?.factors.historicalActivityLevel,
      landCoverType: landCover
        ? (isNaN(Number(landCover)) ? String(landCover) : Number(landCover))
        : scenarioObj?.factors.landCoverType,
    };

    const riskAssessment = calculateDemonstrationRisk(location, overrides);
    if (!riskAssessment) {
      return res.status(404).json({
        error: 'Location not found',
        message: `Location "${location}" does not correspond to an existing demonstration location in monitored corridors.`,
        notFound: true,
        isDemoData: true,
      });
    }

    // 3. Robust internal integrity checks
    // - riskScore must be 0–100
    // - riskLevel must match riskScore
    if (
      typeof riskAssessment.riskScore !== 'number' ||
      riskAssessment.riskScore < 0 ||
      riskAssessment.riskScore > 100
    ) {
      throw new Error(`Calculated risk score ${riskAssessment.riskScore} out of bounds (0-100).`);
    }

    const expectedLevel = getPhase1RiskLevel(riskAssessment.riskScore);
    if (riskAssessment.riskLevel !== expectedLevel) {
      throw new Error(
        `Risk level mismatch: score ${riskAssessment.riskScore} produced ${riskAssessment.riskLevel}, expected ${expectedLevel}.`
      );
    }

    const alertState = deriveDemonstrationAlertState(riskAssessment.riskScore, riskAssessment.riskLevel);

    res.json({
      ...riskAssessment,
      isScenarioActive: Boolean(scenarioObj),
      scenario: scenarioObj,
      alertState,
    });
  } catch (err) {
    console.error(`Error calculating demonstration risk for location "${location}":`, err);
    res.status(500).json({
      error: 'Failed to calculate demonstration risk',
      message: err instanceof Error ? err.message : String(err),
      isDemoData: true,
    });
  }
});
