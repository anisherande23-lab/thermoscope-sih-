import {
  Facility,
  ThermalEvent,
  AlertItem,
  CommandKPIs,
  AnalyticsSummary,
} from '../types';
import { INDUSTRIAL_FACILITIES_REGISTRY } from '../ml/industrialRegistry';
import {
  SEED_SATELLITE_OBSERVATIONS,
  runThermoscopeMlPipeline,
  deriveAlertsFromEvents,
  computeDynamicKPIs,
  computeDynamicAnalytics,
} from '../ml/mlPipeline';

export const mockFacilities: Facility[] = INDUSTRIAL_FACILITIES_REGISTRY;

export const mockThermalEvents: ThermalEvent[] = SEED_SATELLITE_OBSERVATIONS.map(
  (raw, idx) => runThermoscopeMlPipeline(raw, mockFacilities, idx)
);

export const mockAlerts: AlertItem[] = deriveAlertsFromEvents(mockThermalEvents);

export const mockKPIs: CommandKPIs = computeDynamicKPIs(
  mockThermalEvents,
  mockFacilities
);

export const mockAnalytics: AnalyticsSummary = computeDynamicAnalytics(
  mockThermalEvents,
  mockFacilities
);
