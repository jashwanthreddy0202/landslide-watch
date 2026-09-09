import { Coordinates } from '../types';

export interface DemonstrationRiskPoint {
  id: string;
  location: string;
  ward: string;
  latitude: number;
  longitude: number;
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  estimatedRisk: string;
  modelConfidence: number; // 0.0 - 1.0 (e.g. 0.88) (kept for backward compatibility)
  demonstrationConfidence: number; // 0.0 - 1.0 (e.g. 0.88)
  mainRiskFactors: string[];
  lastUpdated: string;
  targetLocationId: string;
  factorOfSafety?: number;
  slopeDeg?: number;
  rainfall24hMm?: number;
  soilSaturation?: number;
  elevationM?: number;
  historicalActivityLevel?: string;
  landCoverType?: string;
  normalizedScores?: {
    rainfall: number;
    slope: number;
    wetness: number;
    historicalActivity: number;
    landCover: number;
    elevation: number;
  };
}

export const DEMONSTRATION_RISK_POINTS: DemonstrationRiskPoint[] = [
  {
    "id": "thuampui-bypass",
    "location": "Thuampui & Zemabawk Bypass",
    "ward": "Ward XIX (AMC)",
    "latitude": 23.7432,
    "longitude": 92.7381,
    "riskScore": 95,
    "riskLevel": "VERY HIGH",
    "estimatedRisk": "Acute vulnerability to slope shear under prolonged monsoon saturation",
    "modelConfidence": 0.88,
    "mainRiskFactors": [
      "Heavy antecedent rainfall conditions",
      "Over-steepened hillside cut-slope terrain",
      "Elevated soil saturation and pore water pressure",
      "Historical landslide susceptibility along dip slope"
    ],
    "lastUpdated": "14:28 IST (DEMO DATA)",
    "targetLocationId": "thuampui-zemabawk",
    "factorOfSafety": 0.82,
    "slopeDeg": 53.4,
    "rainfall24hMm": 131.6,
    "soilSaturation": 99,
    "demonstrationConfidence": 0.88,
    "elevationM": 1280,
    "normalizedScores": {
      "rainfall": 94,
      "slope": 97,
      "wetness": 99,
      "historicalActivity": 94,
      "landCover": 92,
      "elevation": 85
    }
  },
  {
    "id": "durtlang-leitan",
    "location": "Durtlang Leitan Corridor",
    "ward": "Ward XX (AMC)",
    "latitude": 23.7651,
    "longitude": 92.7305,
    "riskScore": 72,
    "riskLevel": "HIGH",
    "estimatedRisk": "Elevated vulnerability to jointed rockfall and colluvial runoff",
    "modelConfidence": 0.89,
    "mainRiskFactors": [
      "Steep North-East escarpment terrain",
      "Elevated joint water pressure in fractured sandstone",
      "Heavy monsoon rainfall conditions",
      "Historical arterial road blockage susceptibility"
    ],
    "lastUpdated": "14:25 IST (DEMO DATA)",
    "targetLocationId": "durtlang-leitan",
    "factorOfSafety": 1.15,
    "slopeDeg": 38.5,
    "rainfall24hMm": 85.0,
    "soilSaturation": 74,
    "demonstrationConfidence": 0.89,
    "elevationM": 1190,
    "normalizedScores": {
      "rainfall": 70,
      "slope": 75,
      "wetness": 72,
      "historicalActivity": 75,
      "landCover": 70,
      "elevation": 65
    }
  },
  {
    "id": "melthum-quarry",
    "location": "Melthum Quarry Corridor",
    "ward": "Aizawl Outskirts / Southern Corridor",
    "latitude": 23.682,
    "longitude": 92.718,
    "riskScore": 94,
    "riskLevel": "VERY HIGH",
    "estimatedRisk": "Acute hazard of rock toppling and colluvial flow",
    "modelConfidence": 0.91,
    "mainRiskFactors": [
      "Steep quarry highwall scarp with unconsolidated scree",
      "Historical slope disaster corridor and pre-existing shear planes",
      "Severe ground wetness and subsurface drainage convergence",
      "Heavy rainfall conditions accelerating slope destabilization"
    ],
    "lastUpdated": "14:28 IST (DEMO DATA)",
    "targetLocationId": "melthum-quarry-slope",
    "factorOfSafety": 0.85,
    "slopeDeg": 53.4,
    "rainfall24hMm": 126,
    "soilSaturation": 99,
    "demonstrationConfidence": 0.91,
    "elevationM": 1280,
    "normalizedScores": {
      "rainfall": 90,
      "slope": 97,
      "wetness": 99,
      "historicalActivity": 94,
      "landCover": 92,
      "elevation": 85
    }
  },
  {
    "id": "laipuitlang-ridge",
    "location": "Laipuitlang Ridge & Memorial Scarp",
    "ward": "Ward IX (AMC)",
    "latitude": 23.7388,
    "longitude": 92.7198,
    "riskScore": 89,
    "riskLevel": "VERY HIGH",
    "estimatedRisk": "High susceptibility to cliff edge rotational failure",
    "modelConfidence": 0.86,
    "mainRiskFactors": [
      "Over-steepened western cliff scarp terrain",
      "Elevated soil saturation and perched groundwater table",
      "Documented historical landslide activity and surface tension cracks",
      "Weak colluvium overburden on high-relief slope"
    ],
    "lastUpdated": "14:28 IST (DEMO DATA)",
    "targetLocationId": "laipuitlang-ridge",
    "factorOfSafety": 0.92,
    "slopeDeg": 50.1,
    "rainfall24hMm": 105,
    "soilSaturation": 99,
    "demonstrationConfidence": 0.86,
    "elevationM": 1280,
    "normalizedScores": {
      "rainfall": 75,
      "slope": 91,
      "wetness": 99,
      "historicalActivity": 94,
      "landCover": 92,
      "elevation": 85
    }
  },
  {
    "id": "tuikual-valley",
    "location": "Tuikual Valley & Rangvamual Road",
    "ward": "Ward V (AMC)",
    "latitude": 23.731,
    "longitude": 92.709,
    "riskScore": 44,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Moderate vulnerability along valley drainage corridor",
    "modelConfidence": 0.84,
    "mainRiskFactors": [
      "Valley floor drainage convergence corridor",
      "Moderate hillside terrace incline",
      "Seasonal moisture accumulation in colluvium",
      "Managed roadside slope protection works"
    ],
    "lastUpdated": "14:26 IST (DEMO DATA)",
    "targetLocationId": "tuikual-valley",
    "factorOfSafety": 1.34,
    "slopeDeg": 26.5,
    "rainfall24hMm": 54.0,
    "soilSaturation": 50,
    "demonstrationConfidence": 0.84,
    "elevationM": 860,
    "normalizedScores": {
      "rainfall": 42,
      "slope": 48,
      "wetness": 45,
      "historicalActivity": 45,
      "landCover": 40,
      "elevation": 40
    }
  },
  {
    "id": "sairang-descent",
    "location": "Sairang Valley Flank Corridor",
    "ward": "NH-54 Western Approach",
    "latitude": 23.748,
    "longitude": 92.689,
    "riskScore": 82,
    "riskLevel": "VERY HIGH",
    "estimatedRisk": "High susceptibility to roadway debris slide and colluvium wash",
    "modelConfidence": 0.83,
    "mainRiskFactors": [
      "Steep valley flank highway cut slopes",
      "Concentrated natural storm runoff infiltration",
      "Elevated soil saturation along fractured shale",
      "Historical monsoon slope wash susceptibility"
    ],
    "lastUpdated": "14:24 IST (DEMO DATA)",
    "targetLocationId": "tuikual-valley",
    "factorOfSafety": 0.98,
    "slopeDeg": 41.3,
    "rainfall24hMm": 105,
    "soilSaturation": 85,
    "demonstrationConfidence": 0.83,
    "elevationM": 1240,
    "normalizedScores": {
      "rainfall": 75,
      "slope": 75,
      "wetness": 85,
      "historicalActivity": 94,
      "landCover": 92,
      "elevation": 80
    }
  },
  {
    "id": "bawngkawn-south",
    "location": "Bawngkawn South & Junction",
    "ward": "Ward XII (AMC)",
    "latitude": 23.7489,
    "longitude": 92.7242,
    "riskScore": 46,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Moderate hazard of terrace retaining wall strain",
    "modelConfidence": 0.82,
    "mainRiskFactors": [
      "Moderate slope gradient along commercial junction",
      "Intermittent stormwater runoff surcharge",
      "Stepped retaining masonry under routine inspection",
      "Stable underlying siltstone strata"
    ],
    "lastUpdated": "14:27 IST (DEMO DATA)",
    "targetLocationId": "bawngkawn-south",
    "factorOfSafety": 1.28,
    "slopeDeg": 28.0,
    "rainfall24hMm": 58.0,
    "soilSaturation": 52,
    "demonstrationConfidence": 0.82,
    "elevationM": 940,
    "normalizedScores": {
      "rainfall": 45,
      "slope": 50,
      "wetness": 45,
      "historicalActivity": 45,
      "landCover": 45,
      "elevation": 45
    }
  },
  {
    "id": "kulikawn-slope",
    "location": "Kulikawn Hospital Ridge",
    "ward": "Ward I (AMC)",
    "latitude": 23.705,
    "longitude": 92.715,
    "riskScore": 72,
    "riskLevel": "HIGH",
    "estimatedRisk": "Elevated vulnerability to perimeter slope subsidence",
    "modelConfidence": 0.85,
    "mainRiskFactors": [
      "Weathered shale terrain with swelling clay properties",
      "Elevated soil saturation along hospital approach slope",
      "Steep hillside inclination below access route",
      "Historical localized soil creep activity"
    ],
    "lastUpdated": "14:26 IST (DEMO DATA)",
    "targetLocationId": "kulikawn-slope",
    "factorOfSafety": 1.08,
    "slopeDeg": 40.7,
    "rainfall24hMm": 84,
    "soilSaturation": 88,
    "demonstrationConfidence": 0.85,
    "elevationM": 1080,
    "normalizedScores": {
      "rainfall": 60,
      "slope": 74,
      "wetness": 88,
      "historicalActivity": 75,
      "landCover": 70,
      "elevation": 60
    }
  },
  {
    "id": "ramhlun-vengthlang",
    "location": "Ramhlun Vengthlang & Sports Complex",
    "ward": "Ward XI (AMC)",
    "latitude": 23.741,
    "longitude": 92.729,
    "riskScore": 28,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Low-to-moderate hazard on reinforced sports complex terrace",
    "modelConfidence": 0.83,
    "mainRiskFactors": [
      "Reinforced masonry retaining structures",
      "Mild terrace slope gradient",
      "Active engineered stormwater diversion culverts",
      "Stable subsurface sandstone bedrock"
    ],
    "lastUpdated": "14:23 IST (DEMO DATA)",
    "targetLocationId": "ramhlun-vengthlang",
    "factorOfSafety": 1.48,
    "slopeDeg": 18.0,
    "rainfall24hMm": 32.0,
    "soilSaturation": 35,
    "demonstrationConfidence": 0.83,
    "elevationM": 920,
    "normalizedScores": {
      "rainfall": 28,
      "slope": 30,
      "wetness": 32,
      "historicalActivity": 25,
      "landCover": 25,
      "elevation": 25
    }
  },
  {
    "id": "khatla-south",
    "location": "Khatla South & Secretariat Descent",
    "ward": "Ward VI (AMC)",
    "latitude": 23.7225,
    "longitude": 92.714,
    "riskScore": 65,
    "riskLevel": "HIGH",
    "estimatedRisk": "Elevated susceptibility to stepped foundation creep",
    "modelConfidence": 0.8,
    "mainRiskFactors": [
      "Steep hillside descent below government secretariat",
      "Elevated subsurface moisture in weathered shale",
      "Stepped urban residential terraces",
      "Historical localized slope settlement"
    ],
    "lastUpdated": "14:24 IST (DEMO DATA)",
    "targetLocationId": "khatla-south",
    "factorOfSafety": 1.15,
    "slopeDeg": 30.3,
    "rainfall24hMm": 84,
    "soilSaturation": 72,
    "demonstrationConfidence": 0.8,
    "elevationM": 1080,
    "normalizedScores": {
      "rainfall": 60,
      "slope": 55,
      "wetness": 72,
      "historicalActivity": 75,
      "landCover": 70,
      "elevation": 60
    }
  },
  {
    "id": "chanmari-west",
    "location": "Chanmari West & Ramhlun North Scarp",
    "ward": "Ward XIII (AMC)",
    "latitude": 23.746,
    "longitude": 92.727,
    "riskScore": 41,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Moderate hazard along stepped residential flank",
    "modelConfidence": 0.79,
    "mainRiskFactors": [
      "Stepped urban residential hillside terraces",
      "Intermittent stormwater drainage runoff",
      "Favorable bedrock bedding configuration",
      "Established hillside retaining infrastructure"
    ],
    "lastUpdated": "14:23 IST (DEMO DATA)",
    "targetLocationId": "chanmari-west",
    "factorOfSafety": 1.36,
    "slopeDeg": 24.0,
    "rainfall24hMm": 52.0,
    "soilSaturation": 48,
    "demonstrationConfidence": 0.79,
    "elevationM": 980,
    "normalizedScores": {
      "rainfall": 40,
      "slope": 42,
      "wetness": 42,
      "historicalActivity": 40,
      "landCover": 40,
      "elevation": 40
    }
  },
  {
    "id": "zemabawk-east",
    "location": "Zemabawk East Valley",
    "ward": "Ward XIX (AMC)",
    "latitude": 23.738,
    "longitude": 92.748,
    "riskScore": 68,
    "riskLevel": "HIGH",
    "estimatedRisk": "Elevated vulnerability to road shoulder and terrace wash",
    "modelConfidence": 0.81,
    "mainRiskFactors": [
      "Chite river catchment headwaters gully terrain",
      "Elevated soil saturation in unconsolidated colluvium",
      "Steep hillside slope gradient",
      "Monsoon runoff concentration"
    ],
    "lastUpdated": "14:26 IST (DEMO DATA)",
    "targetLocationId": "thuampui-zemabawk",
    "factorOfSafety": 1.14,
    "slopeDeg": 30.3,
    "rainfall24hMm": 84,
    "soilSaturation": 87,
    "demonstrationConfidence": 0.81,
    "elevationM": 1080,
    "normalizedScores": {
      "rainfall": 60,
      "slope": 55,
      "wetness": 87,
      "historicalActivity": 75,
      "landCover": 70,
      "elevation": 60
    }
  },
  {
    "id": "mission-veng",
    "location": "Mission Veng & Model Veng Flank",
    "ward": "Ward VII (AMC)",
    "latitude": 23.716,
    "longitude": 92.723,
    "riskScore": 48,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Moderate hazard of shallow terrace slippage",
    "modelConfidence": 0.78,
    "mainRiskFactors": [
      "Moderate hillside slope gradient",
      "Urban runoff concentration along natural gullies",
      "Interbedded siltstone with localized saturation",
      "Partially reinforced slope retaining walls"
    ],
    "lastUpdated": "14:22 IST (DEMO DATA)",
    "targetLocationId": "mission-veng",
    "factorOfSafety": 1.22,
    "slopeDeg": 28.6,
    "rainfall24hMm": 53.2,
    "soilSaturation": 60,
    "demonstrationConfidence": 0.78,
    "elevationM": 960,
    "normalizedScores": {
      "rainfall": 38,
      "slope": 52,
      "wetness": 60,
      "historicalActivity": 45,
      "landCover": 45,
      "elevation": 45
    }
  },
  {
    "id": "chaltlang-peak",
    "location": "Chaltlang Crest & Tourist Lodge Slope",
    "ward": "Ward X (AMC)",
    "latitude": 23.754,
    "longitude": 92.7215,
    "riskScore": 42,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Moderate risk of superficial soil creep under prolonged rain",
    "modelConfidence": 0.81,
    "mainRiskFactors": [
      "Moderate crest slope along tourist lodge ridge",
      "Moderately weathered sandstone with stable jointing",
      "Controlled stormwater runoff collection",
      "Routine slope maintenance and vegetative cover"
    ],
    "lastUpdated": "14:20 IST (DEMO DATA)",
    "targetLocationId": "chaltlang-peak",
    "factorOfSafety": 1.38,
    "slopeDeg": 16.5,
    "rainfall24hMm": 49,
    "soilSaturation": 55,
    "demonstrationConfidence": 0.81,
    "elevationM": 960,
    "normalizedScores": {
      "rainfall": 35,
      "slope": 30,
      "wetness": 55,
      "historicalActivity": 45,
      "landCover": 45,
      "elevation": 45
    }
  },
  {
    "id": "zarkawt-square",
    "location": "Zarkawt & Treasury Square Flank",
    "ward": "Ward VIII (AMC)",
    "latitude": 23.7345,
    "longitude": 92.717,
    "riskScore": 35,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Localized gully wash risk along lower urban terraces",
    "modelConfidence": 0.85,
    "mainRiskFactors": [
      "Mild-to-moderate urban terrace gradient",
      "Engineered concrete drainage infrastructure",
      "Substantial commercial retaining walls",
      "Stable sandstone foundation"
    ],
    "lastUpdated": "14:20 IST (DEMO DATA)",
    "targetLocationId": "laipuitlang-ridge",
    "factorOfSafety": 1.42,
    "slopeDeg": 16.5,
    "rainfall24hMm": 49,
    "soilSaturation": 40,
    "demonstrationConfidence": 0.85,
    "elevationM": 880,
    "normalizedScores": {
      "rainfall": 35,
      "slope": 30,
      "wetness": 40,
      "historicalActivity": 35,
      "landCover": 35,
      "elevation": 35
    }
  },
  {
    "id": "sikulpuikawn-republic",
    "location": "Sikulpuikawn & Upper Republic Ridge",
    "ward": "Ward III (AMC)",
    "latitude": 23.727,
    "longitude": 92.72,
    "riskScore": 38,
    "riskLevel": "MODERATE",
    "estimatedRisk": "Moderate risk on lower cut-slopes during intense spells",
    "modelConfidence": 0.82,
    "mainRiskFactors": [
      "Moderate residential hillside terrace",
      "Controlled street stormwater discharge",
      "Sound structural slope stabilization",
      "No active tension cracking observed"
    ],
    "lastUpdated": "14:21 IST (DEMO DATA)",
    "targetLocationId": "khatla-south",
    "factorOfSafety": 1.39,
    "slopeDeg": 16.5,
    "rainfall24hMm": 49,
    "soilSaturation": 40,
    "demonstrationConfidence": 0.82,
    "elevationM": 920,
    "normalizedScores": {
      "rainfall": 35,
      "slope": 30,
      "wetness": 40,
      "historicalActivity": 45,
      "landCover": 45,
      "elevation": 40
    }
  },
  {
    "id": "falkawn-plateau",
    "location": "Falkawn & ZMC Medical College Plateau",
    "ward": "Southern Outer Sector",
    "latitude": 23.645,
    "longitude": 92.725,
    "riskScore": 18,
    "riskLevel": "LOW",
    "estimatedRisk": "Low hazard with stable plateau bedrock",
    "modelConfidence": 0.9,
    "mainRiskFactors": [
      "Broad low-gradient plateau topography",
      "Massive unweathered sandstone foundation",
      "Comprehensive engineered drainage at medical campus",
      "No historical landslide incidents recorded"
    ],
    "lastUpdated": "14:20 IST (DEMO DATA)",
    "targetLocationId": "melthum-quarry-slope",
    "factorOfSafety": 1.85,
    "slopeDeg": 5.5,
    "rainfall24hMm": 16.8,
    "soilSaturation": 30,
    "demonstrationConfidence": 0.9,
    "elevationM": 720,
    "normalizedScores": {
      "rainfall": 12,
      "slope": 10,
      "wetness": 30,
      "historicalActivity": 20,
      "landCover": 20,
      "elevation": 15
    }
  },
  {
    "id": "durtlang-north-plateau",
    "location": "Durtlang North Broad Ridge",
    "ward": "Northern Outer Sector",
    "latitude": 23.782,
    "longitude": 92.732,
    "riskScore": 16,
    "riskLevel": "LOW",
    "estimatedRisk": "Low hazard on broad structural ridge crest",
    "modelConfidence": 0.88,
    "mainRiskFactors": [
      "Broad summit plateau with minimal terrain relief",
      "Intact sandstone caprock formation",
      "Well-drained surface runoff characteristics",
      "Dense protective native vegetative cover"
    ],
    "lastUpdated": "14:20 IST (DEMO DATA)",
    "targetLocationId": "durtlang-leitan",
    "factorOfSafety": 1.92,
    "slopeDeg": 5.5,
    "rainfall24hMm": 16.8,
    "soilSaturation": 20,
    "demonstrationConfidence": 0.88,
    "elevationM": 720,
    "normalizedScores": {
      "rainfall": 12,
      "slope": 10,
      "wetness": 20,
      "historicalActivity": 20,
      "landCover": 20,
      "elevation": 15
    }
  }
];
