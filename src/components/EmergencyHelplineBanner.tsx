import React from 'react';
import { PhoneCall, AlertOctagon, FileText } from 'lucide-react';

interface EmergencyHelplineBannerProps {
  onReportFissure: () => void;
}

export const EmergencyHelplineBanner: React.FC<EmergencyHelplineBannerProps> = ({ onReportFissure }) => {
  return (
    <section className="bg-[#070b14] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-red-800/80 bg-gradient-to-r from-red-950/90 via-red-900/60 to-slate-950 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-950/60">
                <AlertOctagon className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Immediate Geological Hazard or Fissure Sighting?
                </h3>
                <p className="mt-1 text-xs text-red-200 sm:text-sm">
                  Contact the 24/7 State Emergency Operation Centre (SEOC) or AMC Disaster Management Desk immediately.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-xs font-bold text-white sm:text-sm">
                  <span className="rounded bg-red-900/80 px-2.5 py-1 text-red-200">
                    TOLL-FREE CONTROL ROOM: 1070
                  </span>
                  <span className="rounded bg-slate-900/80 px-2.5 py-1 text-slate-300">
                    DIRECT: 0389-2335837
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a
                href="tel:1070"
                id="emergency-call-1070-btn"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-red-950 shadow-md transition hover:bg-slate-100 sm:text-sm"
              >
                <PhoneCall className="h-4 w-4 text-red-600" />
                <span>Call 1070 Helpline</span>
              </a>

              <button
                id="report-fissure-btn"
                onClick={onReportFissure}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-950/80 px-4 py-3 text-xs font-semibold text-red-200 transition hover:bg-red-900/80 sm:text-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Report Ground Fissure</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
