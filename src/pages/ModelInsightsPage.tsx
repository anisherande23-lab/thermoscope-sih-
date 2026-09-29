import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Database,
  Layers,
  Sparkles,
  Flame,
  Activity,
  ArrowRight,
  Cpu,
  Binary,
  Play,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Facility, ThermalEvent, AnomalyClassification } from '../types';
import { apiService } from '../services/api';
import { ShapExplanation } from '../components/ShapExplanation';
import { RiskBadge } from '../components/RiskBadge';
import { INDUSTRIAL_FACILITIES_REGISTRY } from '../ml/industrialRegistry';

interface ModelInsightsPageProps {
  facilities?: Facility[];
  onInjectAndInspectEvent?: (event: ThermalEvent) => void;
}

export const ModelInsightsPage: React.FC<ModelInsightsPageProps> = ({
  facilities = INDUSTRIAL_FACILITIES_REGISTRY,
  onInjectAndInspectEvent,
}) => {
  const [activePipelineStep, setActivePipelineStep] = useState(3);

  // Interactive Live ML Inference Sandbox State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('FAC-01');
  const [lat, setLat] = useState<number>(22.3628);
  const [lng, setLng] = useState<number>(69.8615);
  const [frp, setFrp] = useState<number>(36.5);
  const [ti4, setTi4] = useState<number>(368.0);
  const [ti5, setTi5] = useState<number>(303.5);
  const [persistence, setPersistence] = useState<number>(18);
  const [daynight, setDaynight] = useState<'D' | 'N'>('N');
  const [isRunning, setIsRunning] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<ThermalEvent | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(14.2);

  // Run initial inference on mount
  useEffect(() => {
    handleRunInference(false);
  }, []);

  const handlePresetChange = (facId: string) => {
    setSelectedPresetId(facId);
    if (facId === 'RURAL_AGRI') {
      setLat(29.545);
      setLng(76.962);
      setFrp(12.2);
      setTi4(324.0);
      setTi5(298.5);
      setPersistence(2.5);
      setDaynight('D');
      return;
    }
    const fac = facilities.find((f) => f.id === facId);
    if (fac) {
      setLat(Number((fac.location.lat + 0.0012).toFixed(4)));
      setLng(Number((fac.location.lng + 0.0014).toFixed(4)));
      const spikeFrp = Number((fac.baselineFRP + fac.baselineStdDev * 2.9).toFixed(1));
      setFrp(spikeFrp);
      setTi4(Number((312 + spikeFrp * 1.45).toFixed(1)));
      setTi5(302.5);
      setPersistence(16);
      setDaynight('N');
    }
  };

  const handleRunInference = async (injectToMap = false) => {
    setIsRunning(true);
    try {
      const res = await apiService.runLiveInference({
        latitude: lat,
        longitude: lng,
        frp,
        bright_ti4: ti4,
        bright_ti5: ti5,
        persistenceHours: persistence,
        daynight,
        confidence: 95,
        injectIntoMap: injectToMap,
      });
      setInferenceResult(res.event);
      setLatencyMs(res.pipelineLatencyMs || 14.2);
      if (injectToMap && onInjectAndInspectEvent) {
        onInjectAndInspectEvent(res.event);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const pipelineSteps = [
    {
      step: '01',
      title: 'NASA FIRMS Ingestion',
      subtitle: 'Raw VIIRS NOAA-20/21 (375m) & MODIS NRT Hotspots',
      description:
        'Ingests near real-time orbital swath CSV telemetry via NASA FIRMS NRT API across VIIRS NOAA-20/21, Suomi-NPP, and Terra/Aqua MODIS, extracting 3.74µm (Ti4) & 11.45µm (Ti5) brightness temperatures and Fire Radiative Power (MW).',
      icon: Database,
    },
    {
      step: '02',
      title: 'DBSCAN Spatial Clustering',
      subtitle: 'Coincident Multi-Pixel Source Grouping & Plume Geometry',
      description:
        'Groups adjacent 375m I-band pixel detections within ε=750m into candidate thermal emitters, computing cluster pixel count, spatial spread radius (m), and scan×track footprint area (km²).',
      icon: Binary,
    },
    {
      step: '03',
      title: 'OSM & Baseline Fusion',
      subtitle: 'Ray-Casting Polygon Containment + 90-Day Facility Fingerprint',
      description:
        'Tests point-in-polygon containment and Haversine distance against registered Indian industrial complexes, computing exact Z-score deviation (σ) relative to each plant’s 90-day empirical FRP baseline.',
      icon: Layers,
    },
    {
      step: '04',
      title: 'Calibrated GBDT Classifier',
      subtitle: '24-Feature Gradient Boosted Decision Trees + Isotonic Calibration',
      description:
        'Evaluates 24 engineered features across Thermal, Temporal, Spatial, and Spectral groups to compute calibrated posterior probabilities across 5 operational anomaly classes.',
      icon: Cpu,
    },
    {
      step: '05',
      title: 'Exact TreeSHAP Attribution',
      subtitle: 'Additive Shapley Log-Odds & Probability Decomposition',
      description:
        'Decomposes each prediction into exact feature-level Shapley contributions (φᵢ) from the facility prior expectation to the final calibrated risk score, eliminating black-box uncertainty.',
      icon: BrainCircuit,
    },
    {
      step: '06',
      title: 'Human-in-the-Loop Triage',
      subtitle: 'Evidence-Backed Operational Dispatch & Audit Trail',
      description:
        'Synthesizes multi-sensor evidence (VIIRS, OSM, Sentinel-2 SWIR B12) and queues high-risk anomalies for operator verification, false-positive dismissal, or HSE incident escalation.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white font-display">
          Model Intelligence & Live Inference Sandbox
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          24-Feature Engineering Pipeline · Calibrated 5-Class GBDT Ensemble · Interactive TreeSHAP Verification
        </p>
      </div>

      {/* INTERACTIVE LIVE ML INFERENCE & SHAP SANDBOX */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 sm:p-6 space-y-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <span>Interactive Live ML Inference & TreeSHAP Sandbox</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Modify satellite telemetry inputs below to execute real-time 24-feature extraction, GBDT classification, and TreeSHAP attribution via POST /api/ml/predict
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-400">
            <span>Pipeline Latency: <strong className="text-emerald-400">{latencyMs} ms</strong></span>
            <span>·</span>
            <span>Features: <strong className="text-cyan-300">24 Vectors</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Parameter Controls */}
          <div className="lg:col-span-5 space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase text-slate-400 block">
                1. Target Industrial Facility / Location Preset
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (Baseline: {f.baselineFRP}±{f.baselineStdDev} MW)
                  </option>
                ))}
                <option value="RURAL_AGRI">
                  Exterior Rural Buffer (7.8km Outside Facility — Crop Stubble Test)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 tabular-nums">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* FRP Slider */}
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between">
                <span className="text-[11px] text-slate-300">Fire Radiative Power (FRP):</span>
                <span className="font-bold text-orange-400">{frp.toFixed(1)} MW</span>
              </div>
              <input
                type="range"
                min={2}
                max={75}
                step={0.5}
                value={frp}
                onChange={(e) => setFrp(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Brightness Temp Ti4 Slider */}
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between">
                <span className="text-[11px] text-slate-300">VIIRS Brightness Temp (Ti4 3.74µm):</span>
                <span className="font-bold text-red-400">{ti4.toFixed(1)} K</span>
              </div>
              <input
                type="range"
                min={305}
                max={410}
                step={0.5}
                value={ti4}
                onChange={(e) => setTi4(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Persistence & Day/Night */}
            <div className="grid grid-cols-2 gap-3 tabular-nums">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">
                  Persistence (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={persistence}
                  onChange={(e) => setPersistence(parseFloat(e.target.value) || 2)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">
                  Overpass Mode
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDaynight('N')}
                    className={`rounded py-1 text-[11px] font-semibold transition ${
                      daynight === 'N' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Night (N)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaynight('D')}
                    className={`rounded py-1 text-[11px] font-semibold transition ${
                      daynight === 'D' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Day (D)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => handleRunInference(false)}
                disabled={isRunning}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 py-2.5 px-4 text-xs font-bold text-slate-950 transition whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isRunning ? 'Evaluating...' : 'Run Live ML Inference'}</span>
              </button>

              {onInjectAndInspectEvent && (
                <button
                  onClick={() => handleRunInference(true)}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 py-2.5 px-3.5 text-xs font-bold text-amber-300 transition whitespace-nowrap"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Inject & View on Map</span>
                </button>
              )}
            </div>
          </div>

          {/* Right 7 Cols: Real-Time Model Output & SHAP Waterfall */}
          <div className="lg:col-span-7 space-y-4">
            {inferenceResult && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[10px] uppercase text-slate-400 block mb-1">
                      Risk Tier
                    </span>
                    <RiskBadge risk={inferenceResult.riskLevel} size="sm" showPulse />
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[10px] uppercase text-slate-400 block mb-1">
                      Calibrated Score
                    </span>
                    <span className="text-lg font-bold text-amber-400">
                      {inferenceResult.modelProbability.toFixed(1)}%
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[10px] uppercase text-slate-400 block mb-1">
                      Baseline Z-Score
                    </span>
                    <span className="text-lg font-bold text-red-400">
                      {inferenceResult.baselineDeviationSigma >= 0 ? '+' : ''}
                      {inferenceResult.baselineDeviationSigma}σ
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[10px] uppercase text-slate-400 block mb-1">
                      Matched Distance
                    </span>
                    <span className="text-lg font-bold text-cyan-300">
                      {inferenceResult.distanceFromFacilityMeters} m
                    </span>
                  </div>
                </div>

                {/* 5-Class Posterior Bar */}
                {inferenceResult.classProbabilities && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2 font-mono text-xs tabular-nums">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Predicted Class: <strong className="text-white">{inferenceResult.classification}</strong></span>
                      <span>Facility: <strong className="text-cyan-300">{inferenceResult.facilityName.split(' (')[0]}</strong></span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                      {(
                        Object.entries(inferenceResult.classProbabilities) as [
                          AnomalyClassification,
                          number,
                        ][]
                      ).map(([cls, prob]) => (
                        <div key={cls} className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between text-slate-300">
                            <span className="truncate pr-2">{cls}</span>
                            <span className="font-bold text-amber-300">{prob.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cls === inferenceResult.classification
                                  ? 'bg-cyan-400'
                                  : 'bg-slate-700'
                              }`}
                              style={{ width: `${Math.min(100, prob)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ShapExplanation
                  shapFeatures={inferenceResult.shapFeatures}
                  naturalLanguageExplanation={inferenceResult.naturalLanguageExplanation}
                  modelProbability={inferenceResult.modelProbability}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* PIPELINE WALKTHROUGH SECTION */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/30">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Intelligence Pipeline: DETECT → CONTEXTUALIZE → CLASSIFY → EXPLAIN → MONITOR → ALERT
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Click any processing stage to inspect its mathematical and geospatial transformations
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {pipelineSteps.map((item, index) => {
            const Icon = item.icon;
            const isSelected = activePipelineStep === index;
            return (
              <div
                key={item.step}
                onClick={() => setActivePipelineStep(index)}
                className={`relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-800/90 ring-1 ring-cyan-500/40'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {item.step}.
                    </span>
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`} />
                  </div>
                  <h3 className="font-semibold text-xs text-white leading-tight">
                    {item.title}
                  </h3>
                </div>

                {index < pipelineSteps.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4 sm:p-5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-cyan-400 font-bold text-sm">
            <span>{pipelineSteps[activePipelineStep].step}.</span>
            <span>{pipelineSteps[activePipelineStep].title}</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            {pipelineSteps[activePipelineStep].subtitle}
          </div>
          <p className="text-slate-200 leading-relaxed text-sm pt-1">
            {pipelineSteps[activePipelineStep].description}
          </p>
        </div>
      </div>

      {/* FEATURE ENGINEERING TAXONOMY (4 Groups) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-base font-bold text-white font-display">
            24 Engineered Feature Groups
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Multi-Domain Input Vectors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-400 border-b border-slate-800 pb-2">
              <Flame className="h-4 w-4" />
              <span className="font-bold">01. Thermal Features (7)</span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Fire Radiative Power (FRP)</strong>
                <span className="text-[11px] text-slate-400">Quantitative radiative emission rate in MW</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Brightness Temp (Ti4 3.74µm)</strong>
                <span className="text-[11px] text-slate-400">Mid-infrared sub-pixel combustion core</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Dual-Band Contrast (Ti4 - Ti5)</strong>
                <span className="text-[11px] text-slate-400">Isolates industrial heat from ambient ground</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Radiative Power Density</strong>
                <span className="text-[11px] text-slate-400">MW normalized by scan × track pixel area</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-2">
              <Activity className="h-4 w-4" />
              <span className="font-bold">02. Temporal Features (6)</span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex flex-col">
                <strong className="text-white font-semibold">90-Day Baseline Deviation (σ)</strong>
                <span className="text-[11px] text-slate-400">Z-score above facility empirical FRP median</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Continuous Persistence (Hrs)</strong>
                <span className="text-[11px] text-slate-400">Duration across sequential polar passes</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">30-Day Pass Recurrence</strong>
                <span className="text-[11px] text-slate-400">Historical frequency of thermal detections</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Nocturnal Pass Indicator</strong>
                <span className="text-[11px] text-slate-400">Eliminates daytime solar roof glint</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-800 pb-2">
              <Layers className="h-4 w-4" />
              <span className="font-bold">03. Spatial Features (6)</span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Facility Centroid Distance (m)</strong>
                <span className="text-[11px] text-slate-400">Exact Haversine geodesic distance</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Polygon Containment Check</strong>
                <span className="text-[11px] text-slate-400">Ray-casting test inside OSM industrial fence</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">DBSCAN Cluster Footprint</strong>
                <span className="text-[11px] text-slate-400">Coincident pixel count & plume spread (m)</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Flare Stack Offset Distance</strong>
                <span className="text-[11px] text-slate-400">Separates tank/process fires from flare tips</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 border-b border-slate-800 pb-2">
              <Cpu className="h-4 w-4" />
              <span className="font-bold">04. Context & Spectral (5)</span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex flex-col">
                <strong className="text-white font-semibold">OSM Industrial Zoning Score</strong>
                <span className="text-[11px] text-slate-400">Refinery, Petrochemical, Steel, Power Plant</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Sentinel-2 SWIR B12 Index</strong>
                <span className="text-[11px] text-slate-400">2.19µm shortwave infrared active combustion</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">NDVI Biomass Suppression</strong>
                <span className="text-[11px] text-slate-400">Separates crop stubble/forest from impervious</span>
              </li>
              <li className="flex flex-col">
                <strong className="text-white font-semibold">Atmospheric Transmittance (τ)</strong>
                <span className="text-[11px] text-slate-400">Water vapor & aerosol attenuation factor</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
