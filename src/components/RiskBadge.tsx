import React from 'react';
import { RiskLevel, ReviewStatus } from '../types';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md', showPulse = false }) => {
  const getColors = () => {
    switch (risk) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/80 border-red-500/60 text-red-300',
          dot: 'bg-red-500',
          pulse: 'bg-red-400',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/80 border-orange-500/60 text-orange-300',
          dot: 'bg-orange-500',
          pulse: 'bg-orange-400',
        };
      case 'ELEVATED':
        return {
          bg: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
          dot: 'bg-amber-500',
          pulse: 'bg-amber-400',
        };
      case 'MODERATE':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
          dot: 'bg-emerald-500',
          pulse: 'bg-emerald-400',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
          dot: 'bg-cyan-500',
          pulse: 'bg-cyan-400',
        };
    }
  };

  const { bg, dot, pulse } = getColors();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase font-mono ${bg} ${sizeClasses[size]}`}
    >
      <span className="relative flex h-2 w-2">
        {showPulse && (risk === 'CRITICAL' || risk === 'HIGH') && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulse}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      <span>{risk}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReviewStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'REQUIRES_REVIEW':
        return {
          label: 'Requires Review',
          classes: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        };
      case 'VERIFIED':
        return {
          label: 'Verified Event',
          classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        };
      case 'DISMISSED':
        return {
          label: 'Dismissed / Non-Hazard',
          classes: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
        };
      case 'ESCALATED':
        return {
          label: 'Escalated to HSE',
          classes: 'bg-red-500/15 border-red-500/50 text-red-300 font-semibold animate-pulse',
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-tight ${config.classes} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};
