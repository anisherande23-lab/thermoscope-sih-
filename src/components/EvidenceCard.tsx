import React from 'react';
import { SatelliteEvidence, EvidenceStatus } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Database, Satellite, Building2, History } from 'lucide-react';

interface EvidenceCardProps {
  evidence: SatelliteEvidence;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'SUPPORTING':
        return {
          icon: CheckCircle2,
          text: 'Supporting',
          classes: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
        };
      case 'LIMITED':
        return {
          icon: AlertTriangle,
          text: 'Limited / Coarse',
          classes: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
        };
      case 'UNAVAILABLE':
      default:
        return {
          icon: XCircle,
          text: 'Unavailable',
          classes: 'bg-slate-900 border-slate-700 text-slate-400',
        };
    }
  };

  const getSourceIcon = () => {
    switch (evidence.source) {
      case 'NASA_FIRMS':
        return Satellite;
      case 'OSM_CONTEXT':
        return Building2;
      case 'SENTINEL2_SWIR':
      case 'LANDSAT_TIRS':
        return Database;
      case 'HISTORICAL_BASELINE':
      default:
        return History;
    }
  };

  const statusConfig = getStatusBadge(evidence.status);
  const StatusIcon = statusConfig.icon;
  const SourceIcon = getSourceIcon();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5 transition-colors hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-slate-900 p-1.5 text-cyan-400 border border-slate-800">
            <SourceIcon className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200">{evidence.title}</span>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-tight ${statusConfig.classes}`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusConfig.text}
        </span>
      </div>

      {/* Key-Value Details */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-slate-900/60 p-2.5 text-[11px] font-mono border border-slate-800/80">
        {Object.entries(evidence.details).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-tight">{key}</span>
            <span className="text-slate-200 font-medium truncate" title={String(val)}>
              {String(val)}
            </span>
          </div>
        ))}
      </div>

      {evidence.notes && (
        <p className="text-[11px] text-slate-400 italic pl-1 leading-snug">{evidence.notes}</p>
      )}
    </div>
  );
};
