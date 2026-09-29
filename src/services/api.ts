import {
  ThermalEvent,
  Facility,
  AlertItem,
  CommandKPIs,
  AnalyticsSummary,
  FilterOptions,
  ReviewStatus,
  LiveInferenceRequest,
} from '../types';
import {
  mockThermalEvents,
  mockFacilities,
} from '../mock/mockData';
import {
  runThermoscopeMlPipeline,
  deriveAlertsFromEvents,
  computeDynamicKPIs,
  computeDynamicAnalytics,
} from '../ml/mlPipeline';
import { firmsService, FirmsSyncStatus } from './firmsService';

// Full-stack backend API base URL (defaults to local /api mounted by server.ts)
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Local state store as resilient fallback
let localEvents: ThermalEvent[] = [...mockThermalEvents];
let localFacilities: Facility[] = [...mockFacilities];
let totalEventsCount = localEvents.length;
let backendOnline = true;

function filterEventsLocally(
  eventsList: ThermalEvent[],
  filters?: Partial<FilterOptions>
): ThermalEvent[] {
  let events = [...eventsList];
  if (!filters) return events;

  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase().trim();
    events = events.filter(
      (e) =>
        e.eventNumber.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.facilityName.toLowerCase().includes(q) ||
        e.facilityType.toLowerCase().includes(q) ||
        e.classification.toLowerCase().includes(q) ||
        e.location.city?.toLowerCase().includes(q) ||
        e.location.state?.toLowerCase().includes(q)
    );
  }

  if (filters.riskLevels && filters.riskLevels.length > 0) {
    events = events.filter((e) => filters.riskLevels?.includes(e.riskLevel));
  }

  if (filters.classifications && filters.classifications.length > 0) {
    events = events.filter((e) => filters.classifications?.includes(e.classification));
  }

  if (filters.facilityTypes && filters.facilityTypes.length > 0) {
    events = events.filter((e) => filters.facilityTypes?.includes(e.facilityType));
  }

  if (filters.minConfidence !== undefined && filters.minConfidence > 0) {
    events = events.filter((e) => e.confidenceScore >= (filters.minConfidence || 0));
  }

  if (filters.reviewStatuses && filters.reviewStatuses.length > 0) {
    events = events.filter((e) => filters.reviewStatuses?.includes(e.reviewStatus));
  }

  if (filters.timeRange && filters.timeRange !== 'all') {
    const now = Date.now();
    const windowMs =
      filters.timeRange === '24h'
        ? 24 * 3600 * 1000
        : filters.timeRange === '7d'
        ? 7 * 24 * 3600 * 1000
        : filters.timeRange === '30d'
        ? 30 * 24 * 3600 * 1000
        : Infinity;
    if (windowMs !== Infinity) {
      events = events.filter((e) => now - new Date(e.detectedAt).getTime() <= windowMs);
    }
  }

  return events;
}

export const apiService = {
  isLiveBackendConnected(): boolean {
    return backendOnline;
  },

  getTotalEventsCount(): number {
    return totalEventsCount;
  },

  async getEvents(filters?: Partial<FilterOptions>): Promise<ThermalEvent[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.searchQuery) queryParams.set('q', filters.searchQuery);
      if (filters?.riskLevels?.length) queryParams.set('riskLevels', filters.riskLevels.join(','));
      if (filters?.classifications?.length)
        queryParams.set('classifications', filters.classifications.join('|'));
      if (filters?.facilityTypes?.length)
        queryParams.set('facilityTypes', filters.facilityTypes.join(','));
      if (filters?.reviewStatuses?.length)
        queryParams.set('reviewStatuses', filters.reviewStatuses.join(','));
      if (filters?.minConfidence) queryParams.set('minConfidence', String(filters.minConfidence));
      if (filters?.timeRange) queryParams.set('timeRange', filters.timeRange);

      const res = await fetch(`${API_BASE_URL}/events?${queryParams.toString()}`);
      if (res.ok) {
        backendOnline = true;
        const data = await res.json();
        if (Array.isArray(data)) {
          totalEventsCount = data.length;
          return data;
        }
        if (data && Array.isArray(data.events)) {
          totalEventsCount = data.totalCount ?? data.events.length;
          return data.events;
        }
      }
    } catch {
      backendOnline = false;
    }

    totalEventsCount = localEvents.length;
    return filterEventsLocally(localEvents, filters);
  },

  async getEventById(id: string): Promise<ThermalEvent | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return localEvents.find((e) => e.id === id || e.eventNumber === id) || null;
  },

  async getFacilities(): Promise<Facility[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/facilities`);
      if (res.ok) {
        const facs = await res.json();
        localFacilities = facs;
        return facs;
      }
    } catch {
      // Fallback
    }
    return localFacilities;
  },

  async getFacilityById(id: string): Promise<Facility | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/facilities/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return localFacilities.find((f) => f.id === id) || null;
  },

  async getAlerts(): Promise<AlertItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return deriveAlertsFromEvents(localEvents);
  },

  async verifyEvent(
    eventId: string,
    status: ReviewStatus,
    notes?: string,
    verifiedBy = 'Operations Command'
  ): Promise<ThermalEvent | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(eventId)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, verifiedBy }),
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = localEvents.findIndex((e) => e.id === eventId || e.eventNumber === eventId);
        if (idx !== -1) localEvents[idx] = updated;
        return updated;
      }
    } catch {
      // Fallback
    }

    const index = localEvents.findIndex((e) => e.id === eventId || e.eventNumber === eventId);
    if (index === -1) return null;

    localEvents[index] = {
      ...localEvents[index],
      reviewStatus: status,
      verifiedBy,
      verifiedAt: new Date().toISOString(),
      verificationNotes: notes || localEvents[index].verificationNotes,
    };
    return localEvents[index];
  },

  async updateAlertStatus(alertId: string, status: ReviewStatus): Promise<AlertItem | null> {
    const currentAlerts = await this.getAlerts();
    const targetAlert = currentAlerts.find((a) => a.id === alertId);

    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${encodeURIComponent(alertId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, eventId: targetAlert?.eventId }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    if (targetAlert) {
      await this.verifyEvent(targetAlert.eventId, status);
    }
    return null;
  },

  async getKPIs(): Promise<CommandKPIs> {
    try {
      const res = await fetch(`${API_BASE_URL}/kpis`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return computeDynamicKPIs(localEvents, localFacilities);
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return computeDynamicAnalytics(localEvents, localFacilities);
  },

  async loadDemoScenario(): Promise<{ heroEvent: ThermalEvent; allEvents: ThermalEvent[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/demo/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        localEvents = data.allEvents;
        totalEventsCount = data.allEvents.length;
        return data;
      }
    } catch {
      // Fallback
    }

    localEvents = [...mockThermalEvents];
    totalEventsCount = localEvents.length;
    const heroEvent = localEvents.find((e) => e.eventNumber === 'TH-1042') || localEvents[0];
    return {
      heroEvent,
      allEvents: localEvents,
    };
  },

  getFirmsStatus(): FirmsSyncStatus {
    return firmsService.getStatus();
  },

  getFirmsMapKey(): string {
    return firmsService.getFullMapKey();
  },

  setFirmsMapKey(newKey: string): void {
    firmsService.setMapKey(newKey);
  },

  async syncLiveFirmsData(): Promise<{
    count: number;
    rawCsvRows?: number;
    events: ThermalEvent[];
    status: FirmsSyncStatus;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/firms/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapKey: firmsService.getFullMapKey() }),
      });
      if (res.ok) {
        const data = await res.json();
        localEvents = data.events;
        totalEventsCount = data.events.length;
        firmsService.setStatus({
          lastSyncTime: data.lastSyncTime || new Date().toISOString(),
          status: data.status || 'LIVE_SUCCESS',
          recordsCount: data.events.length,
          rawNasaCsvRows: data.rawCsvRows,
          activeSource: data.source || 'NASA FIRMS Live Stream',
        });
        return {
          count: data.events.length,
          rawCsvRows: data.rawCsvRows,
          events: data.events,
          status: firmsService.getStatus(),
        };
      }
    } catch {
      // Fallback to direct browser-to-NASA FIRMS Area CSV fetch (CORS-enabled by NASA MODAPS)
    }

    try {
      const mapKey = firmsService.getFullMapKey();
      const sensors = ['VIIRS_NOAA21_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_SNPP_NRT', 'MODIS_NRT'];
      const allRows: ReturnType<typeof firmsService.parseFirmsCsv> = [];

      await Promise.all(
        sensors.map(async (sensor) => {
          const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${sensor}/68,8,90,33/5`;
          const r = await fetch(url);
          if (r.ok) {
            const csvText = await r.text();
            allRows.push(...firmsService.parseFirmsCsv(csvText, sensor));
          }
        })
      );

      if (allRows.length > 0) {
        const correlated = firmsService.correlateWithFacilities(allRows, localFacilities, 18);
        localFacilities = firmsService.updateFacilitiesWithLiveTelemetry(
          allRows,
          localFacilities,
          correlated
        );
        localEvents = correlated;
        totalEventsCount = correlated.length;
        firmsService.setStatus({
          lastSyncTime: new Date().toISOString(),
          status: 'LIVE_SUCCESS',
          recordsCount: correlated.length,
          rawNasaCsvRows: allRows.length,
          activeSource: `NASA FIRMS Direct Live (${allRows.length} IND passes)`,
        });
      }
    } catch {
      // Retain cached live events
    }

    return {
      count: localEvents.length,
      events: localEvents,
      status: firmsService.getStatus(),
    };
  },

  async runLiveInference(payload: LiveInferenceRequest): Promise<{
    event: ThermalEvent;
    injected: boolean;
    pipelineLatencyMs: number;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.injected && data.event) {
          localEvents = [data.event, ...localEvents];
          totalEventsCount = localEvents.length;
        }
        return data;
      }
    } catch {
      // Fallback to local pipeline execution
    }

    const customEvent = runThermoscopeMlPipeline(
      {
        id: `SANDBOX-${Date.now().toString().slice(-4)}`,
        eventNumber: `TH-${3000 + Math.floor(Math.random() * 899)}`,
        latitude: payload.latitude,
        longitude: payload.longitude,
        frp: payload.frp,
        bright_ti4: payload.bright_ti4,
        bright_ti5: payload.bright_ti5,
        scan: payload.scan || 0.39,
        track: payload.track || 0.37,
        acq_date: new Date().toISOString(),
        acq_time: '0214',
        satellite: payload.satellite || 'VIIRS_NOAA20',
        confidence: payload.confidence ?? 95,
        daynight: payload.daynight || 'N',
        persistenceHours: payload.persistenceHours,
        dataSource: 'LIVE_INFERENCE_SANDBOX',
      },
      localFacilities,
      localEvents.length + 1
    );

    if (payload.injectIntoMap) {
      localEvents = [customEvent, ...localEvents];
      totalEventsCount = localEvents.length;
    }

    return {
      event: customEvent,
      injected: Boolean(payload.injectIntoMap),
      pipelineLatencyMs: 12.8,
    };
  },
};
