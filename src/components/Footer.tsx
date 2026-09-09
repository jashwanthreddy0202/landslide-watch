import React from 'react';
import { Shield, ExternalLink, Phone } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#05080f] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-['Chakra_Petch'] text-lg font-bold tracking-wider text-slate-100">
                LANDSLIDE WATCH
              </span>
            </div>

            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-400">
              AI-powered landslide risk monitoring and early warning for Aizawl, Mizoram. Combining real-time rainfall sensors, 10m DEM slope gradients, and historical slip archives to safeguard hilltop communities.
            </p>

            {/* Regulatory Pilot Notice */}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              <span className="rounded bg-slate-900 px-2 py-0.5 border border-slate-800">
                MSDMA PILOT
              </span>
              <span className="rounded bg-slate-900 px-2 py-0.5 border border-slate-800">
                GSI HISTORICAL ARCHIVE
              </span>
              <span className="rounded bg-slate-900 px-2 py-0.5 border border-slate-800">
                10M LIDAR RESOLUTION
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              System Modules
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="transition hover:text-cyan-400"
                >
                  Home Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('risk-map')}
                  className="transition hover:text-cyan-400"
                >
                  Interactive Risk Map (GIS)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('location-details')}
                  className="transition hover:text-cyan-400"
                >
                  Location Risk Details (12 Corridors)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('alerts')}
                  className="transition hover:text-cyan-400"
                >
                  Public Safety Alerts & Bulletins
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="transition hover:text-cyan-400"
                >
                  How It Works (Geotechnical Math)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Emergency & Collaboration */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              Disaster Management & Emergency
            </h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              State Emergency Operation Centre (SEOC), Directorate of Disaster Management & Rehabilitation, Aizawl, Mizoram.
            </p>

            <div className="mt-3.5 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Phone className="h-3.5 w-3.5 text-cyan-400" />
                <span>Emergency Control Helpline: 1070</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Landline: 0389-2335837 / 2335842 (24x7 Control Room)
              </div>
            </div>
          </div>
        </div>

        {/* Phase 1 MVP Demonstration Data Mandatory Disclaimer */}
        <div className="mt-10 rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 text-[11px] leading-relaxed text-amber-200/90">
          <strong className="font-semibold text-amber-300">DEMONSTRATION DATA NOTICE (PHASE 1 MVP):</strong>{' '}
          This application operates using simulated demonstration datasets and Geological Survey of India historical archives for algorithmic validation. It does not claim real-time operational live satellite or government API connection. Do not rely exclusively on this MVP for life-safety emergency decisions without consulting official District Disaster Management Authority (DDMA Aizawl) statutory broadcasts.
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-[11px] text-slate-400 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Landslide Watch. AI-Powered Early Warning System for Aizawl, Mizoram.
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Physics-Informed ML & Gemini AI</span>
            <span>•</span>
            <span>Version 1.0.0 (Phase 1)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
