import React from 'react';
import { ShapFeature } from '../types';
import { Sparkles, Info, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ShapExplanationProps {
  shapFeatures: ShapFeature[];
  naturalLanguageExplanation: string;
  modelProbability: number;
}

export const ShapExplanation: React.FC<ShapExplanationProps> = ({
  shapFeatures,
  naturalLanguageExplanation,
  modelProbability,
}) => {
  // Sort by absolute contribution descending
  const sortedFeatures = [...shapFeatures].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  const maxContribution = Math.max(
    ...sortedFeatures.map((f) => Math.abs(f.contribution)),
    0.35
  );

  const getCategoryBadge = (cat: ShapFeature['category']) => {
    switch (cat) {
      case 'thermal':
        return 'bg-red-500/10 text-red-300 border-red-500/30';
      case 'temporal':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'spatial':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'context':
      default:
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-400 border border-amber-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-white">
              Why did the model flag this event?
            </h4>
            <p className="text-[11px] text-slate-400">
              SHAP (SHapley Additive exPlanations) Feature Attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-300 border border-slate-700">
          <span>P(Risk):</span>
          <span className="font-bold text-amber-400">{modelProbability.toFixed(1)}%</span>
        </div>
      </div>

      {/* Natural Language Synthesis Box */}
      <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-3.5 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-200 uppercase tracking-wide text-[10px] block mb-1">
              Automated Diagnostic Summary
            </span>
            <p className="text-slate-200">{naturalLanguageExplanation}</p>
          </div>
        </div>
      </div>

      {/* Horizontal SHAP Waterfall Bars */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/60 pb-1.5">
          <span>Feature & Measurement</span>
          <span>SHAP Impact (Δ log-odds)</span>
        </div>

        {sortedFeatures.map((feat, index) => {
          const isPositive = feat.contribution >= 0;
          const percentage = Math.min(100, Math.round((Math.abs(feat.contribution) / maxContribution) * 100));

          return (
            <div key={index} className="group space-y-1 rounded-md p-1.5 transition-colors hover:bg-slate-800/40">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] uppercase font-mono border ${getCategoryBadge(
                      feat.category
                    )}`}
                  >
                    {feat.category}
                  </span>
                  <span className="font-medium text-slate-200 truncate" title={feat.featureName}>
                    {feat.featureName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-slate-400 text-[11px]">[{String(feat.value)}]</span>
                  <span
                    className={`flex items-center font-semibold ${
                      isPositive ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3 inline" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 inline" />
                    )}
                    {isPositive ? '+' : ''}
                    {feat.contribution.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden relative border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPositive
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-sm shadow-red-500/50'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-sm shadow-emerald-500/50'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {feat.description && (
                <p className="text-[10px] text-slate-400 pl-1">{feat.description}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3 text-slate-400" />
          Calibrated XGBoost / LightGBM + TreeSHAP
        </span>
        <span className="font-mono text-slate-400">Baseline = Prior Facility Prior</span>
      </div>
    </div>
  );
};
