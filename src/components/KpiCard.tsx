import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'red' | 'orange' | 'amber' | 'emerald' | 'cyan' | 'blue' | 'purple';
  badge?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'cyan',
  badge,
  onClick,
}) => {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'red':
        return {
          iconBg: 'bg-red-500/10 text-red-400 border-red-500/30',
          border: 'border-red-500/20 hover:border-red-500/40',
          glow: 'from-red-500/5',
        };
      case 'orange':
        return {
          iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          border: 'border-orange-500/20 hover:border-orange-500/40',
          glow: 'from-orange-500/5',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          border: 'border-amber-500/20 hover:border-amber-500/40',
          glow: 'from-amber-500/5',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          glow: 'from-emerald-500/5',
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          border: 'border-blue-500/20 hover:border-blue-500/40',
          glow: 'from-blue-500/5',
        };
      case 'cyan':
      default:
        return {
          iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          border: 'border-cyan-500/20 hover:border-cyan-500/40',
          glow: 'from-cyan-500/5',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md transition-all duration-200 ${styles.border} ${
        onClick ? 'cursor-pointer hover:translate-y-[-2px] hover:shadow-lg hover:shadow-slate-950/50' : ''
      }`}
    >
      <div className={`absolute -right-6 -top-6 h-28 w-28 bg-gradient-to-br ${styles.glow} to-transparent rounded-full blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badge && (
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="telemetry-num text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {value}
            </span>
          </div>
        </div>

        <div className={`rounded-lg border p-2.5 ${styles.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          {subtitle && <span className="text-slate-400 text-[11px] truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono text-[11px] font-medium ml-auto ${
                trend.isNeutral
                  ? 'text-slate-400'
                  : trend.isPositive
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
