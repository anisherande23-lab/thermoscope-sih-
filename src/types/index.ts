export type RiskLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW';

export type AnomalyClassification =
  | 'Probable Abnormal Industrial Thermal Event'
  | 'Probable Industrial Flare'
  | 'Possible Wildfire'
  | 'Possible Agricultural Burning'
  | 'Uncertain / Unconfirmed Source';

export type FacilityType =
  | 'Refinery'
  | 'Petrochemical'
  | 'Power Plant'
  | 'Steel Plant'
  | 'Chemical Plant'
  | 'Manufacturing'
  | 'Cement Plant'
  | 'Other';

export type ReviewStatus = 'REQUIRES_REVIEW' | 'VERIFIED' | 'DISMISSED' | 'ESCALATED';

export type EvidenceStatus = 'SUPPORTING' | 'LIMITED' | 'UNAVAILABLE';

export interface GeoLocation {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface ShapFeature {
  featureName: string;
  category: 'thermal' | 'temporal' | 'spatial' | 'context';
  value: string | number;
  contribution: number; // positive = pushes toward high-risk, negative = pushes toward low-risk
  description: string;
}

export interface SatelliteEvidence {
  source: 'NASA_FIRMS' | 'OSM_CONTEXT' | 'SENTINEL2_SWIR' | 'LANDSAT_TIRS' | 'HISTORICAL_BASELINE';
  title: string;
  status: EvidenceStatus;
  details: Record<string, string | number | boolean>;
  timestamp?: string;
  notes?: string;
}

export interface ThermalObservationPoint {
  date: string;
  timestamp: string;
  frp: number; // MW
  brightnessTemp: number; // Kelvin
  baselineMedian: number;
  upperBand: number; // +2 sigma
  lowerBand: number; // -2 sigma
  isAnomaly?: boolean;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  location: GeoLocation;
  operator: string;
  operatingHours?: string;
  baselineFRP: number; // median MW
  baselineStdDev: number; // MW sigma
  baselineTi4K?: number; // median Kelvin
  totalEvents30d: number;
  currentRisk: RiskLevel;
  currentStatus: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  lastDetectedEventTime?: string;
  coordinatesBoundary?: [number, number][]; // Polygon coordinates [lng, lat][]
  activeAnomaliesCount: number;
  historicalThermalHistory: ThermalObservationPoint[];
}

export interface EngineeredFeatureItem {
  key: string;
  label: string;
  category: 'thermal' | 'temporal' | 'spatial' | 'context';
  value: number | string;
  unit: string;
  zScore?: number;
}

export interface ThermalEvent {
  id: string;
  eventNumber: string; // e.g. TH-1042
  title: string;
  detectedAt: string; // ISO string
  satellite: 'VIIRS_NOAA21' | 'VIIRS_NOAA20' | 'VIIRS_SNPP' | 'MODIS_TERRA' | 'MODIS_AQUA';
  location: GeoLocation;
  frp: number; // MW
  brightnessTempTi4: number; // Kelvin
  brightnessTempTi5: number; // Kelvin
  confidenceScore: number; // 0-100%
  scanTrack: string;
  dayNight: 'D' | 'N';
  dataSource?: 'NASA_FIRMS_LIVE_API' | 'CALIBRATED_SATELLITE_STREAM' | 'LIVE_INFERENCE_SANDBOX';

  // Spatial Clustering & Association
  facilityId: string;
  facilityName: string;
  facilityType: FacilityType;
  distanceFromFacilityMeters: number;
  insideFacilityBoundary?: boolean;
  clusterSize?: number;
  spatialSpreadMeters?: number;

  // ML Inference
  classification: AnomalyClassification;
  riskLevel: RiskLevel;
  modelProbability: number; // 0-100%
  classProbabilities?: Record<AnomalyClassification, number>;
  baselineDeviationSigma: number; // e.g. +2.8 sigma
  persistenceHours: number;
  recurrenceCount30d: number;

  // Explainability & 24-Feature Vector
  shapBaseValue?: number;
  naturalLanguageExplanation: string;
  shapFeatures: ShapFeature[];
  engineeredFeatures?: EngineeredFeatureItem[];

  // Evidence
  evidenceList: SatelliteEvidence[];

  // Human in the Loop
  reviewStatus: ReviewStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  recommendedAction: string;
}

export interface AlertItem {
  id: string;
  eventId: string;
  eventNumber: string;
  time: string;
  facilityName: string;
  facilityType: FacilityType;
  classification: AnomalyClassification;
  risk: RiskLevel;
  probability: number;
  confidence: number;
  status: ReviewStatus;
  recommendedAction: string;
  frp: number;
  baselineDeviation: string;
}

export interface FilterOptions {
  searchQuery: string;
  riskLevels: RiskLevel[];
  classifications: AnomalyClassification[];
  facilityTypes: FacilityType[];
  timeRange: '24h' | '7d' | '30d' | 'all' | 'custom';
  minConfidence: number;
  reviewStatuses: ReviewStatus[];
}

export interface MapLayerState {
  thermalEvents: boolean;
  facilities: boolean;
  riskZones: boolean;
  historicalEvents: boolean;
  heatmap: boolean;
  satelliteFootprints: boolean;
}

export interface CommandKPIs {
  activeThermalAnomalies: number;
  highRiskEvents: number;
  facilitiesMonitored: number;
  eventsRequiringReview: number;
  modelConfidenceAverage: number;
  lastDataUpdate: string;
  satelliteSwathCoverage: string;
  liveNasaFirmsCount?: number;
  pipelineLatencyMs?: number;
}

export interface AnalyticsSummary {
  eventsOverTime: { date: string; critical: number; high: number; moderate: number; low: number; total: number }[];
  classificationDistribution: { name: string; value: number; color: string }[];
  riskDistribution: { risk: RiskLevel; count: number; color: string }[];
  topFacilitiesByAnomalies: { id: string; name: string; type: FacilityType; count: number; maxFrp: number; avgSigma: number }[];
  evaluationMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    prAuc: number;
    calibrationBrierScore: number;
    falseNegativeRate: number;
    avgInferenceLatencyMs: number;
    testSamplesCount: number;
  };
}

export interface LiveInferenceRequest {
  latitude: number;
  longitude: number;
  frp: number;
  bright_ti4: number;
  bright_ti5: number;
  scan?: number;
  track?: number;
  daynight?: 'D' | 'N';
  satellite?: string;
  confidence?: number;
  persistenceHours?: number;
  injectIntoMap?: boolean;
}
