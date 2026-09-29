import React, { useState } from 'react';
import { FilterOptions, RiskLevel, AnomalyClassification, FacilityType, ReviewStatus } from '../types';
import {
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  Layers,
  Flame,
  Building2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  isOpen = true,
  onToggleOpen,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const riskOptions: RiskLevel[] = ['CRITICAL', 'HIGH', 'ELEVATED', 'MODERATE', 'LOW'];

  const classificationOptions: AnomalyClassification[] = [
    'Probable Abnormal Industrial Thermal Event',
    'Probable Industrial Flare',
    'Possible Wildfire',
    'Possible Agricultural Burning',
    'Uncertain / Unconfirmed Source',
  ];

  const facilityTypeOptions: FacilityType[] = [
    'Refinery',
    'Petrochemical',
    'Chemical Plant',
    'Steel Plant',
    'Power Plant',
    'Manufacturing',
    'Other',
  ];

  const reviewStatusOptions: ReviewStatus[] = [
    'REQUIRES_REVIEW',
    'VERIFIED',
    'DISMISSED',
    'ESCALATED',
  ];

  const toggleRisk = (risk: RiskLevel) => {
    const exists = localFilters.riskLevels.includes(risk);
    const updated = exists
      ? localFilters.riskLevels.filter((r) => r !== risk)
      : [...localFilters.riskLevels, risk];
    const newF = { ...localFilters, riskLevels: updated };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const toggleClassification = (cls: AnomalyClassification) => {
    const exists = localFilters.classifications.includes(cls);
    const updated = exists
      ? localFilters.classifications.filter((c) => c !== cls)
      : [...localFilters.classifications, cls];
    const newF = { ...localFilters, classifications: updated };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const toggleFacilityType = (type: FacilityType) => {
    const exists = localFilters.facilityTypes.includes(type);
    const updated = exists
      ? localFilters.facilityTypes.filter((t) => t !== type)
      : [...localFilters.facilityTypes, type];
    const newF = { ...localFilters, facilityTypes: updated };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const toggleReviewStatus = (status: ReviewStatus) => {
    const exists = localFilters.reviewStatuses.includes(status);
    const updated = exists
      ? localFilters.reviewStatuses.filter((s) => s !== status)
      : [...localFilters.reviewStatuses, status];
    const newF = { ...localFilters, reviewStatuses: updated };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const handleTimeRangeChange = (range: FilterOptions['timeRange']) => {
    const newF = { ...localFilters, timeRange: range };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const handleConfidenceChange = (val: number) => {
    const newF = { ...localFilters, minConfidence: val };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const handleSearchChange = (q: string) => {
    const newF = { ...localFilters, searchQuery: q };
    setLocalFilters(newF);
    onFilterChange(newF);
  };

  const handleReset = () => {
    onResetFilters();
    setLocalFilters({
      searchQuery: '',
      riskLevels: [],
      classifications: [],
      facilityTypes: [],
      timeRange: 'all',
      minConfidence: 0,
      reviewStatuses: [],
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute left-3 top-20 z-20 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-cyan-300 shadow-xl backdrop-blur-md hover:bg-slate-800 transition"
      >
        <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
        <span>Filters ({filteredCount}/{totalCount})</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative flex h-full w-80 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-lg z-20 shadow-2xl transition-all duration-300 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-cyan-500/10 p-1.5 text-cyan-400 border border-cyan-500/30">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white">
              ANOMALY FILTERS
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">
              Showing {filteredCount} of {totalCount} events
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            title="Reset Filters"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {onToggleOpen && (
            <button
              onClick={onToggleOpen}
              title="Collapse Panel"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Filters Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Search Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            Search Hotspot or Facility
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. TH-1042, Jamnagar, Refinery..."
              value={localFilters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Risk Level Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-red-400" />
              Risk Level
            </span>
            {localFilters.riskLevels.length > 0 && (
              <span className="text-[10px] text-cyan-400 font-mono">
                {localFilters.riskLevels.length} active
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {riskOptions.map((risk) => {
              const active = localFilters.riskLevels.includes(risk);
              return (
                <button
                  key={risk}
                  onClick={() => toggleRisk(risk)}
                  className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition ${
                    active
                      ? risk === 'CRITICAL'
                        ? 'bg-red-950 border-red-500 text-red-200 font-bold'
                        : risk === 'HIGH'
                        ? 'bg-orange-950 border-orange-500 text-orange-200 font-bold'
                        : risk === 'ELEVATED'
                        ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold'
                        : risk === 'MODERATE'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <span>{risk}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Classification Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              ML Classification
            </span>
            {localFilters.classifications.length > 0 && (
              <span className="text-[10px] text-cyan-400 font-mono">
                {localFilters.classifications.length} active
              </span>
            )}
          </label>
          <div className="space-y-1">
            {classificationOptions.map((cls) => {
              const active = localFilters.classifications.includes(cls);
              return (
                <button
                  key={cls}
                  onClick={() => toggleClassification(cls)}
                  className={`w-full text-left rounded-md border px-2.5 py-1.5 text-xs transition truncate ${
                    active
                      ? 'bg-slate-800 border-cyan-500/70 text-cyan-200 font-medium'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        </div>

        {/* Facility Type Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
              Facility Type (OSM)
            </span>
            {localFilters.facilityTypes.length > 0 && (
              <span className="text-[10px] text-cyan-400 font-mono">
                {localFilters.facilityTypes.length} active
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {facilityTypeOptions.map((type) => {
              const active = localFilters.facilityTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleFacilityType(type)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    active
                      ? 'bg-blue-950 border-blue-500 text-blue-200 font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Window */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-purple-400" />
            Time Observation Window
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800 font-mono text-[11px]">
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`rounded py-1 font-semibold uppercase transition ${
                  localFilters.timeRange === range
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Minimum Model Confidence</span>
            <span className="font-bold text-cyan-400">{localFilters.minConfidence}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={95}
            step={5}
            value={localFilters.minConfidence}
            onChange={(e) => handleConfidenceChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0% (All data)</span>
            <span>50%</span>
            <span>95% (High Precision)</span>
          </div>
        </div>

        {/* Review Status Filter */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
              Operational Review Status
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {reviewStatusOptions.map((st) => {
              const active = localFilters.reviewStatuses.includes(st);
              const label =
                st === 'REQUIRES_REVIEW'
                  ? 'Pending Review'
                  : st === 'VERIFIED'
                  ? 'Verified'
                  : st === 'DISMISSED'
                  ? 'Dismissed'
                  : 'Escalated';
              return (
                <button
                  key={st}
                  onClick={() => toggleReviewStatus(st)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] font-mono transition text-center truncate ${
                    active
                      ? 'bg-slate-800 border-cyan-400 text-cyan-300 font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="border-t border-slate-800 p-4 bg-slate-950 flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          Reset All
        </button>
        <button
          onClick={() => onFilterChange(localFilters)}
          className="flex-1 rounded-lg bg-cyan-500 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};
