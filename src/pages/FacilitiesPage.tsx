import React, { useState } from 'react';
import { Facility, ThermalEvent, RiskLevel } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { ThermalFingerprintChart } from '../components/ThermalFingerprintChart';
import {
  Building2,
  Search,
  Filter,
  Flame,
  Activity,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  X,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';

interface FacilitiesPageProps {
  facilities: Facility[];
  events: ThermalEvent[];
  onSelectEvent: (event: ThermalEvent) => void;
  onNavigateToMapWithFacility?: (facility: Facility) => void;
}

export const FacilitiesPage: React.FC<FacilitiesPageProps> = ({
  facilities,
  events,
  onSelectEvent,
  onNavigateToMapWithFacility,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(facilities[0] || null);

  // Filter facilities
  const filteredFacilities = facilities.filter((fac) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        fac.name.toLowerCase().includes(q) ||
        fac.location.city?.toLowerCase().includes(q) ||
        fac.location.state?.toLowerCase().includes(q) ||
        fac.operator.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (typeFilter !== 'ALL' && fac.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && fac.currentStatus !== statusFilter) return false;

    return true;
  });

  const facilityEvents = events.filter((e) => e.facilityId === selectedFacility?.id);

  const getStatusBadge = (status: Facility['currentStatus']) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-red-950/80 border-red-500/60 text-red-300 font-bold animate-pulse';
      case 'ELEVATED':
        return 'bg-amber-950/80 border-amber-500/60 text-amber-300 font-bold';
      case 'NORMAL':
      default:
        return 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-medium';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white font-display">
              Industrial Facility Monitoring
            </h1>
            <span className="rounded-md bg-blue-950 border border-blue-500/40 px-2 py-0.5 text-[10px] font-mono text-blue-300">
              {facilities.length} ASSETS MONITORED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Empirical Thermal Baselines • Continuous Radiative Deviation Analytics • High-Asset Triage
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Asset Types</option>
            <option value="Refinery">Refinery</option>
            <option value="Chemical Plant">Chemical Plant</option>
            <option value="Steel Plant">Steel Plant</option>
            <option value="Power Plant">Power Plant</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CRITICAL">Critical Status</option>
            <option value="ELEVATED">Elevated Status</option>
            <option value="NORMAL">Normal Status</option>
          </select>
        </div>
      </div>

      {/* 2-Column Split: Facility List + Detailed Profile Drawer/Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Facility Cards List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono text-slate-400 flex justify-between items-center px-1">
            <span>Showing {filteredFacilities.length} Facilities</span>
            <span>Sorted by Thermal Risk</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredFacilities.map((fac) => {
              const isSelected = selectedFacility?.id === fac.id;
              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`group rounded-xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/80 bg-slate-900 shadow-lg shadow-cyan-950/50'
                      : 'border-slate-800/80 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-cyan-300 transition">
                          {fac.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-blue-300 font-mono">{fac.type}</span>
                        <span>•</span>
                        <span>{fac.location.city}, {fac.location.state}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <RiskBadge risk={fac.currentRisk} size="sm" />
                      <span className={`rounded px-2 py-0.5 text-[10px] font-mono border uppercase tracking-tight ${getStatusBadge(fac.currentStatus)}`}>
                        {fac.currentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/70 font-mono text-[11px] text-slate-400">
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Baseline FRP</span>
                      <span className="text-slate-300 font-semibold">{fac.baselineFRP} MW</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">30d Passes</span>
                      <span className="text-slate-300 font-semibold">{fac.totalEvents30d} passes</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Active Alerts</span>
                      <span className={`font-bold ${fac.activeAnomaliesCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {fac.activeAnomaliesCount} Active
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Facility Profile (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedFacility ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-6 shadow-2xl">
              {/* Profile Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-950 px-2 py-0.5 text-xs font-mono font-bold text-blue-300 border border-blue-500/30">
                      {selectedFacility.id}
                    </span>
                    <span className={`rounded px-2.5 py-0.5 text-xs font-mono border uppercase tracking-tight ${getStatusBadge(selectedFacility.currentStatus)}`}>
                      Status: {selectedFacility.currentStatus}
                    </span>
                    <RiskBadge risk={selectedFacility.currentRisk} size="md" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                    {selectedFacility.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                    <span>
                      {selectedFacility.location.lat.toFixed(4)}° N, {selectedFacility.location.lng.toFixed(4)}° E • {selectedFacility.location.city}, {selectedFacility.location.state}
                    </span>
                  </p>
                </div>

                {onNavigateToMapWithFacility && (
                  <button
                    onClick={() => onNavigateToMapWithFacility(selectedFacility)}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/80 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900 transition"
                  >
                    <span>Inspect on GIS Map</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Baseline Median</span>
                  <span className="text-lg font-bold text-white">{selectedFacility.baselineFRP} MW</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Std Deviation (σ)</span>
                  <span className="text-lg font-bold text-cyan-300">±{selectedFacility.baselineStdDev} MW</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Operator / Unit</span>
                  <span className="text-xs font-semibold text-slate-200 truncate block" title={selectedFacility.operator}>
                    {selectedFacility.operator}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Active Threat Events</span>
                  <span className={`text-lg font-bold ${selectedFacility.activeAnomaliesCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedFacility.activeAnomaliesCount} Event(s)
                  </span>
                </div>
              </div>

              {/* Interactive Thermal Fingerprint Time Series */}
              <ThermalFingerprintChart
                data={selectedFacility.historicalThermalHistory}
                currentFRP={facilityEvents[0]?.frp || selectedFacility.baselineFRP}
                baselineMedian={selectedFacility.baselineFRP}
                baselineSigma={facilityEvents[0]?.baselineDeviationSigma || 0.4}
                persistenceHours={facilityEvents[0]?.persistenceHours || 2.5}
                recurrenceCount30d={selectedFacility.totalEvents30d}
                facilityName={selectedFacility.name}
              />

              {/* Recent Detected Events at this Facility Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Recent Satellite Anomaly Events at this Facility ({facilityEvents.length})
                </h4>

                {facilityEvents.length > 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden text-xs">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                        <tr>
                          <th className="p-3">Event ID</th>
                          <th className="p-3">FRP</th>
                          <th className="p-3">Deviation</th>
                          <th className="p-3">Risk Level</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {facilityEvents.map((evt) => (
                          <tr key={evt.id} className="hover:bg-slate-900/60 transition">
                            <td className="p-3 font-bold text-amber-400">{evt.eventNumber}</td>
                            <td className="p-3 text-orange-300 font-semibold">{evt.frp} MW</td>
                            <td className="p-3 text-red-400 font-bold">+{evt.baselineDeviationSigma}σ</td>
                            <td className="p-3">
                              <RiskBadge risk={evt.riskLevel} size="sm" />
                            </td>
                            <td className="p-3 text-slate-300">{evt.reviewStatus}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => onSelectEvent(evt)}
                                className="rounded bg-cyan-950 border border-cyan-500/40 px-2.5 py-1 text-[11px] text-cyan-300 hover:bg-cyan-900 transition"
                              >
                                Deep Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 text-center text-xs text-slate-400 font-mono">
                    ✓ No anomalous thermal spikes recorded in the active satellite window. Facility is operating within normal ±2σ baseline envelopes.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500 font-mono text-xs">
              Select a facility on the left to inspect its detailed baseline fingerprint and event history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
