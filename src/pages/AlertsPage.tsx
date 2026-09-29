import React, { useState } from 'react';
import { AlertItem, ReviewStatus, RiskLevel, ThermalEvent } from '../types';
import { RiskBadge, StatusBadge } from '../components/RiskBadge';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  X,
  Radio,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Send,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface AlertsPageProps {
  alerts: AlertItem[];
  events: ThermalEvent[];
  onSelectEventById: (eventId: string) => void;
  onUpdateAlertStatus: (alertId: string, status: ReviewStatus) => Promise<void>;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  events,
  onSelectEventById,
  onUpdateAlertStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        alert.eventNumber.toLowerCase().includes(q) ||
        alert.facilityName.toLowerCase().includes(q) ||
        alert.classification.toLowerCase().includes(q) ||
        alert.recommendedAction.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
    if (riskFilter !== 'ALL' && alert.risk !== riskFilter) return false;

    return true;
  });

  const handleStatusChange = async (alertId: string, status: ReviewStatus) => {
    setLoadingActionId(alertId);
    try {
      await onUpdateAlertStatus(alertId, status);
    } finally {
      setLoadingActionId(null);
    }
  };

  const pendingCount = alerts.filter((a) => a.status === 'REQUIRES_REVIEW').length;
  const escalatedCount = alerts.filter((a) => a.status === 'ESCALATED').length;
  const verifiedCount = alerts.filter((a) => a.status === 'VERIFIED').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Alerts Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white font-display">
              Thermal Threat & Alert Management
            </h1>
            <span className="rounded-md bg-red-950 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono text-red-300">
              OPERATIONAL TRIAGE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated Satellite Hotspot Triage • Risk Priority Ranking • Operator Incident Dispatch
          </p>
        </div>

        {/* Triage summary count badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/60 px-3 py-1.5 text-amber-300">
            <strong className="text-white">{pendingCount}</strong> Pending
          </div>
          <div className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-1.5 text-red-300">
            <strong className="text-white">{escalatedCount}</strong> Escalated
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-3 py-1.5 text-emerald-300">
            <strong className="text-white">{verifiedCount}</strong> Verified
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter alerts by ID, facility, or classification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Statuses ({alerts.length})</option>
            <option value="REQUIRES_REVIEW">Requires Review ({pendingCount})</option>
            <option value="ESCALATED">Escalated ({escalatedCount})</option>
            <option value="VERIFIED">Verified ({verifiedCount})</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="ELEVATED">Elevated Risk</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Alert ID / Time</th>
                <th className="p-3.5">Facility & Classification</th>
                <th className="p-3.5">Thermal Output</th>
                <th className="p-3.5">Risk & Model Score</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Recommended HSE Action</th>
                <th className="p-3.5 pr-4 text-right">Quick Triage</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-slate-900/80 transition-colors group"
                  >
                    {/* Alert ID & Time */}
                    <td className="p-3.5 pl-4 align-top">
                      <div className="font-bold text-amber-400">{alert.eventNumber}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{alert.time}</span>
                      </div>
                    </td>

                    {/* Facility & Classification */}
                    <td className="p-3.5 align-top max-w-xs">
                      <div
                        onClick={() => onSelectEventById(alert.eventId)}
                        className="font-bold text-white hover:text-cyan-300 cursor-pointer transition truncate flex items-center gap-1.5"
                      >
                        <span>{alert.facilityName}</span>
                        <ExternalLink className="h-3 w-3 text-slate-500 inline opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {alert.classification}
                      </div>
                    </td>

                    {/* Thermal Output & Deviation */}
                    <td className="p-3.5 align-top whitespace-nowrap">
                      <div className="text-orange-300 font-bold">{alert.frp} MW</div>
                      <div className="text-[11px] text-red-400 font-semibold">{alert.baselineDeviation}</div>
                    </td>

                    {/* Risk & Model Probability */}
                    <td className="p-3.5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <RiskBadge risk={alert.risk} size="sm" showPulse />
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Prob: <strong className="text-amber-400">{alert.probability.toFixed(1)}%</strong>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 align-top whitespace-nowrap">
                      <StatusBadge status={alert.status} size="sm" />
                    </td>

                    {/* Recommended Action */}
                    <td className="p-3.5 align-top text-slate-300 text-[11px] max-w-xs">
                      <p className="line-clamp-2">{alert.recommendedAction}</p>
                    </td>

                    {/* Quick Triage Actions */}
                    <td className="p-3.5 pr-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectEventById(alert.eventId)}
                          title="Open Full Inspector"
                          className="rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          disabled={loadingActionId === alert.id}
                          onClick={() => handleStatusChange(alert.id, 'VERIFIED')}
                          title="Verify Event"
                          className="rounded bg-emerald-950 border border-emerald-500/40 p-1.5 text-emerald-300 hover:bg-emerald-900 transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          disabled={loadingActionId === alert.id}
                          onClick={() => handleStatusChange(alert.id, 'DISMISSED')}
                          title="Dismiss as False Positive"
                          className="rounded bg-slate-900 border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <button
                          disabled={loadingActionId === alert.id}
                          onClick={() => handleStatusChange(alert.id, 'ESCALATED')}
                          title="Escalate Alert"
                          className="rounded bg-red-950 border border-red-500/40 p-1.5 text-red-300 hover:bg-red-900 transition disabled:opacity-50"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No alerts match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
