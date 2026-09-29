import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
} from 'recharts';
import { ThermalObservationPoint } from '../types';
import { Activity, Flame, TrendingUp, AlertTriangle } from 'lucide-react';

interface ThermalFingerprintChartProps {
  data: ThermalObservationPoint[];
  currentFRP: number;
  baselineMedian: number;
  baselineSigma: number;
  persistenceHours: number;
  recurrenceCount30d: number;
  facilityName: string;
}

export const ThermalFingerprintChart: React.FC<ThermalFingerprintChartProps> = ({
  data,
  currentFRP,
  baselineMedian,
  baselineSigma,
  persistenceHours,
  recurrenceCount30d,
  facilityName,
}) => {
  const deviationVal = Number(baselineSigma.toFixed(1));
  const isAbnormal = deviationVal >= 2.0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as ThermalObservationPoint;
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
          <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 font-mono">
            {label} ({point.timestamp.split('T')[1].substring(0, 5)} UTC)
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Observed FRP:</span>
              <span className={`font-mono font-bold ${point.isAnomaly ? 'text-red-400' : 'text-amber-300'}`}>
                {point.frp} MW
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Baseline Median:</span>
              <span className="font-mono text-slate-300">{point.baselineMedian} MW</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Normal Range (+2σ):</span>
              <span className="font-mono text-cyan-400">≤ {point.upperBand} MW</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Brightness Temp:</span>
              <span className="font-mono text-slate-300">{point.brightnessTemp} K</span>
            </div>
            {point.isAnomaly && (
              <div className="mt-1 pt-1 border-t border-red-500/30 text-red-400 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Statistically Anomalous Spike
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-cyan-500/10 p-1.5 text-cyan-400 border border-cyan-500/30">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-white">
              Facility Thermal Fingerprint
            </h4>
            <p className="text-[11px] text-slate-400">
              30-Day Historical Baseline vs. Current Radiative Intensity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-semibold border ${
              isAbnormal
                ? 'bg-red-950/80 border-red-500/60 text-red-300 shadow-sm shadow-red-500/20'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Current deviation: +{deviationVal}σ above baseline
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Normal variation range gradient */}
              <linearGradient id="normalBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
              {/* FRP curve gradient */}
              <linearGradient id="frpLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(d) => {
                const parts = d.split('-');
                return `${parts[2]}/${parts[1]}`;
              }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              unit=" MW"
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Upper Normal Envelope (+2 sigma) */}
            <Area
              type="monotone"
              dataKey="upperBand"
              stroke="#0891b2"
              strokeDasharray="4 4"
              fill="url(#normalBand)"
              name="Normal Upper Bound (+2σ)"
            />

            {/* Baseline Median */}
            <Line
              type="monotone"
              dataKey="baselineMedian"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              name="Historical Median Baseline"
            />

            {/* Observed FRP Time Series */}
            <Area
              type="monotone"
              dataKey="frp"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#frpLine)"
              name="Observed FRP (MW)"
            />

            {/* Reference line for current observation */}
            <ReferenceLine
              y={currentFRP}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Current Event (${currentFRP} MW)`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'top',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
            Typical Activity
          </span>
          <span className="font-mono text-xs font-semibold text-slate-200">
            {baselineMedian < 10 ? 'Low' : baselineMedian < 20 ? 'Moderate' : 'High'} (Median {baselineMedian} MW)
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
            30-Day Recurrence
          </span>
          <span className="font-mono text-xs font-semibold text-slate-200">
            {recurrenceCount30d} passes / 30 days
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
            Anomaly Status
          </span>
          <span
            className={`font-mono text-xs font-bold ${
              isAbnormal ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {isAbnormal ? 'Abnormal Spike' : 'Within Normal Band'}
          </span>
        </div>

        <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
            Persistence Duration
          </span>
          <span className="font-mono text-xs font-semibold text-amber-300">
            {persistenceHours} hours continuous
          </span>
        </div>
      </div>
    </div>
  );
};
