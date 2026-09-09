import React from 'react';
import { AlertTriangle, MapPin, Bell, Compass, Shield, Menu, X } from 'lucide-react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  activeAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate, activeAlertCount = 4 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'risk-map', label: 'Risk Map' },
    { id: 'location-details', label: 'Location Risk Details' },
    { id: 'alerts', label: 'Public Safety Alerts' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-button"
            onClick={() => handleNav('home')}
            className="group flex items-center gap-2.5 text-left transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 shadow-md shadow-cyan-950/40 transition group-hover:scale-105">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Chakra_Petch'] text-lg font-bold tracking-wider text-slate-100">
                  LANDSLIDE WATCH
                </span>
                <span className="hidden rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 ring-1 ring-cyan-500/30 sm:inline-block">
                  PHASE 1 MVP
                </span>
              </div>
              <div className="hidden text-[10px] tracking-widest text-slate-400 uppercase md:block">
                Mizoram Landslide Early Warning System
              </div>
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`relative px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-3 h-[2px] rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions & Status */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* Location Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            <MapPin className="h-3 w-3 text-cyan-400" />
            <span className="hidden font-medium lg:inline">Aizawl, Mizoram</span>
            <span className="text-[11px] text-slate-400">• Demo Telemetry</span>
          </div>

          {/* Active Alerts Pill */}
          <button
            id="nav-alerts-pill"
            onClick={() => handleNav('alerts')}
            className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-900/40"
          >
            <Bell className="h-3 w-3 text-red-400" />
            <span>{activeAlertCount} Alerts</span>
          </button>

          {/* CTA: View Risk Map */}
          <button
            id="nav-view-map-cta"
            onClick={() => handleNav('risk-map')}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-cyan-900/50 transition hover:bg-cyan-500"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>View Risk Map</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-900 md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-[#070b14] px-4 py-4 md:hidden">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Aizawl, Mizoram (Demo Telemetry)</span>
            </div>
            <button
              onClick={() => handleNav('alerts')}
              className="flex items-center gap-1 rounded-full bg-red-950/60 px-2.5 py-0.5 text-xs font-semibold text-red-300"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{activeAlertCount} Active</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  activePage === item.id
                    ? 'bg-cyan-950/60 text-cyan-400'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => handleNav('risk-map')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              <Compass className="h-4 w-4" />
              <span>Launch Interactive Risk Map</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
