import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { RiskLevel } from '../types';

export interface RiskBadgeProps {
  level: RiskLevel | string;
  factorOfSafety?: number;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  factorOfSafety,
  showIcon = true,
  size = 'sm',
  className = '',
}) => {
  const normLevel = (level || '').toUpperCase();
  const isCritical = normLevel.includes('CRITICAL');
  const isSevere = normLevel.includes('SEVERE') || normLevel.includes('ORANGE');
  const isWatch = normLevel.includes('WATCH') || normLevel.includes('YELLOW');

  let colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50';
  let Icon = ShieldCheck;

  if (isCritical) {
    colorClasses = 'bg-red-950/80 text-red-400 border-red-800/60 shadow-red-950/40';
    Icon = AlertOctagon;
  } else if (isSevere) {
    colorClasses = 'bg-orange-950/80 text-orange-400 border-orange-800/60 shadow-orange-950/40';
    Icon = AlertTriangle;
  } else if (isWatch) {
    colorClasses = 'bg-yellow-950/80 text-yellow-400 border-yellow-800/60 shadow-yellow-950/40';
    Icon = Info;
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm font-semibold',
  }[size];

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wide shadow-sm ${colorClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={iconSizes} />}
      <span>{level}</span>
      {typeof factorOfSafety === 'number' && !isNaN(factorOfSafety) && (
        <span className="opacity-80 border-l border-current/30 pl-1.5 ml-0.5">
          FoS {factorOfSafety.toFixed(2)}
        </span>
      )}
    </span>
  );
};
