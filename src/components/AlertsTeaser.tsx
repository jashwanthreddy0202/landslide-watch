import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { PublicAlert } from '../types';

interface AlertsTeaserProps {
  alerts: PublicAlert[];
  onViewAllAlerts: () => void;
  onSelectAlert: (alertId: string) => void;
}

export const AlertsTeaser: React.FC<AlertsTeaserProps> = ({
  alerts,
  onViewAllAlerts,
  onSelectAlert,
}) => {
  const displayAlerts = alerts.slice(0, 3);

  return (
    <section className="border-t border-slate-800/80 bg-[#070b14] py-14 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-400 uppercase">
              <span>ACTIVE CIVIL ADVISORIES</span>
              <span>•</span>
              <span className="text-amber-400">DEMO DATA</span>
            </div>
            <h2 className="mt-1 font-['Chakra_Petch'] text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Latest Public Alerts & Warnings
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Emergency dispatches issued by MSDMA and simulated from regional geotechnical sensors.
            </p>
          </div>

          <button
            id="view-all-alerts-btn"
            onClick={onViewAllAlerts}
            className="group flex items-center gap-1.5 text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
          >
            <span>View All Municipal Alerts ({alerts.length})</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Alert Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {displayAlerts.map((alert) => {
            const isRed = alert.level.includes('RED');
            const isOrange = alert.level.includes('ORANGE');

            const borderColor = isRed
              ? 'border-red-500/50 hover:border-red-500'
              : isOrange
              ? 'border-amber-500/50 hover:border-amber-500'
              : 'border-yellow-500/50 hover:border-yellow-500';

            const badgeBg = isRed
              ? 'bg-red-950 text-red-400 ring-red-500/30'
              : isOrange
              ? 'bg-amber-950 text-amber-400 ring-amber-500/30'
              : 'bg-yellow-950 text-yellow-400 ring-yellow-500/30';

            const highlightText = isRed
              ? 'text-red-300'
              : isOrange
              ? 'text-amber-300'
              : 'text-yellow-300';

            return (
              <div
                key={alert.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm transition duration-300 ${borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ring-1 ${badgeBg}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {alert.level}
                    </span>
                    <span className="text-xs text-slate-400">{alert.timeAgo}</span>
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-white">
                    {alert.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {alert.summary}
                  </p>

                  <div className="mt-4 rounded-lg bg-slate-950/70 p-2.5 text-xs">
                    <span className={`font-semibold ${highlightText}`}>
                      {alert.actionRequired}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <span className="text-slate-400">
                    Zone: <strong className="text-slate-200">{alert.zone}</strong>
                  </span>

                  <button
                    id={`view-alert-details-${alert.id}`}
                    onClick={() => onSelectAlert(alert.id)}
                    className="flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <span>View Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
