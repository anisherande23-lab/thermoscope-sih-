import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { ThermalMapPage } from './pages/ThermalMapPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelInsightsPage } from './pages/ModelInsightsPage';
import { apiService } from './services/api';
import {
  ThermalEvent,
  Facility,
  AlertItem,
  CommandKPIs,
  AnalyticsSummary,
  FilterOptions,
  ReviewStatus,
} from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [events, setEvents] = useState<ThermalEvent[]>([]);
  const [totalEventsCount, setTotalEventsCount] = useState<number>(0);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [kpis, setKpis] = useState<CommandKPIs | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ThermalEvent | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [demoBannerMessage, setDemoBannerMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    riskLevels: [],
    classifications: [],
    facilityTypes: [],
    timeRange: 'all',
    minConfidence: 0,
    reviewStatuses: [],
  });

  const loadData = async (currentFilters?: FilterOptions) => {
    try {
      const [evts, facs, alrts, kp, an] = await Promise.all([
        apiService.getEvents(currentFilters || filters),
        apiService.getFacilities(),
        apiService.getAlerts(),
        apiService.getKPIs(),
        apiService.getAnalytics(),
      ]);
      setEvents(evts);
      setTotalEventsCount(apiService.getTotalEventsCount());
      setFacilities(facs);
      setAlerts(alrts);
      setKpis(kp);
      setAnalytics(an);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
      await apiService.syncLiveFirmsData();
      await loadData();
    };
    init();
  }, []);

  const handleFilterChange = async (newFilters: FilterOptions) => {
    setFilters(newFilters);
    const evts = await apiService.getEvents(newFilters);
    setEvents(evts);
    setTotalEventsCount(apiService.getTotalEventsCount());
  };

  const handleResetFilters = async () => {
    const defaultFilters: FilterOptions = {
      searchQuery: '',
      riskLevels: [],
      classifications: [],
      facilityTypes: [],
      timeRange: 'all',
      minConfidence: 0,
      reviewStatuses: [],
    };
    setFilters(defaultFilters);
    const evts = await apiService.getEvents(defaultFilters);
    setEvents(evts);
    setTotalEventsCount(apiService.getTotalEventsCount());
  };

  const handleVerifyEvent = async (eventId: string, status: ReviewStatus, notes?: string) => {
    const updated = await apiService.verifyEvent(eventId, status, notes);
    if (updated) {
      setSelectedEvent(updated);
      await loadData();
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, status: ReviewStatus) => {
    await apiService.updateAlertStatus(alertId, status);
    await loadData();
  };

  const handleSelectEvent = (event: ThermalEvent | null) => {
    setSelectedEvent(event);
    if (event) {
      const matchedFacility = facilities.find((f) => f.id === event.facilityId);
      if (matchedFacility) setSelectedFacility(matchedFacility);
      setActiveTab('map');
    }
  };

  const handleSelectEventById = async (eventId: string) => {
    const evt = await apiService.getEventById(eventId);
    if (evt) {
      handleSelectEvent(evt);
    }
  };

  const handleLoadDemoScenario = async () => {
    const { heroEvent } = await apiService.loadDemoScenario();
    await handleResetFilters();
    await loadData();
    setSelectedEvent(heroEvent);
    const fac = facilities.find((f) => f.id === heroEvent.facilityId) || null;
    setSelectedFacility(fac);
    setActiveTab('map');
    setDemoBannerMessage(
      `Loaded SIH Demo Scenario: ${heroEvent.eventNumber} — ${heroEvent.facilityName} (+${heroEvent.baselineDeviationSigma}σ Deviation, ${heroEvent.modelProbability.toFixed(1)}% Probability)`
    );
    setTimeout(() => setDemoBannerMessage(null), 5000);
  };

  const handleInspectFacilityOnMap = (fac: Facility) => {
    setSelectedFacility(fac);
    const relatedEvent = events.find((e) => e.facilityId === fac.id);
    if (relatedEvent) {
      setSelectedEvent(relatedEvent);
    } else {
      setSelectedEvent(null);
    }
    setActiveTab('map');
  };

  const handleSyncFirmsData = async () => {
    await apiService.syncLiveFirmsData();
    await loadData();
  };

  const handleInjectAndInspectEvent = async (injectedEvent: ThermalEvent) => {
    await loadData();
    setSelectedEvent(injectedEvent);
    const matchedFac = facilities.find((f) => f.id === injectedEvent.facilityId) || null;
    setSelectedFacility(matchedFac);
    setActiveTab('map');
    setDemoBannerMessage(
      `Injected Live ML Inference Event ${injectedEvent.eventNumber} (${injectedEvent.frp} MW, ${injectedEvent.modelProbability.toFixed(1)}% Risk) onto GIS Map`
    );
    setTimeout(() => setDemoBannerMessage(null), 5000);
  };

  const unreadAlertsCount = alerts.filter((a) => a.status === 'REQUIRES_REVIEW').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoadDemoScenario={handleLoadDemoScenario}
        onSyncFirmsData={handleSyncFirmsData}
        unreadAlertsCount={unreadAlertsCount}
        isLiveBackend={apiService.isLiveBackendConnected()}
      />

      {demoBannerMessage && (
        <div className="bg-amber-600/95 border-b border-amber-400/40 px-4 py-2 text-center text-xs font-mono font-bold text-white flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>{demoBannerMessage}</span>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'overview' && kpis && (
          <OverviewPage
            kpis={kpis}
            events={events}
            facilities={facilities}
            onSelectEvent={handleSelectEvent}
            onNavigateToMap={() => setActiveTab('map')}
            onNavigateToAlerts={() => setActiveTab('alerts')}
            onNavigateToFacilities={() => setActiveTab('facilities')}
          />
        )}

        {activeTab === 'map' && (
          <ThermalMapPage
            events={events}
            facilities={facilities}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            selectedFacility={selectedFacility}
            onSelectFacility={setSelectedFacility}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalCount={totalEventsCount || events.length}
            filteredCount={events.length}
            onVerifyEvent={handleVerifyEvent}
          />
        )}

        {activeTab === 'facilities' && (
          <FacilitiesPage
            facilities={facilities}
            events={events}
            onSelectEvent={handleSelectEvent}
            onNavigateToMapWithFacility={handleInspectFacilityOnMap}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsPage
            alerts={alerts}
            events={events}
            onSelectEventById={handleSelectEventById}
            onUpdateAlertStatus={handleUpdateAlertStatus}
          />
        )}

        {activeTab === 'analytics' && analytics && (
          <AnalyticsPage analytics={analytics} />
        )}

        {activeTab === 'model' && (
          <ModelInsightsPage
            facilities={facilities}
            onInjectAndInspectEvent={handleInjectAndInspectEvent}
          />
        )}
      </main>
    </div>
  );
}
