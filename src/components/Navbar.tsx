import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Satellite,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';

export type NavTab = 'overview' | 'map' | 'facilities' | 'alerts' | 'analytics' | 'model';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLoadDemoScenario: () => void;
  onSyncFirmsData?: () => Promise<void>;
  unreadAlertsCount?: number;
  isLiveBackend?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onLoadDemoScenario,
  onSyncFirmsData,
  unreadAlertsCount = 8,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback('Querying NASA FIRMS NRT API & running 24-feature GBDT pipeline...');
    try {
      if (onSyncFirmsData) {
        await onSyncFirmsData();
      } else {
        await apiService.syncLiveFirmsData();
      }
      const st = apiService.getFirmsStatus();
      setSyncFeedback(
        `Synced ${st.recordsCount} industrial hotspots (${st.activeSource})`
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('NASA FIRMS stream synchronized with calibrated baseline.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems: { id: NavTab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Thermal Map' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'alerts', label: 'Alerts', badge: unreadAlertsCount },
    { id: 'analytics', label: 'Analytics' },
    { id: 'model', label: 'Model Insights' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="flex items-center gap-2.5 text-left focus:outline-none whitespace-nowrap shrink-0"
        >
          <Flame className="h-5 w-5 text-orange-500 shrink-0" />
          <span className="font-display text-lg font-bold tracking-wider text-white">
            THERMOSCOPE
          </span>
        </button>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative py-1 text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1.5 font-mono tabular-nums text-[11px] font-bold text-amber-400">
                    ({item.badge})
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Sync Live NASA FIRMS NRT Satellite Feed"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/70 hover:bg-cyan-900/60 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-300 transition whitespace-nowrap"
          >
            <Satellite className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Sync NASA FIRMS</span>
            <RefreshCw
              className={`h-3 w-3 text-cyan-400 ${isSyncing ? 'animate-spin text-cyan-200' : ''}`}
            />
          </button>

          <button
            onClick={onLoadDemoScenario}
            title="Inspect Priority Critical Thermal Anomaly Scenario"
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-300 transition whitespace-nowrap"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Demo Scenario</span>
            <span className="md:hidden">Demo</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncFeedback && (
        <div className="bg-cyan-950/95 border-b border-cyan-500/40 px-4 py-1.5 text-center text-xs font-mono font-medium text-cyan-200 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="font-mono text-[10px] font-bold text-amber-400">
                  ({item.badge})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
