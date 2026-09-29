import React from 'react';
import { CommandKPIs, ThermalEvent, Facility, RiskLevel } from '../types';
import { KpiCard } from '../components/KpiCard';
import { ThermalMap } from '../components/ThermalMap';
import { RiskBadge, StatusBadge } from '../components/RiskBadge';
import {
  Flame,
  AlertTriangle,
  Building2,
  FileCheck2,
  BrainCircuit,
  ArrowUpRight,
  ExternalLink,
  Clock,
  Radio,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface OverviewPageProps {
  kpis: CommandKPIs;
  events: ThermalEvent[];
  facilities: Facility[];
  onSelectEvent: (event: ThermalEvent) => void;
  onNavigateToMap: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToFacilities: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  kpis,
  events,
  facilities,
  onSelectEvent,
  onNavigateToMap,
  onNavigateToAlerts,
  onNavigateToFacilities,
}) => {
  const highRiskEvents = events.filter((e) => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH');
  const pendingReviewEvents = events.filter((e) => e.reviewStatus === 'REQUIRES_REVIEW');

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Title & System Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white font-display">
              Thermal Intelligence Command Center
            </h1>
            <span className="rounded-md bg-cyan-950 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              REAL-TIME GIS FEED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated Satellite Hotspot Ingestion • Contextual Baseline Scoring • Explainable AI Triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-950 transition"
          >
            <span>Full-Screen GIS Map</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* TOP KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          id="kpi-active-anomalies"
          title="Active Anomalies"
          value={kpis.activeThermalAnomalies}
          subtitle="VIIRS Passes (3-Day)"
          icon={Flame}
          accentColor="orange"
          badge="Live"
          onClick={onNavigateToMap}
        />

        <KpiCard
          id="kpi-high-risk"
          title="High Risk Events"
          value={kpis.highRiskEvents}
          subtitle="Severity ≥ +2.0σ Deviation"
          icon={AlertTriangle}
          accentColor="red"
          badge="Urgent"
          trend={{ value: '+2 in 24h', isPositive: true }}
          onClick={onNavigateToAlerts}
        />

        <KpiCard
          id="kpi-facilities"
          title="Facilities Monitored"
          value={kpis.facilitiesMonitored}
          subtitle="Industrial Baselines Tracked"
          icon={Building2}
          accentColor="blue"
          onClick={onNavigateToFacilities}
        />

        <KpiCard
          id="kpi-review-queue"
          title="Pending Review"
          value={kpis.eventsRequiringReview}
          subtitle="Human Decision Queue"
          icon={FileCheck2}
          accentColor="amber"
          badge="Action Req."
          onClick={onNavigateToAlerts}
        />

        <KpiCard
          id="kpi-model-confidence"
          title="Model Confidence"
          value={`${kpis.modelConfidenceAverage}%`}
          subtitle="Probability Calibrated"
          icon={BrainCircuit}
          accentColor="emerald"
        />
      </div>

      {/* MAIN CENTRAL WORKSPACE: MAP & PRIORITY QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Central Map Section (Occupies 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 p-3.5 px-4 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-xs font-semibold text-white font-mono tracking-wide uppercase">
                National Industrial Thermal Map
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-semibold">{events.length} Hotspots</span>
              <span>•</span>
              <span className="text-blue-400 font-semibold">{facilities.length} Facilities</span>
            </div>
          </div>

          <div className="flex-1 relative">
            <ThermalMap
              events={events}
              facilities={facilities}
              selectedEvent={null}
              onSelectEvent={onSelectEvent}
              selectedFacility={null}
            />
          </div>
        </div>

        {/* Right Side: High Risk Anomaly Priority Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 p-3.5 px-4 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span className="text-xs font-semibold text-white font-mono tracking-wide uppercase">
                Priority Threat Stream
              </span>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {highRiskEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="group rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5 space-y-2 cursor-pointer transition-all hover:border-amber-500/50 hover:bg-slate-900/90 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {evt.eventNumber}
                    </span>
                    <RiskBadge risk={evt.riskLevel} size="sm" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    P: <strong className="text-white">{evt.modelProbability.toFixed(0)}%</strong>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition truncate">
                    {evt.facilityName}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">{evt.title}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
                  <span className="text-orange-400 font-semibold">{evt.frp} MW</span>
                  <span className="text-red-400">+{evt.baselineDeviationSigma}σ deviation</span>
                  <StatusBadge status={evt.reviewStatus} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: WORKFLOW INTELLIGENCE & SATELLITE TELEMETRY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pipeline Step 1-6 Strip */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span className="uppercase font-bold text-white flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              THERMOSCOPE Automated Intelligence Pipeline
            </span>
            <span className="text-cyan-400">Continuous 24/7 Inference</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">01 DETECT</div>
              <div className="text-[11px] font-medium text-slate-300">FIRMS NRT</div>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">02 CONTEXT</div>
              <div className="text-[11px] font-medium text-slate-300">OSM & Landuse</div>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">03 FINGERPRINT</div>
              <div className="text-[11px] font-medium text-slate-300">90d Baseline</div>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">04 CLASSIFY</div>
              <div className="text-[11px] font-medium text-slate-300">XGBoost ML</div>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">05 EXPLAIN</div>
              <div className="text-[11px] font-medium text-slate-300">TreeSHAP</div>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">06 DECISION</div>
              <div className="text-[11px] font-medium text-slate-300">Human Verify</div>
            </div>
          </div>
        </div>

        {/* Live Satellite Swath Coverage Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="uppercase font-mono font-bold text-white">Sensor Constellation</span>
            <span className="text-emerald-400 font-mono">AUTHENTICATED</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Telemetry Stream:</span>
              <span className="text-emerald-300 font-bold">4-Sensor Live NRT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Primary Sensor:</span>
              <span className="text-white">NOAA-20/21 VIIRS (375m)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Secondary Sensor:</span>
              <span className="text-white">Terra/Aqua MODIS NRT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Spectral Verification:</span>
              <span className="text-cyan-300">Sentinel-2 SWIR B12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
