import React, { useState } from 'react';
import { ThermalEvent, Facility, ReviewStatus, AnomalyClassification } from '../types';
import { RiskBadge, StatusBadge } from './RiskBadge';
import { ShapExplanation } from './ShapExplanation';
import { ThermalFingerprintChart } from './ThermalFingerprintChart';
import { EvidenceCard } from './EvidenceCard';
import {
  X,
  Building2,
  Flame,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Cpu,
} from 'lucide-react';

interface EventDetailsPanelProps {
  event: ThermalEvent | null;
  facility?: Facility | null;
  onClose: () => void;
  onVerify: (eventId: string, status: ReviewStatus, notes?: string) => Promise<void>;
  facilityThermalHistory?: any[];
}

export const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({
  event,
  facility,
  onClose,
  onVerify,
  facilityThermalHistory = [],
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'shap' | 'fingerprint' | 'evidence'>('overview');
  const [showActionSuccess, setShowActionSuccess] = useState<string | null>(null);

  if (!event) return null;

  const handleAction = async (status: ReviewStatus, defaultNote: string) => {
    setIsVerifying(true);
    try {
      await onVerify(event.id, status, verificationNote || defaultNote);
      setShowActionSuccess(`Event status updated to ${status}`);
      setTimeout(() => setShowActionSuccess(null), 3500);
      setVerificationNote('');
    } finally {
      setIsVerifying(false);
    }
  };

  const baselineMedian = facility?.baselineFRP ?? 12.4;

  return (
    <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-950/98 shadow-2xl backdrop-blur-xl z-30 overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:px-6 bg-slate-900/60">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-amber-400">{event.eventNumber}</span>
            <span className="text-slate-600">·</span>
            <RiskBadge risk={event.riskLevel} size="sm" showPulse />
            <span className="text-slate-600">·</span>
            <StatusBadge status={event.reviewStatus} size="sm" />
          </div>
          <h2 className="text-base font-bold text-white tracking-wide truncate max-w-md">
            {event.title}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Close Inspector"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Action Notification Toast */}
      {showActionSuccess && (
        <div className="bg-emerald-950 border-b border-emerald-500/50 p-2.5 px-6 flex items-center gap-2 text-xs font-mono text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{showActionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-4 sm:px-6 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Triage
        </button>
        <button
          onClick={() => setActiveTab('shap')}
          className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'shap'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          SHAP & 24 Features
        </button>
        <button
          onClick={() => setActiveTab('fingerprint')}
          className={`py-3 px-3 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === 'fingerprint'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Thermal Baseline
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-3 px-3 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Evidence ({event.evidenceList.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: OVERVIEW & DECISION */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Top ML Diagnostic Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Risk Probability
                </span>
                <span className="text-xl font-bold text-amber-400">
                  {event.modelProbability.toFixed(1)}%
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Sensor Confidence
                </span>
                <span className="text-xl font-bold text-cyan-400">
                  {event.confidenceScore}%
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Observed FRP
                </span>
                <span className="text-xl font-bold text-orange-400">
                  {event.frp.toFixed(1)} MW
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Baseline Z-Score
                </span>
                <span className="text-xl font-bold text-red-400">
                  {event.baselineDeviationSigma >= 0 ? '+' : ''}
                  {event.baselineDeviationSigma}σ
                </span>
              </div>
            </div>

            {/* Classification & 5-Class Calibrated Posterior Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span>ML Anomaly Classification</span>
                <span className="text-cyan-400">Calibrated GBDT Ensemble</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500 shrink-0" />
                <span>{event.classification}</span>
              </div>

              {event.classProbabilities && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono text-[11px] tabular-nums">
                  <div className="text-[10px] text-slate-400 uppercase">
                    5-Class Posterior Probability Distribution
                  </div>
                  {(Object.entries(event.classProbabilities) as [AnomalyClassification, number][]).map(
                    ([clsName, prob]) => (
                      <div key={clsName} className="space-y-0.5">
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate pr-2">{clsName}</span>
                          <span className="font-semibold text-slate-200">{prob.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              clsName === event.classification ? 'bg-cyan-400' : 'bg-slate-700'
                            }`}
                            style={{ width: `${Math.min(100, prob)}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Associated Facility Info Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Associated Industrial Facility
                </span>
                <span className="text-xs font-mono text-blue-300">
                  {event.facilityType}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Facility Name:</span>
                  <span className="font-sans font-semibold text-white">{event.facilityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Coordinates:</span>
                  <span className="text-slate-300">
                    {event.location.lat.toFixed(5)}° N, {event.location.lng.toFixed(5)}° E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Spatial Proximity:</span>
                  <span className="text-cyan-300">
                    {event.distanceFromFacilityMeters} m ·{' '}
                    {event.insideFacilityBoundary !== false ? 'Inside Parcel Polygon' : 'Exterior Buffer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">DBSCAN Cluster & Temp:</span>
                  <span className="text-slate-300">
                    {event.clusterSize || 3} px ({event.spatialSpreadMeters || 450}m) · Ti4 {event.brightnessTempTi4} K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Satellite & Overpass:</span>
                  <span className="text-slate-300">
                    {event.satellite} · {new Date(event.detectedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
                  </span>
                </div>
              </div>
            </div>

            {/* Quick SHAP Preview */}
            <ShapExplanation
              shapFeatures={event.shapFeatures}
              naturalLanguageExplanation={event.naturalLanguageExplanation}
              modelProbability={event.modelProbability}
            />

            {/* HUMAN-IN-THE-LOOP VERIFICATION SECTION */}
            <div className="rounded-xl border border-amber-500/30 bg-slate-900/70 p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/30 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Human-in-the-Loop Operational Decision
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    AI assessments provide calibrated decision support. Operational dispatch requires operator validation.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Recommended Action:</span>
                  <span className="font-semibold text-amber-300 text-right">{event.recommendedAction}</span>
                </div>
                {event.verifiedBy && (
                  <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                    <span>Verified By: {event.verifiedBy}</span>
                    <span>{new Date(event.verifiedAt || '').toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Optional Notes Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400">
                  Verification Log / Operator Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Confirmed with plant shift supervisor..."
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  disabled={isVerifying}
                  onClick={() => handleAction('VERIFIED', 'Operator verified abnormal industrial thermal event.')}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-3 text-xs font-bold text-white transition disabled:opacity-50 whitespace-nowrap"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Event
                </button>

                <button
                  disabled={isVerifying}
                  onClick={() => handleAction('DISMISSED', 'Dismissed by operator as nominal flare or non-hazard.')}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 py-2.5 px-3 text-xs font-semibold text-slate-300 border border-slate-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  <X className="h-4 w-4" />
                  False Positive
                </button>

                <button
                  disabled={isVerifying}
                  onClick={() => handleAction('ESCALATED', 'Escalated to disaster management and emergency response command.')}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 py-2.5 px-3 text-xs font-bold text-white transition disabled:opacity-50 whitespace-nowrap"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalate Incident
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHAP DEEP DIVE & 24-FEATURE VECTOR */}
        {activeTab === 'shap' && (
          <div className="space-y-5">
            <ShapExplanation
              shapFeatures={event.shapFeatures}
              naturalLanguageExplanation={event.naturalLanguageExplanation}
              modelProbability={event.modelProbability}
            />

            {/* 24-Feature Vector Table */}
            {event.engineeredFeatures && event.engineeredFeatures.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-white uppercase font-mono flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                    24-Feature Engineered Input Vector
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Base Prior: {event.shapBaseValue ?? 29.9}% → Final: {event.modelProbability.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
                  {event.engineeredFeatures.map((feat) => (
                    <div
                      key={feat.key}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-2.5 py-1.5"
                    >
                      <span className="text-slate-400 truncate pr-2" title={feat.label}>
                        {feat.label}
                      </span>
                      <span className="font-semibold text-cyan-300 shrink-0">
                        {feat.value} {feat.unit !== 'bool' && feat.unit !== 'flag' ? feat.unit : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 text-xs text-slate-300">
              <h5 className="font-semibold text-white uppercase font-mono text-[11px] flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-cyan-400" />
                TreeSHAP Additive Attribution Guarantee
              </h5>
              <p className="leading-relaxed text-slate-400">
                TreeSHAP computes exact Shapley values over the gradient boosted decision trees. The sum of feature contributions plus the empirical facility prior log-odds equals the exact calibrated posterior probability.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: THERMAL FINGERPRINT */}
        {activeTab === 'fingerprint' && (
          <div className="space-y-4">
            <ThermalFingerprintChart
              data={facilityThermalHistory}
              currentFRP={event.frp}
              baselineMedian={baselineMedian}
              baselineSigma={event.baselineDeviationSigma}
              persistenceHours={event.persistenceHours}
              recurrenceCount30d={event.recurrenceCount30d}
              facilityName={event.facilityName}
            />
          </div>
        )}

        {/* TAB 4: EVIDENCE FUSION */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 leading-relaxed pb-1">
              Multi-sensor geospatial evidence fusion cross-references NASA FIRMS thermal observations against OpenStreetMap industrial parcel geometry, 90-day empirical thermal baselines, and Sentinel-2 SWIR Band 12 reflectance.
            </div>

            {event.evidenceList.map((ev, idx) => (
              <EvidenceCard key={idx} evidence={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
