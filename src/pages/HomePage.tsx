import React from 'react';
import { Compass, Bell, Shield, Layers, Gauge, Cpu } from 'lucide-react';
import { HeroMapWidget } from '../components/HeroMapWidget';
import { TelemetrySnapshot } from '../components/TelemetrySnapshot';
import { ArchitectureSteps } from '../components/ArchitectureSteps';
import { InteractiveGisTeaser } from '../components/InteractiveGisTeaser';
import { AlertsTeaser } from '../components/AlertsTeaser';
import { EmergencyHelplineBanner } from '../components/EmergencyHelplineBanner';
import { CheckMyAreaSearch } from '../components/CheckMyAreaSearch';
import { CityHazardOverview, LocationRisk, PublicAlert, SimulationScenario } from '../types';

interface HomePageProps {
  overview: CityHazardOverview;
  locations: LocationRisk[];
  alerts: PublicAlert[];
  scenarios: SimulationScenario[];
  onNavigate: (page: string, contextId?: string) => void;
  onRefreshTelemetry: () => void;
  onApplyScenario: (id: string) => Promise<void>;
  onOpenReportModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  overview,
  locations,
  alerts,
  scenarios,
  onNavigate,
  onRefreshTelemetry,
  onApplyScenario,
  onOpenReportModal,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060a14] via-[#081022] to-[#070b14] py-12 sm:py-16 lg:py-20">
        {/* Background Grid & Ambient Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                  <Shield className="h-3 w-3 text-cyan-400" />
                  MSDMA • GSI TELEMETRY PILOT
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  10m LiDAR DEM Enabled
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-['Chakra_Petch'] text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Know the Risk.{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  Act Before
                </span>{' '}
                the Landslide.
              </h1>

              {/* Supporting Text matching prompt */}
              <p className="text-base sm:text-lg leading-relaxed text-slate-300">
                AI-powered landslide risk monitoring and early warning for Aizawl, Mizoram. Combining real-time rainfall sensors, 10m DEM slope gradients, and historical slip archives to safeguard hilltop communities.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="hero-view-risk-map-btn"
                  onClick={() => onNavigate('risk-map')}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-500"
                >
                  <Compass className="h-4 w-4" />
                  <span>View Risk Map</span>
                </button>

                <button
                  id="hero-view-alerts-btn"
                  onClick={() => onNavigate('alerts')}
                  className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-900/40"
                >
                  <Bell className="h-4 w-4 text-red-400" />
                  <span>View Alerts ({alerts.length} Active)</span>
                </button>
              </div>

              {/* 3 Metric Badges matching design */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    Spatial Mesh
                  </div>
                  <div className="mt-1 font-['Chakra_Petch'] text-base font-bold text-white">
                    10m²
                  </div>
                  <div className="text-[10px] text-slate-400">LiDAR Resolution</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    Pore Pressure
                  </div>
                  <div className="mt-1 font-['Chakra_Petch'] text-base font-bold text-red-400">
                    84.2 kPa
                  </div>
                  <div className="text-[10px] text-slate-400">Critical Saturated</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    Forecast Horizon
                  </div>
                  <div className="mt-1 font-['Chakra_Petch'] text-base font-bold text-cyan-400">
                    72 Hours
                  </div>
                  <div className="text-[10px] text-slate-400">Continuous Physics AI</div>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Widget */}
            <div className="lg:col-span-6">
              <HeroMapWidget
                locations={locations}
                onSelectLocation={(id) => onNavigate('location-details', id)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Check My Area - Phase 1 Demonstration Locality Search */}
      <CheckMyAreaSearch
        locations={locations}
        onNavigateToLocationDetails={(locationId) => onNavigate('location-details', locationId)}
      />

      {/* Live Telemetry Snapshot Section (Cards from Image 1.png) */}
      <TelemetrySnapshot
        overview={overview}
        onRefresh={onRefreshTelemetry}
        onViewGis={() => onNavigate('risk-map')}
        scenarios={scenarios}
        onApplyScenario={onApplyScenario}
      />

      {/* Mission-Critical Architecture (4 Steps from Image 1.png) */}
      <ArchitectureSteps />

      {/* Interactive GIS Teaser */}
      <InteractiveGisTeaser onOpenMap={() => onNavigate('risk-map')} />

      {/* Latest Public Alerts & Warnings */}
      <AlertsTeaser
        alerts={alerts}
        onViewAllAlerts={() => onNavigate('alerts')}
        onSelectAlert={(id) => onNavigate('alerts', id)}
      />

      {/* Emergency Helpline Banner (Call 1070) */}
      <EmergencyHelplineBanner onReportFissure={onOpenReportModal} />
    </div>
  );
};
