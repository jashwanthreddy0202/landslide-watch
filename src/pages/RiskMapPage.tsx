import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Layers,
  Search,
  Compass,
  Crosshair,
  MapPin,
  Activity,
  LifeBuoy,
  Radio,
  CloudRain,
  Maximize2,
  Minimize2,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { LocationRisk } from '../types';
import { MapControls } from '../components/MapControls';
import { RiskLegend } from '../components/RiskLegend';
import { RiskBadge } from '../components/RiskBadge';
import {
  DEMONSTRATION_RISK_POINTS,
  DemonstrationRiskPoint,
} from '../data/demonstrationRiskPoints';
import {
  fetchDemonstrationRiskPoints,
  fetchDemonstrationRisk,
} from '../services/riskService';
import { DemonstrationRiskAssessment, DemonstrationScenarioId } from '../types';
import { deriveDemonstrationAlertState } from '../data/demonstrationScenarios';

interface RiskMapPageProps {
  locations: LocationRisk[];
  selectedLocationId?: string;
  onSelectLocation: (id: string) => void;
  onOpenEvacuationProtocol: () => void;
}

// Aizawl Center Coordinates
const AIZAWL_CENTER: [number, number] = [23.7307, 92.7173];
const DEFAULT_ZOOM = 13;

const getBaseMapConfig = (style: 'dark' | 'street' | 'topo', apiKey?: string) => {
  if (style === 'street') {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
    };
  }
  if (style === 'topo') {
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      subdomains: '',
    };
  }
  const cartoApiKey =
    apiKey ||
    import.meta.env.VITE_CARTO_API_KEY ||
    '';

  const cartoUrl = cartoApiKey
    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey)}`
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return {
    url: cartoUrl,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
  };
};

// Helper to resolve hotspot from alert location, ID, or search query
// Helper to resolve hotspot from alert location, ID, slug, or search query
export const findHotspot = (rawQuery?: string, hotspotList: DemonstrationRiskPoint[] = DEMONSTRATION_RISK_POINTS): DemonstrationRiskPoint | null => {
  if (!rawQuery) return null;
  let query = rawQuery.trim();
  try {
    query = decodeURIComponent(query).trim();
  } catch {
    // fallback if query is malformed
  }
  if (!query) return null;

  const clean = query.toLowerCase().trim();
  const norm = clean.replace(/[-_]/g, ' ');

  // 1. Direct ID match or targetLocationId match
  let match = hotspotList.find(
    (p) => p.id.toLowerCase() === clean || p.targetLocationId.toLowerCase() === clean
  );
  if (match) return match;

  // 2. Normalized ID match (e.g. "thuampui-bypass" vs "thuampui bypass")
  match = hotspotList.find(
    (p) => p.id.toLowerCase().replace(/[-_]/g, ' ') === norm
  );
  if (match) return match;

  // 3. Exact location name match
  match = hotspotList.find(
    (p) => p.location.toLowerCase() === clean || p.location.toLowerCase() === norm
  );
  if (match) return match;

  // 4. Leading word / location prefix match (e.g. "thuampui" -> "Thuampui & Zemabawk Bypass")
  const words = norm.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
  for (const w of words) {
    match = hotspotList.find((p) => {
      const pWords = p.location.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
      const idWords = p.id.toLowerCase().split(/[-_]/);
      return pWords.includes(w) || idWords.includes(w);
    });
    if (match) return match;
  }

  // 5. Substring match
  match = hotspotList.find(
    (p) => p.location.toLowerCase().includes(clean) || clean.includes(p.location.toLowerCase())
  );
  if (match) return match;

  match = hotspotList.find(
    (p) => p.location.toLowerCase().includes(norm) || norm.includes(p.location.toLowerCase())
  );
  if (match) return match;

  return null;
};

export const RiskMapPage: React.FC<RiskMapPageProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onOpenEvacuationProtocol,
}) => {
  // Audited Phase 1 Risk Engine state (single source of truth)
  const [points, setPoints] = useState<DemonstrationRiskPoint[]>(DEMONSTRATION_RISK_POINTS);
  const [activeAssessment, setActiveAssessment] = useState<DemonstrationRiskAssessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState<boolean>(false);

  // Active selected demonstration risk point
  const [selectedPointId, setSelectedPointId] = useState<string>(() => {
    const matched = findHotspot(selectedLocationId);
    return matched ? matched.id : DEMONSTRATION_RISK_POINTS[0].id;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomDisplay, setZoomDisplay] = useState(DEFAULT_ZOOM);

  // My Location State
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Unknown location banner state
  const [notFoundNotice, setNotFoundNotice] = useState<string | null>(() => {
    if (selectedLocationId && !findHotspot(selectedLocationId)) {
      return `Location "${selectedLocationId}" not found in monitored demonstration hotspots. Showing Aizawl Ridge overview.`;
    }
    return null;
  });

  // Demonstration Scenario state (interactive SIH environmental simulation)
  const [activeScenarioId, setActiveScenarioId] = useState<DemonstrationScenarioId | null>(null);
  const [simulatedFactors, setSimulatedFactors] = useState<{ rainfall?: number; wetness?: number }>({});
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  // Request cancellation and sequence tracking to prevent race conditions and stale overwrites
  const recalculateAbortControllerRef = useRef<AbortController | null>(null);
  const recalculateRequestIdRef = useRef<number>(0);

  // Unified single-source-of-truth risk recalculation function
  const recalculateMapRisk = useCallback(
    async (
      scenarioId?: DemonstrationScenarioId | null,
      factors?: { rainfall?: number; wetness?: number }
    ) => {
      // Cancel prior in-flight calculation
      if (recalculateAbortControllerRef.current) {
        recalculateAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      recalculateAbortControllerRef.current = abortController;
      const currentRequestId = ++recalculateRequestIdRef.current;

      setScenarioLoading(true);
      setScenarioError(null);
      try {
        const effectiveScenario = scenarioId !== undefined ? scenarioId : activeScenarioId;
        const effectiveRainfall = factors?.rainfall !== undefined ? factors.rainfall : simulatedFactors.rainfall;
        const effectiveWetness = factors?.wetness !== undefined ? factors.wetness : simulatedFactors.wetness;

        const opts = {
          scenarioId: effectiveScenario,
          rainfall: effectiveRainfall,
          wetness: effectiveWetness,
          signal: abortController.signal,
        };

        const [loadedPoints, assessment] = await Promise.all([
          fetchDemonstrationRiskPoints(opts),
          fetchDemonstrationRisk(selectedPointId, opts),
        ]);

        if (currentRequestId !== recalculateRequestIdRef.current) {
          // Stale response superseded by newer user action
          return;
        }

        if (Array.isArray(loadedPoints) && loadedPoints.length > 0) {
          setPoints(loadedPoints);
        }

        if (assessment) {
          setActiveAssessment(assessment);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to recalculate demonstration risk points:', err);
        setScenarioError('Failed to recalculate demonstration risk with audited engine. Retaining previous assessment.');
      } finally {
        if (currentRequestId === recalculateRequestIdRef.current) {
          setScenarioLoading(false);
        }
      }
    },
    [activeScenarioId, simulatedFactors, selectedPointId]
  );

  // Initial fetch or fetch on selectedPointId change
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    setAssessmentLoading(true);

    fetchDemonstrationRisk(selectedPointId, {
      scenarioId: activeScenarioId,
      rainfall: simulatedFactors.rainfall,
      wetness: simulatedFactors.wetness,
      signal: abortController.signal,
    })
      .then((assessment) => {
        if (isMounted) {
          if (assessment) {
            setActiveAssessment(assessment);
          }
          setAssessmentLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Failed to calculate demonstration risk for point:', err);
        if (isMounted) {
          setAssessmentLoading(false);
        }
      });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [selectedPointId, activeScenarioId, simulatedFactors.rainfall, simulatedFactors.wetness]);

  const handleSelectScenario = async (scenarioId: DemonstrationScenarioId) => {
    setActiveScenarioId(scenarioId);
    await recalculateMapRisk(scenarioId, simulatedFactors);
  };

  const handleResetScenario = async () => {
    setActiveScenarioId(null);
    setSimulatedFactors({ rainfall: 15, wetness: 30 });
    await recalculateMapRisk(null, { rainfall: 15, wetness: 30 });
  };

  const handleChangeFactors = async (factors: { rainfall: number; wetness: number }) => {
    setSimulatedFactors(factors);
    await recalculateMapRisk(activeScenarioId, factors);
  };

  // Layer Controls State
  const [layers, setLayers] = useState({
    heatmap: true,
    nodes: true,
    baseMap: 'dark' as 'dark' | 'street' | 'topo',
    rainRadar: true,
    shelters: true,
  });

  // CARTO Basemap API Key state
  const [cartoApiKey, setCartoApiKey] = useState<string>(
    () => import.meta.env.VITE_CARTO_API_KEY || ''
  );

  useEffect(() => {
    if (!cartoApiKey) {
      fetch('/api/config/basemap')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.cartoApiKey) {
            setCartoApiKey(data.cartoApiKey);
          }
        })
        .catch(() => {});
    }
  }, [cartoApiKey]);

  // DOM Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const sheltersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const isInitialMount = useRef(true);

  // Active point object synced with audited Phase 1 risk engine
  const activePoint = useMemo(() => {
    const base =
      points.find((p) => p.id === selectedPointId) ||
      points[0] ||
      DEMONSTRATION_RISK_POINTS[0];

    if (!activeAssessment) return base;

    return {
      ...base,
      riskScore: activeAssessment.riskScore,
      riskLevel: activeAssessment.riskLevel,
      demonstrationConfidence: activeAssessment.demonstrationConfidence,
      modelConfidence: activeAssessment.demonstrationConfidence,
      lastUpdated: activeAssessment.lastUpdated,
      formulaDescription: activeAssessment.formulaDescription,
      calculationMethod: activeAssessment.calculationMethod,
    };
  }, [points, selectedPointId, activeAssessment]);

  // Derived demonstration alert state based on backend risk score and level
  const activeAlertState = useMemo(() => {
    return (
      activeAssessment?.alertState ||
      deriveDemonstrationAlertState(activePoint.riskScore, activePoint.riskLevel)
    );
  }, [activeAssessment, activePoint.riskScore, activePoint.riskLevel]);

  // Associated detailed location from locations list (if available)
  const activeLocationDetail = useMemo(() => {
    return (
      locations.find((l) => l.id === activePoint.targetLocationId) ||
      locations[0]
    );
  }, [locations, activePoint.targetLocationId]);

  // Filtered demonstration points
  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        point.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.ward.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedRiskFilter === 'ALL' ||
        point.riskLevel.toUpperCase() === selectedRiskFilter.toUpperCase();

      return matchesSearch && matchesFilter;
    });
  }, [points, searchQuery, selectedRiskFilter]);

  // Focus on specified demonstration location if provided (e.g. from View Affected Area or direct URL)
  useEffect(() => {
    if (!selectedLocationId) {
      setNotFoundNotice(null);
      return;
    }
    const matched = findHotspot(selectedLocationId);

    if (matched) {
      setNotFoundNotice(null);
      setSelectedPointId(matched.id);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([matched.latitude, matched.longitude], 15, {
          duration: 1.0,
        });
      }
      setTimeout(() => {
        const panel = document.getElementById('risk-details-panel');
        if (panel && window.innerWidth < 1024) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    } else {
      // Unknown location provided in URL
      setNotFoundNotice(
        `Location "${selectedLocationId}" not found in monitored demonstration hotspots. Showing Aizawl Ridge overview.`
      );
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(AIZAWL_CENTER, DEFAULT_ZOOM);
      }
    }
  }, [selectedLocationId]);

  // Canvas Heatmap Drawing Routine (Smooth Continuous Heatmap, No Grid Cells)
  const renderHeatmap = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas || !mapContainerRef.current) return;

    try {
      const container = map.getContainer();
      if (!container) return;

      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size.x, size.y);

      // If Doppler rain radar is enabled, draw soft precipitation atmosphere
      if (layers.rainRadar) {
        const rainGrad = ctx.createRadialGradient(
          size.x * 0.45,
          size.y * 0.4,
          size.x * 0.1,
          size.x * 0.45,
          size.y * 0.4,
          size.x * 0.75
        );
        rainGrad.addColorStop(0, 'rgba(2, 132, 199, 0.16)');
        rainGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.08)');
        rainGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        ctx.fillStyle = rainGrad;
        ctx.fillRect(0, 0, size.x, size.y);
      }

      // If heatmap layer is disabled, finish after rain overlay
      if (!layers.heatmap) {
        ctx.restore();
        return;
      }

      const currentZoom = map.getZoom();
      // Dynamically scale blur radius with zoom level to maintain smooth geographic coverage
      const baseRadius = Math.round(
        Math.max(45, Math.min(180, 52 * Math.pow(1.24, currentZoom - 12)))
      );

      // Draw each demonstration hotspot with continuous radial gradient
      // yellow = moderate, orange = high, red = very high
      // low-risk areas have little or no overlay
      points.forEach((pt) => {
        // If user filtered by severity, respect it on heatmap as well
        if (
          selectedRiskFilter !== 'ALL' &&
          pt.riskLevel.toUpperCase() !== selectedRiskFilter.toUpperCase()
        ) {
          return;
        }

        const screenPt = map.latLngToContainerPoint([pt.latitude, pt.longitude]);
        if (
          screenPt.x < -baseRadius * 1.5 ||
          screenPt.x > size.x + baseRadius * 1.5 ||
          screenPt.y < -baseRadius * 1.5 ||
          screenPt.y > size.y + baseRadius * 1.5
        ) {
          return;
        }

        const grad = ctx.createRadialGradient(
          screenPt.x,
          screenPt.y,
          0,
          screenPt.x,
          screenPt.y,
          baseRadius
        );

        if (pt.riskLevel === 'VERY HIGH') {
          // Red - very high
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.72)');
          grad.addColorStop(0.32, 'rgba(239, 68, 68, 0.50)');
          grad.addColorStop(0.64, 'rgba(249, 115, 22, 0.28)');
          grad.addColorStop(0.85, 'rgba(234, 179, 8, 0.10)');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        } else if (pt.riskLevel === 'HIGH') {
          // Orange - high
          grad.addColorStop(0, 'rgba(249, 115, 22, 0.65)');
          grad.addColorStop(0.38, 'rgba(249, 115, 22, 0.40)');
          grad.addColorStop(0.72, 'rgba(234, 179, 8, 0.18)');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        } else if (pt.riskLevel === 'MODERATE') {
          // Yellow - moderate
          grad.addColorStop(0, 'rgba(234, 179, 8, 0.54)');
          grad.addColorStop(0.48, 'rgba(234, 179, 8, 0.24)');
          grad.addColorStop(0.82, 'rgba(234, 179, 8, 0.06)');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        } else {
          // Low risk: little or no overlay
          grad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
          grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.02)');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        }

        ctx.beginPath();
        ctx.arc(screenPt.x, screenPt.y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      ctx.restore();
    } catch {
      // Map may be unmounting or resizing
    }
  }, [layers.heatmap, layers.rainRadar, selectedRiskFilter, points]);

  // Ref to current renderHeatmap to avoid re-initializing the Leaflet map on layer changes
  const renderHeatmapRef = useRef<() => void>(() => {});
  useEffect(() => {
    renderHeatmapRef.current = renderHeatmap;
  }, [renderHeatmap]);

  // Re-render continuous canvas heatmap whenever points change dynamically
  useEffect(() => {
    if (mapInstanceRef.current && canvasRef.current) {
      renderHeatmap();
    }
  }, [points, renderHeatmap]);

  // Initialize Leaflet Map (Runs once on mount)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    // Safety check: clean up any stale _leaflet_id to avoid Leaflet container re-init error
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const initialMatched = findHotspot(selectedLocationId);
    const initialCenter: [number, number] = initialMatched
      ? [initialMatched.latitude, initialMatched.longitude]
      : AIZAWL_CENTER;
    const initialZoom = initialMatched ? 15 : DEFAULT_ZOOM;

    // Create Map Instance
    const map = L.map(container, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
    });
    mapInstanceRef.current = map;

    // Initial Base Tile Layer
    const config = getBaseMapConfig(layers.baseMap, cartoApiKey);
    const baseLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = baseLayer;

    // Create Leaflet layer groups
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    const sheltersGroup = L.layerGroup().addTo(map);
    sheltersLayerRef.current = sheltersGroup;

    // Attach Canvas for Smooth Continuous Heatmap directly to map container
    const mapDomContainer = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.className = 'leaflet-heatmap-canvas';
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '350';
    canvas.style.opacity = '0.82';
    mapDomContainer.appendChild(canvas);
    canvasRef.current = canvas;

    // Map Event Listeners
    const onMapChange = () => {
      renderHeatmapRef.current();
      if (mapInstanceRef.current) {
        setZoomDisplay(mapInstanceRef.current.getZoom());
      }
    };

    map.on('move', onMapChange);
    map.on('moveend', onMapChange);
    map.on('zoom', onMapChange);
    map.on('zoomend', onMapChange);
    map.on('resize', onMapChange);
    map.on('viewreset', onMapChange);

    // Initial render
    const timerId = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        renderHeatmapRef.current();
      }
    }, 100);

    return () => {
      clearTimeout(timerId);
      map.off('move', onMapChange);
      map.off('moveend', onMapChange);
      map.off('zoom', onMapChange);
      map.off('zoomend', onMapChange);
      map.off('resize', onMapChange);
      map.off('viewreset', onMapChange);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvasRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      sheltersLayerRef.current = null;
      tileLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Handle Base Map Switching
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = getBaseMapConfig(layers.baseMap, cartoApiKey);
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newLayer;

    renderHeatmap();
  }, [layers.baseMap, cartoApiKey, renderHeatmap]);

  // Update Heatmap when layers change
  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  // Update Hotspot Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (!layers.nodes) return;

    filteredPoints.forEach((point) => {
      const isSelected = point.id === selectedPointId;

      const badgeColor =
        point.riskLevel === 'VERY HIGH'
          ? 'bg-red-500 text-white'
          : point.riskLevel === 'HIGH'
          ? 'bg-orange-500 text-white'
          : point.riskLevel === 'MODERATE'
          ? 'bg-yellow-400 text-slate-950'
          : 'bg-emerald-400 text-slate-950';

      const pingColor =
        point.riskLevel === 'VERY HIGH'
          ? 'bg-red-500'
          : point.riskLevel === 'HIGH'
          ? 'bg-orange-500'
          : point.riskLevel === 'MODERATE'
          ? 'bg-yellow-400'
          : 'bg-emerald-400';

      const html = `
        <div class="group relative flex flex-col items-center cursor-pointer -translate-x-1/2 -translate-y-1/2">
          <div class="relative flex items-center justify-center">
            ${
              point.riskLevel === 'VERY HIGH' || point.riskLevel === 'HIGH'
                ? `<span class="absolute h-8 w-8 animate-ping rounded-full ${pingColor} opacity-50 pointer-events-none"></span>`
                : ''
            }
            <div class="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-black/90 shadow-xl font-mono text-[10px] font-black transition-transform duration-150 hover:scale-125 ${badgeColor} ${
        isSelected ? 'ring-4 ring-cyan-300 ring-offset-2 ring-offset-black scale-125' : ''
      }">
              ${point.riskScore}
            </div>
          </div>
          <div class="mt-1 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-md transition ${
            isSelected
              ? 'bg-cyan-950 text-cyan-200 ring-1 ring-cyan-400'
              : 'bg-black/85 text-slate-200 group-hover:text-white'
          }">
            ${point.location.split(' ')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-risk-node',
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([point.latitude, point.longitude], {
        icon: customIcon,
        title: `${point.location} (${point.riskLevel}) - ${point.riskScore}/100`,
      });

      const popupHtml = `
        <div class="p-2.5 font-sans text-xs bg-slate-950 text-slate-100 rounded-xl border border-cyan-500/50 shadow-2xl min-w-[200px]">
          <div class="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">${point.ward}</div>
          <div class="font-bold text-white text-sm mt-0.5">${point.location}</div>
          <div class="flex items-center gap-2 mt-1.5 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white ${
              point.riskLevel === 'VERY HIGH'
                ? 'bg-red-600'
                : point.riskLevel === 'HIGH'
                ? 'bg-orange-600'
                : 'bg-yellow-500 text-slate-950'
            }">${point.riskLevel}</span>
            <span class="font-mono text-xs text-cyan-300 font-bold">Score ${point.riskScore}/100</span>
          </div>
          <div class="text-[11px] text-slate-300 leading-snug">${point.estimatedRisk}</div>
          <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>FoS: ${typeof point.factorOfSafety === 'number' ? point.factorOfSafety.toFixed(2) : '1.45'}</span>
            <span class="text-cyan-400 font-bold">Details Active</span>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -14] });

      if (isSelected) {
        setTimeout(() => {
          if (mapInstanceRef.current && markersGroup && markersGroup.hasLayer(marker)) {
            marker.openPopup();
          }
        }, 250);
      }

      marker.on('click', () => {
        setSelectedPointId(point.id);
        setNotFoundNotice(null);
        map.panTo([point.latitude, point.longitude], { animate: true });
        marker.openPopup();
        window.history.replaceState(
          { page: 'risk-map', location: point.id },
          '',
          `/risk-map?location=${encodeURIComponent(point.id)}`
        );
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredPoints, selectedPointId, layers.nodes]);

  // Update Safe Shelters Layer on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const sheltersGroup = sheltersLayerRef.current;
    if (!map || !sheltersGroup) return;

    sheltersGroup.clearLayers();

    if (!layers.shelters) return;

    locations.forEach((loc) => {
      // Offset slightly to place shelter adjacent to location
      const shelterLat = loc.coordinates.lat + 0.0018;
      const shelterLng = loc.coordinates.lng + 0.0022;

      const html = `
        <div class="flex flex-col items-center cursor-pointer -translate-x-1/2 -translate-y-1/2" title="Shelter: ${loc.evacuation.name}">
          <div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-black text-slate-950 shadow-lg">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        </div>
      `;

      const shelterIcon = L.divIcon({
        className: 'shelter-icon',
        html,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([shelterLat, shelterLng], { icon: shelterIcon });
      marker.bindPopup(`
        <div class="p-3 text-xs bg-slate-950 text-slate-100 rounded-lg border border-emerald-500/30">
          <div class="text-[10px] font-mono font-bold text-emerald-400 uppercase">Designated Safe Shelter</div>
          <div class="font-bold text-white text-sm mt-0.5">${loc.evacuation.name}</div>
          <div class="text-[11px] text-slate-300 mt-1">${loc.evacuation.safeCorridor}</div>
          <div class="mt-2 text-[10px] text-slate-400">Capacity: ${loc.evacuation.capacity} | Contact: ${loc.evacuation.contact}</div>
        </div>
      `);

      sheltersGroup.addLayer(marker);
    });
  }, [locations, layers.shelters]);

  // Zoom handlers for custom MapControls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(AIZAWL_CENTER, DEFAULT_ZOOM, {
        animate: true,
      });
    }
    setNotFoundNotice(null);
    setSelectedPointId(points[0]?.id || DEMONSTRATION_RISK_POINTS[0].id);
    window.history.replaceState({ page: 'risk-map' }, '', '/risk-map');
  };

  // Fly to specific hotspot
  const handleSelectHotspot = (point: DemonstrationRiskPoint) => {
    setSelectedPointId(point.id);
    setSearchQuery('');
    setIsSearchOpen(false);
    setNotFoundNotice(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([point.latitude, point.longitude], 15, {
        duration: 0.9,
      });
    }
    window.history.replaceState(
      { page: 'risk-map', location: point.id },
      '',
      `/risk-map?location=${encodeURIComponent(point.id)}`
    );
  };

  // "My Location" Handler
  const handleMyLocation = () => {
    setLocatingUser(true);
    setLocationNotice('Acquiring device geolocation coordinates...');

    if (!('geolocation' in navigator)) {
      setLocatingUser(false);
      setLocationNotice('Geolocation not supported on this device. Showing Aizawl center.');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(AIZAWL_CENTER, DEFAULT_ZOOM);
      }
      setTimeout(() => setLocationNotice(null), 4000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingUser(false);
        const { latitude, longitude } = position.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        // Add or update User Marker
        if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
          map.removeLayer(userMarkerRef.current);
        }

        const userHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <span class="absolute h-8 w-8 animate-ping rounded-full bg-cyan-400 opacity-60"></span>
            <div class="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 border-2 border-white shadow-xl">
              <div class="h-2 w-2 rounded-full bg-white"></div>
            </div>
          </div>
        `;
        const userIcon = L.divIcon({
          className: 'user-loc-icon',
          html: userHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup(
            '<div class="p-2 text-xs font-bold text-white bg-slate-900 rounded">📍 You Are Here</div>'
          )
          .openPopup();
        userMarkerRef.current = marker;

        // Calculate nearest Aizawl demonstration hotspot
        let nearest = points[0] || DEMONSTRATION_RISK_POINTS[0];
        let minDist = Infinity;
        points.forEach((pt) => {
          const d = Math.hypot(pt.latitude - latitude, pt.longitude - longitude);
          if (d < minDist) {
            minDist = d;
            nearest = pt;
          }
        });

        // Approximate distance in km (1 deg lat ~ 111km)
        const approxDistKm = Math.round(minDist * 111);

        if (approxDistKm > 60) {
          setLocationNotice(
            `Device located at [${latitude.toFixed(2)}°N, ${longitude.toFixed(
              2
            )}°E]. Nearest monitored zone is ${nearest.location} (~${approxDistKm} km away). Centering on Aizawl Watch corridor.`
          );
          map.flyTo(AIZAWL_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
        } else {
          setLocationNotice(
            `Position acquired! Nearest monitored landslide hotspot: ${nearest.location} (~${approxDistKm} km away).`
          );
          map.flyTo([latitude, longitude], 15, { duration: 1.2 });
          setSelectedPointId(nearest.id);
        }

        setTimeout(() => setLocationNotice(null), 6000);
      },
      (err) => {
        setLocatingUser(false);
        console.warn('Geolocation failed or blocked:', err.message);
        setLocationNotice(
          'Geolocation unavailable or permission denied in preview container. Centered on Aizawl Central Ridge.'
        );
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(AIZAWL_CENTER, DEFAULT_ZOOM);
        }
        setTimeout(() => setLocationNotice(null), 5000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div
      className={`flex flex-col bg-[#050811] ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : 'min-h-[calc(100vh-60px)]'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-md">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Chakra_Petch'] text-base sm:text-lg font-bold text-white">
                  Interactive GIS Slope Risk Map
                </h1>
                <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/40">
                  DEMONSTRATION DATA
                </span>
                <span className="hidden sm:inline-block rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-800/40">
                  Aizawl Ridge GIS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Continuous Gaussian Heatmap • Geographic Aizawl Coordinates • 18 Monitored Hotspots
              </p>
            </div>
          </div>

          {/* Search, My Location, and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Locality Input with Auto-complete */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="search-locality-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search Locality or Ward..."
                className="w-44 sm:w-60 rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />

              {/* Suggestions Dropdown */}
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-md">
                  {filteredPoints.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching demonstration localities found
                    </div>
                  ) : (
                    filteredPoints.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => handleSelectHotspot(pt)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-slate-900"
                      >
                        <div>
                          <div className="font-semibold text-white">{pt.location}</div>
                          <div className="text-[10px] text-slate-400">{pt.ward}</div>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                            pt.riskLevel === 'VERY HIGH'
                              ? 'bg-red-950 text-red-300 border border-red-800/40'
                              : pt.riskLevel === 'HIGH'
                              ? 'bg-orange-950 text-orange-300 border border-orange-800/40'
                              : pt.riskLevel === 'MODERATE'
                              ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/40'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                          }`}
                        >
                          {pt.riskLevel}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* My Location Button */}
            <button
              id="my-location-btn"
              onClick={handleMyLocation}
              disabled={locatingUser}
              className={`flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold transition ${
                locatingUser
                  ? 'text-cyan-400 animate-pulse'
                  : 'text-slate-300 hover:text-white hover:border-cyan-600'
              }`}
              title="Locate My Position in Aizawl"
            >
              <Crosshair className={`h-3.5 w-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">My Location</span>
            </button>

            {/* Severity Filter */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              {['ALL', 'VERY HIGH', 'HIGH', 'MODERATE', 'LOW'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedRiskFilter(level)}
                  className={`rounded-md px-2 py-1 text-[10px] sm:text-[11px] font-semibold transition ${
                    selectedRiskFilter === level
                      ? level === 'VERY HIGH'
                        ? 'bg-red-600 text-white'
                        : level === 'HIGH'
                        ? 'bg-orange-600 text-white'
                        : level === 'MODERATE'
                        ? 'bg-yellow-600 text-slate-950'
                        : level === 'LOW'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {level === 'VERY HIGH' ? 'V. HIGH' : level}
                </button>
              ))}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation Notice Banner */}
      {locationNotice && (
        <div className="bg-cyan-950/90 border-b border-cyan-800/60 px-4 py-2 text-xs text-cyan-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{locationNotice}</span>
          </div>
          <button
            onClick={() => setLocationNotice(null)}
            className="text-[10px] text-cyan-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unknown Location Not Found Banner */}
      {notFoundNotice && (
        <div className="bg-amber-950/90 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{notFoundNotice}</span>
          </div>
          <button
            onClick={() => setNotFoundNotice(null)}
            className="text-[10px] text-amber-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Map Workspace */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Interactive Map Area */}
        <div
          id="interactive-risk-map-canvas"
          className="relative flex-1 bg-[#050811] overflow-hidden min-h-[520px] lg:min-h-[660px]"
          onClick={() => setIsSearchOpen(false)}
        >
          {/* Real Leaflet Map Container */}
          <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

          {/* Floating Layer Controls (Top Left) */}
          <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/90 p-2 shadow-xl backdrop-blur-md text-[11px] pointer-events-auto max-w-[calc(100%-120px)] sm:max-w-none">
            <span className="flex items-center gap-1 px-1.5 font-bold text-slate-400 uppercase text-[10px]">
              <Layers className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">Layers:</span>
            </span>

            {/* Continuous Heatmap Toggle */}
            <button
              onClick={() => setLayers((prev) => ({ ...prev, heatmap: !prev.heatmap }))}
              className={`rounded-lg px-2 py-1 font-semibold transition ${
                layers.heatmap
                  ? 'bg-red-950 text-red-300 border border-red-800/50'
                  : 'bg-slate-900 text-slate-500'
              }`}
              title="Continuous Gaussian Risk Heatmap"
            >
              Heatmap: {layers.heatmap ? 'ON' : 'OFF'}
            </button>

            {/* Hotspot Nodes Toggle */}
            <button
              onClick={() => setLayers((prev) => ({ ...prev, nodes: !prev.nodes }))}
              className={`rounded-lg px-2 py-1 font-semibold transition ${
                layers.nodes
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                  : 'bg-slate-900 text-slate-500'
              }`}
              title="Hotspot Sensor Nodes"
            >
              Pins: {layers.nodes ? 'ON' : 'OFF'}
            </button>

            {/* Doppler Rain Radar Toggle */}
            <button
              onClick={() => setLayers((prev) => ({ ...prev, rainRadar: !prev.rainRadar }))}
              className={`rounded-lg px-2 py-1 font-semibold transition ${
                layers.rainRadar
                  ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                  : 'bg-slate-900 text-slate-500'
              }`}
              title="Doppler Precipitation Radar"
            >
              Radar: {layers.rainRadar ? 'ON' : 'OFF'}
            </button>

            {/* Safe Shelters Toggle */}
            <button
              onClick={() => setLayers((prev) => ({ ...prev, shelters: !prev.shelters }))}
              className={`rounded-lg px-2 py-1 font-semibold transition ${
                layers.shelters
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  : 'bg-slate-900 text-slate-500'
              }`}
              title="Designated Evacuation Shelters"
            >
              Shelters
            </button>

            {/* Basemap Style Switcher */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 ml-0.5">
              <span className="text-[10px] text-slate-500 hidden sm:inline">Base:</span>
              <button
                onClick={() =>
                  setLayers((prev) => ({
                    ...prev,
                    baseMap:
                      prev.baseMap === 'dark'
                        ? 'street'
                        : prev.baseMap === 'street'
                        ? 'topo'
                        : 'dark',
                  }))
                }
                className="rounded-lg bg-slate-900 px-2 py-1 font-mono font-bold text-slate-300 hover:text-white border border-slate-800"
                title="Cycle Base Map Style"
              >
                {layers.baseMap === 'dark'
                  ? 'Tactical Dark'
                  : layers.baseMap === 'street'
                  ? 'OSM Streets'
                  : 'Topographic'}
              </button>
            </div>
          </div>

          {/* Floating Zoom & Recenter Controls (Top Right) */}
          <MapControls
            zoom={zoomDisplay / 13}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            className="absolute right-3 top-3 z-20"
          />

          {/* Bottom Coordinates & Scale Bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/90 px-3.5 py-2 text-[11px] text-slate-400 backdrop-blur-md pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="font-mono text-cyan-300 font-bold">
                INSPECTING: {activePoint.location.toUpperCase()}
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="font-mono hidden sm:inline text-slate-300">
                LAT: {activePoint.latitude != null ? activePoint.latitude.toFixed(4) : '23.7300'}°N &nbsp; LON:{' '}
                {activePoint.longitude != null ? activePoint.longitude.toFixed(4) : '92.7173'}°E
              </span>
            </div>

            <RiskLegend compact />
          </div>
        </div>

        {/* Right Floating Inspection Drawer / Risk Details Panel */}
        <div
          id="risk-details-panel"
          className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-950/95 p-5 overflow-y-auto flex flex-col justify-between max-h-[800px] lg:max-h-none"
        >
          <div>
            {/* Header: Location & Risk Level */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                    RISK DETAILS • {activePoint.ward}
                  </span>
                </div>
                <h2 className="font-['Chakra_Petch'] text-lg font-bold text-white">
                  {activePoint.location}
                </h2>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-mono font-bold uppercase ${
                    activePoint.riskLevel === 'VERY HIGH'
                      ? 'bg-red-950 text-red-300 border border-red-800/50 animate-pulse'
                      : activePoint.riskLevel === 'HIGH'
                      ? 'bg-orange-950 text-orange-300 border border-orange-800/50'
                      : activePoint.riskLevel === 'MODERATE'
                      ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/50'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  }`}
                >
                  {activePoint.riskLevel}
                </span>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                  Score {activePoint.riskScore} / 100
                </div>
              </div>
            </div>

            {/* Demonstration Notice */}
            <div className="mt-3 rounded-xl bg-amber-950/30 border border-amber-800/40 p-3 text-[11px] text-amber-200/90 space-y-1">
              <div className="flex items-center gap-1.5 font-mono font-bold text-[10px] text-amber-300">
                <span className="rounded bg-amber-900/60 px-1.5 py-0.5 border border-amber-700/50">
                  DEMONSTRATION DATA
                </span>
                <span>Prototype Mode</span>
              </div>
              <p className="text-[10px] text-amber-200/80 leading-relaxed">
                Risk values shown are simulated for prototype demonstration and do not represent live environmental measurements.
              </p>
            </div>

            {/* Estimated Risk Status Card */}
            <div className="mt-3.5 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hazard Evaluation
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                  {Math.round((activePoint.demonstrationConfidence ?? activePoint.modelConfidence) * 100)}% Confidence
                </span>
              </div>
              <div className="font-['Chakra_Petch'] text-sm font-bold text-white leading-snug">
                {activePoint.estimatedRisk}
              </div>
            </div>

            {/* Why is this area at risk? */}
            <div className="mt-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-['Chakra_Petch'] font-bold text-white tracking-wide">
                  Why is this area at risk?
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {activePoint.mainRiskFactors.length} Key Triggers
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activePoint.mainRiskFactors.map((factor, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5 text-[11px] leading-relaxed"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                        activePoint.riskLevel === 'VERY HIGH'
                          ? 'bg-red-400'
                          : activePoint.riskLevel === 'HIGH'
                          ? 'bg-orange-400'
                          : activePoint.riskLevel === 'MODERATE'
                          ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-slate-200 font-medium">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Public Safety / Active Alert Banner */}
            {activeAlertState && (
              <div
                className={`mt-3.5 rounded-xl border p-3 text-xs space-y-1.5 ${
                  activeAlertState.thresholdCrossed
                    ? activeAlertState.alertLevel === 'VERY HIGH'
                      ? 'border-red-800/80 bg-red-950/40 text-red-200'
                      : 'border-orange-800/80 bg-orange-950/40 text-orange-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="font-['Chakra_Petch'] uppercase tracking-wider text-[11px]">
                      Alert Status: {activeAlertState.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {activeAlertState.thresholdCrossed && (
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white uppercase animate-pulse">
                      Action Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  <strong className="text-white">Safety Directive:</strong> {activeAlertState.recommendedAction}
                </p>
              </div>
            )}

            {/* Designated Evacuation Corridor */}
            {activeLocationDetail?.evacuation && (
              <div className="mt-3.5 rounded-xl border border-cyan-900/30 bg-cyan-950/20 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <LifeBuoy className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Shelter: {activeLocationDetail.evacuation.name}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  {activeLocationDetail.evacuation.safeCorridor}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                  <span>~{activeLocationDetail.evacuation.distanceMeters}m safe corridor</span>
                  <button
                    onClick={onOpenEvacuationProtocol}
                    className="font-bold underline hover:text-cyan-200"
                  >
                    Evacuation Guide →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTA: View Location Details */}
          <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
            <button
              id="view-location-details-btn"
              onClick={() => onSelectLocation(activePoint.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-cyan-500 active:scale-[0.98]"
            >
              <span>View Location Details</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-center text-[10px] text-slate-500">
              Inspect inclinometers, boreholes, and geotechnical slope curves
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
