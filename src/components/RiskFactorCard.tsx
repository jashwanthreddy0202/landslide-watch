import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface RiskFactorCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  statusColor?: 'red' | 'orange' | 'cyan' | 'emerald' | 'yellow';
  note?: string;
}

export const RiskFactorCard: React.FC<RiskFactorCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  statusColor = 'cyan',
  note,
}) => {
  const colorMap = {
    red: {
      text: 'text-red-400',
      icon: 'text-red-400',
      subtext: 'text-red-300',
      border: 'border-red-900/40',
      bg: 'bg-red-950/20',
    },
    orange: {
      text: 'text-orange-400',
      icon: 'text-orange-400',
      subtext: 'text-orange-300',
      border: 'border-orange-900/40',
      bg: 'bg-orange-950/20',
    },
    yellow: {
      text: 'text-yellow-400',
      icon: 'text-yellow-400',
      subtext: 'text-yellow-300',
      border: 'border-yellow-900/40',
      bg: 'bg-yellow-950/20',
    },
    cyan: {
      text: 'text-cyan-300',
      icon: 'text-cyan-400',
      subtext: 'text-cyan-400',
      border: 'border-slate-800',
      bg: 'bg-slate-900/50',
    },
    emerald: {
      text: 'text-emerald-300',
      icon: 'text-emerald-400',
      subtext: 'text-emerald-300',
      border: 'border-emerald-900/40',
      bg: 'bg-emerald-950/20',
    },
  }[statusColor];

  return (
    <div className={`rounded-xl border ${colorMap.border} ${colorMap.bg} p-4 transition-all duration-200`}>
      <div className="flex items-center justify-between text-slate-400 text-xs">
        <span className="font-medium">{title}</span>
        <Icon className={`h-4 w-4 ${colorMap.icon}`} />
      </div>
      <div className={`mt-3 font-['Chakra_Petch'] text-2xl font-bold ${colorMap.text}`}>
        {value}
      </div>
      {subtitle && (
        <div className={`mt-1 text-xs font-semibold ${colorMap.subtext}`}>
          {subtitle}
        </div>
      )}
      {note && (
        <div className="mt-1 text-xs text-slate-400">
          {note}
        </div>
      )}
    </div>
  );
};
