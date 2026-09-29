import React from 'react';
import { AnalyticsSummary } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Cpu,
  Info,
  Building2,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white font-display">
              Geospatial Intelligence & Model Analytics
            </h1>
            <span className="rounded-md bg-purple-950 border border-purple-500/40 px-2 py-0.5 text-[10px] font-mono text-purple-300">
              NATIONAL MACRO INTELLIGENCE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Temporal Thermal Trends • Industrial Distribution • Model Calibration & Performance Evaluation
          </p>
        </div>
      </div>

      {/* CHARTS GRID ROW 1: Trends & Classifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Events Over Time Line/Area Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-cyan-500/10 p-1.5 text-cyan-400 border border-cyan-500/30">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Active Thermal Anomalies Over Time (7-Day Trend)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Aggregated VIIRS overpass observations by risk severity
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.eventsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="criticalArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="highArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="moderateArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="critical" name="Critical Risk" stroke="#ef4444" fill="url(#criticalArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="high" name="High Risk" stroke="#f97316" fill="url(#highArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="moderate" name="Moderate" stroke="#10b981" fill="url(#moderateArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classification Donut Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-400 border border-amber-500/30">
                <PieIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Events by ML Classification</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Categorization breakdown of all detections
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.classificationDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analytics.classificationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Risk Distribution & Top Facilities Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Bar Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-orange-500/10 p-1.5 text-orange-400 border border-orange-500/30">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Risk Tier Distribution</h3>
                <p className="text-[11px] text-slate-400 font-mono">Events grouped by risk level</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.riskDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="risk" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {analytics.riskDistribution.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facilities With Highest Anomaly Frequency Table (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-400 border border-blue-500/30">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Facilities with Highest Anomaly Frequency
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  30-day recurring thermal hotspots ranking
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                <tr>
                  <th className="p-2.5">Rank & Facility</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">30d Events</th>
                  <th className="p-2.5">Max FRP</th>
                  <th className="p-2.5 text-right">Avg Deviation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analytics.topFacilitiesByAnomalies.map((fac, idx) => (
                  <tr key={fac.id} className="hover:bg-slate-900/80 transition">
                    <td className="p-2.5 font-medium text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] text-slate-400 font-bold">
                        #{idx + 1}
                      </span>
                      <span className="truncate max-w-[200px]">{fac.name}</span>
                    </td>
                    <td className="p-2.5 text-blue-300">{fac.type}</td>
                    <td className="p-2.5 font-bold text-amber-300">{fac.count} events</td>
                    <td className="p-2.5 text-orange-400 font-bold">{fac.maxFrp} MW</td>
                    <td className="p-2.5 text-right text-red-400 font-bold">+{fac.avgSigma}σ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 3: MODEL EVALUATION BENCHMARK METRICS (TRANSPARENTLY LABELED AS DEMO DATA) */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/30">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide font-display">
                  Model Evaluation & Classification Performance
                </h3>
                <span className="rounded bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  Model Evaluation — Demo Data
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                XGBoost/LightGBM probability calibrated cross-validation metrics (Test set: {analytics.evaluationMetrics.testSamplesCount} labeled samples)
              </p>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Precision</span>
            <span className="telemetry-num text-xl font-bold text-emerald-400">
              {(analytics.evaluationMetrics.precision * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Recall</span>
            <span className="telemetry-num text-xl font-bold text-emerald-400">
              {(analytics.evaluationMetrics.recall * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">F1-Score</span>
            <span className="telemetry-num text-xl font-bold text-cyan-400">
              {(analytics.evaluationMetrics.f1Score * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">PR-AUC</span>
            <span className="telemetry-num text-xl font-bold text-cyan-400">
              {analytics.evaluationMetrics.prAuc.toFixed(3)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Brier Calibration</span>
            <span className="telemetry-num text-xl font-bold text-blue-400">
              {analytics.evaluationMetrics.calibrationBrierScore.toFixed(3)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">False Negative</span>
            <span className="telemetry-num text-xl font-bold text-amber-400">
              {(analytics.evaluationMetrics.falseNegativeRate * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Avg Latency</span>
            <span className="telemetry-num text-xl font-bold text-white">
              {analytics.evaluationMetrics.avgInferenceLatencyMs} ms
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <Info className="h-3.5 w-3.5 text-cyan-400 inline mr-1.5" />
          <strong>Evaluation Note:</strong> All metrics displayed reflect synthetic benchmark evaluations on simulated industrial anomaly scenarios for demonstration at Smart India Hackathon 2026. Production deployment will ingest empirical labeled incident datasets from state disaster management authorities.
        </div>
      </div>
    </div>
  );
};
