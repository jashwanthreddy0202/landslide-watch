import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Footer } from './components/Footer';
import { EvacuationProtocolModal } from './components/EvacuationProtocolModal';
import { FissureReportModal } from './components/FissureReportModal';
import { HomePage } from './pages/HomePage';
import { RiskMapPage } from './pages/RiskMapPage';
import { LocationDetailsPage } from './pages/LocationDetailsPage';
import { AlertsPage } from './pages/AlertsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { CityHazardOverview, LocationRisk, PublicAlert, SimulationScenario } from './types';
import {
  fetchCityOverview,
  fetchLocations,
  fetchAlerts,
  fetchScenarios,
  applySimulationScenario,
} from './services/api';

export function App() {
  // Page routing state
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('thuampui-bypass');

  // Modals
  const [evacuationModalOpen, setEvacuationModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Application Data State
  const [overview, setOverview] = useState<CityHazardOverview | null>(null);
  const [locations, setLocations] = useState<LocationRisk[]>([]);
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to parse current URL route (supports pathname /risk-map, /location-risk, and hashes)
  const parseCurrentRoute = () => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const locationParam = searchParams.get('location');

    const hash = window.location.hash.replace('#', '').trim();
    const hashPath = hash.split('?')[0];
    const hashSearch = hash.includes('?') ? hash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashSearch);
    const resolvedLocation = locationParam || hashParams.get('location') || undefined;

    // Check direct pathname /risk-map or hash #risk-map
    if (pathname === '/risk-map' || pathname.startsWith('/risk-map') || hashPath === 'risk-map') {
      return {
        page: 'risk-map',
        location: resolvedLocation,
      };
    }

    if (pathname === '/location-risk' || pathname.startsWith('/location-risk') || hashPath === 'location-details' || hashPath.startsWith('location-risk')) {
      return {
        page: 'location-details',
        location: resolvedLocation,
      };
    }

    if (pathname === '/alerts' || pathname.startsWith('/alerts') || hashPath === 'alerts') {
      return {
        page: 'alerts',
        location: resolvedLocation,
      };
    }

    if (pathname === '/how-it-works' || pathname.startsWith('/how-it-works') || hashPath === 'how-it-works') {
      return {
        page: 'how-it-works',
        location: undefined,
      };
    }

    if (hashPath === 'home' || pathname === '/') {
      return { page: 'home' };
    }

    if (resolvedLocation) {
      return {
        page: 'location-details',
        location: resolvedLocation,
      };
    }

    return { page: 'home' };
  };

  // Sync with browser URL (pushState/popstate, search params, and hash)
  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseCurrentRoute();
      setActivePage(route.page);
      setSelectedLocationId(route.location);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    // Initial check on mount
    handleUrlChange();

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Fetch baseline demonstration data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [overviewData, locationsData, alertsData, scenariosData] = await Promise.all([
          fetchCityOverview(),
          fetchLocations(),
          fetchAlerts(),
          fetchScenarios(),
        ]);
        setOverview(overviewData);
        setLocations(locationsData);
        setAlerts(alertsData);
        setScenarios(scenariosData);
      } catch (err) {
        console.error('Error loading initial MVP data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Navigation handler
  const handleNavigate = (page: string, contextId?: string) => {
    if (page === 'home') {
      setActivePage('home');
      setSelectedLocationId(undefined);
      window.history.pushState({ page: 'home' }, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'risk-map') {
      setActivePage('risk-map');
      if (contextId) {
        setSelectedLocationId(contextId);
        const targetUrl = `/risk-map?location=${encodeURIComponent(contextId)}`;
        window.history.pushState({ page: 'risk-map', location: contextId }, '', targetUrl);
      } else {
        setSelectedLocationId(undefined);
        window.history.pushState({ page: 'risk-map' }, '', '/risk-map');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'location-details' || page === 'location-risk') {
      const locKey = contextId || selectedLocationId || 'thuampui-bypass';
      setSelectedLocationId(locKey);
      setActivePage('location-details');
      const targetUrl = `/location-risk?location=${encodeURIComponent(locKey)}`;
      window.history.pushState({ page: 'location-details', location: locKey }, '', targetUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActivePage(page);
    if (contextId) {
      setSelectedLocationId(contextId);
    } else {
      setSelectedLocationId(undefined);
    }
    window.history.pushState({ page }, '', `/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Refresh Telemetry
  const handleRefreshTelemetry = async () => {
    const [overviewData, locationsData] = await Promise.all([
      fetchCityOverview(),
      fetchLocations(),
    ]);
    setOverview(overviewData);
    setLocations(locationsData);
  };

  // Apply Simulation Scenario
  const handleApplyScenario = async (scenarioId: string) => {
    try {
      const res = await applySimulationScenario(scenarioId);
      if (res.success) {
        setOverview(res.overview);
        setLocations(res.locations);
      }
    } catch (err) {
      console.error('Failed to apply scenario:', err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050811] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        activeAlertCount={alerts.length}
      />

      {/* Emergency Alert Banner */}
      <EmergencyBanner
        onOpenEvacuationProtocol={() => setEvacuationModalOpen(true)}
        lastSyncTime={overview?.lastSyncTime || '14:28:02 IST'}
      />

      {/* Main Page View Renderer */}
      <main className="flex-1">
        {loading && !overview ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-cyan-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <span className="font-mono text-xs tracking-wider">
                INITIALIZING AIZAWL GEOTECHNICAL TELEMETRY MESH...
              </span>
            </div>
          </div>
        ) : (
          <>
            {activePage === 'home' && overview && (
              <HomePage
                overview={overview}
                locations={locations}
                alerts={alerts}
                scenarios={scenarios}
                onNavigate={handleNavigate}
                onRefreshTelemetry={handleRefreshTelemetry}
                onApplyScenario={handleApplyScenario}
                onOpenReportModal={() => setReportModalOpen(true)}
              />
            )}

            {activePage === 'risk-map' && (
              <RiskMapPage
                locations={locations}
                selectedLocationId={selectedLocationId}
                onSelectLocation={(id) => handleNavigate('location-risk', id)}
                onOpenEvacuationProtocol={() => setEvacuationModalOpen(true)}
              />
            )}

            {activePage === 'location-details' && (
              <LocationDetailsPage
                locations={locations}
                selectedLocationId={selectedLocationId}
                onSelectLocation={(id) => handleNavigate('location-risk', id)}
                onBackToMap={() => handleNavigate('risk-map')}
                onNavigateHome={() => handleNavigate('home')}
                onOpenEvacuationProtocol={() => setEvacuationModalOpen(true)}
              />
            )}

            {activePage === 'alerts' && (
              <AlertsPage
                alerts={alerts}
                onNavigate={handleNavigate}
                onOpenReportModal={() => setReportModalOpen(true)}
                onOpenEvacuationProtocol={() => setEvacuationModalOpen(true)}
              />
            )}

            {activePage === 'how-it-works' && (
              <HowItWorksPage
                onNavigateToMap={() => handleNavigate('risk-map')}
              />
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals */}
      <EvacuationProtocolModal
        isOpen={evacuationModalOpen}
        onClose={() => setEvacuationModalOpen(false)}
      />

      <FissureReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onReportSubmitted={handleRefreshTelemetry}
      />
    </div>
  );
}

export default App;
