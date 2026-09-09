import React from 'react';
import { AlertOctagon, AlertTriangle, Clock, MapPin, ArrowRight, Car, ShieldAlert } from 'lucide-react';
import { PublicAlert } from '../types';

export interface AlertCardProps {
  alert: PublicAlert;
  onOpenEvacuationProtocol?: () => void;
  onViewAffectedArea?: (locationIdOrName: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onOpenEvacuationProtocol,
  onViewAffectedArea,
}) => {
  const normalizedLevel = (alert.riskLevel || alert.level || 'Moderate').toUpperCase();
  const isVeryHigh = normalizedLevel.includes('VERY HIGH') || normalizedLevel.includes('RED') || normalizedLevel.includes('CRITICAL');
  const isHigh = !isVeryHigh && (normalizedLevel.includes('HIGH') || normalizedLevel.includes('ORANGE') || normalizedLevel.includes('SEVERE'));
  const isLow = !isVeryHigh && !isHigh && normalizedLevel.includes('LOW');
  const isModerate = !isVeryHigh && !isHigh && !isLow;

  const cardBorder = isVeryHigh
    ? 'border-red-500/60'
    : isHigh
    ? 'border-orange-500/60'
    : isLow
    ? 'border-emerald-500/60'
    : 'border-yellow-500/60';

  const badgeColor = isVeryHigh
    ? 'bg-red-950/90 text-red-300 border-red-700/60 ring-1 ring-red-500/40'
    : isHigh
    ? 'bg-orange-950/90 text-orange-300 border-orange-700/60 ring-1 ring-orange-500/40'
    : isLow
    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60 ring-1 ring-emerald-500/40'
    : 'bg-yellow-950/90 text-yellow-300 border-yellow-700/60 ring-1 ring-yellow-500/40';

  const riskLevelLabel = isVeryHigh ? 'VERY HIGH' : isHigh ? 'HIGH' : isLow ? 'LOW' : 'MODERATE';
  const confidencePercent = Math.round(
    ((alert.demonstrationConfidence ?? alert.modelConfidence ?? 0.85)) * 100
  );
  const locationText = alert.location || alert.zone || 'Aizawl Corridor';
  const shortExplanation = alert.description || alert.summary || '';
  
  const formattedIssuedTime = React.useMemo(() => {
    const raw = alert.issuedAt || alert.timestamp || alert.timeAgo || 'Recent';
    if (!raw) return 'Recent';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return (
          d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
          }) + ' UTC'
        );
      }
    } catch {
      // fallback to raw string
    }
    return raw;
  }, [alert.issuedAt, alert.timestamp, alert.timeAgo]);

  const handleViewArea = () => {
    if (onViewAffectedArea) {
      const loc = alert.location || alert.locationId || 'thuampui';
      const cleanSlug = loc.toLowerCase().replace(/\s+/g, '-');
      onViewAffectedArea(cleanSlug);
    }
  };

  return (
    <div className={`rounded-2xl border bg-slate-950/90 p-6 shadow-xl transition-all ${cardBorder}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Risk Level Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-extrabold uppercase border ${badgeColor}`}
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>{riskLevelLabel} RISK</span>
          </span>

          {/* Demo Alert / Demo Data Label */}
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            <span>DEMO ALERT • DEMO DATA</span>
          </span>

          {/* Alert Bulletin ID */}
          <span className="font-mono text-xs text-slate-400">
            #{alert.bulletinNo || alert.id}
          </span>
        </div>

        {/* Issued Time & Location Ward */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Issued: {formattedIssuedTime}</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px] uppercase">Status: {alert.status}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-4">
        <div>
          {/* Location Line */}
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium text-xs mb-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold">{locationText}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white font-['Chakra_Petch']">
            {alert.title}
          </h2>

          {/* Short Explanation */}
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {shortExplanation}
          </p>

          {/* Demonstration Risk Engine Metrics */}
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400">Risk Score:</span>
              <span className={`font-bold font-['Chakra_Petch'] text-sm ${
                isVeryHigh ? 'text-red-400' : isHigh ? 'text-orange-400' : isLow ? 'text-emerald-400' : 'text-yellow-400'
              }`}>
                {alert.riskScore !== undefined ? alert.riskScore : (isVeryHigh ? 95 : isHigh ? 68 : isLow ? 18 : 42)}
              </span>
              <span className="text-slate-500">/ 100</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 font-mono text-cyan-400">
              <span className="text-slate-400">Demo Confidence:</span>
              <span className="font-semibold">{confidencePercent}%</span>
            </div>
            <span className="text-slate-700 hidden md:inline">•</span>
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              0–25 LOW • 26–50 MOD • 51–75 HIGH • 76–100 VERY HIGH
            </span>
          </div>
        </div>

        {/* Geotechnical Telemetry Trigger / Details (if available) */}
        {alert.details && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs space-y-1.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
              Demonstration Telemetry Trigger:
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              {alert.details}
            </p>
          </div>
        )}

        {/* Mandated Action / Precautions (if available) */}
        {alert.actionRequired && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/25 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-red-300 uppercase tracking-wider text-[11px] mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Simulated Precautionary Action:</span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              {alert.actionRequired}
            </p>
          </div>
        )}

        {/* Bottom Actions Row: "View Affected Area" Button and Disclaimer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-400">
            <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[11px] text-slate-400 font-mono">
              Status: {alert.status} (Demo)
            </span>
            <span className="text-[10px] text-amber-400/90 font-medium">
              Demonstration alerts only. Always follow official instructions from local authorities.
            </span>
          </div>

          {/* "View Affected Area" Button */}
          <button
            id={`view-affected-area-${alert.id}`}
            type="button"
            onClick={handleViewArea}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/50 transition hover:bg-cyan-500 shrink-0"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>View Affected Area</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
