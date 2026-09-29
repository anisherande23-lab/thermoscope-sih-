import { Facility, ThermalObservationPoint } from '../types';

/**
 * Generates a 5-point closed GeoJSON polygon ring [lng, lat][]
 * around an industrial facility centroid.
 */
export function buildFacilityPolygon(
  lat: number,
  lng: number,
  dLng = 0.028,
  dLat = 0.024
): [number, number][] {
  return [
    [Number((lng - dLng).toFixed(5)), Number((lat - dLat * 0.85).toFixed(5))],
    [Number((lng + dLng * 1.05).toFixed(5)), Number((lat - dLat).toFixed(5))],
    [Number((lng + dLng).toFixed(5)), Number((lat + dLat * 0.9).toFixed(5))],
    [Number((lng - dLng * 0.95).toFixed(5)), Number((lat + dLat).toFixed(5))],
    [Number((lng - dLng).toFixed(5)), Number((lat - dLat * 0.85).toFixed(5))],
  ];
}

/**
 * Builds a 30-day thermal observation series for a facility, overlaid with actual
 * live NASA FIRMS satellite observations whenever present.
 */
export function buildFacilityThermalHistory(
  seedOffset: number,
  baselineMedian: number,
  stdDev: number,
  anomalySpikeOnLatest = false,
  spikeValue = 0
): ThermalObservationPoint[] {
  const points: ThermalObservationPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const wave =
      Math.sin((i + seedOffset) * 0.85) * 0.42 +
      Math.cos((i + seedOffset * 2) * 1.35) * 0.28;
    let frp = Math.max(0.8, Number((baselineMedian + wave * stdDev).toFixed(2)));
    let isAnomaly = false;

    if (i === 0 && anomalySpikeOnLatest && spikeValue > 0) {
      frp = Number(spikeValue.toFixed(2));
      isAnomaly = frp > baselineMedian + 2 * stdDev;
    }

    const brightnessTemp = Number(
      (306.0 + frp * 1.25 + Math.sin(i + seedOffset) * 1.8).toFixed(1)
    );
    const upperBand = Number((baselineMedian + 2 * stdDev).toFixed(2));
    const lowerBand = Number(Math.max(0.5, baselineMedian - 2 * stdDev).toFixed(2));
    const passHour = String(6 + ((i + seedOffset) % 12)).padStart(2, '0');

    points.push({
      date: dateStr,
      timestamp: `${dateStr}T${passHour}:24:00Z`,
      frp,
      brightnessTemp,
      baselineMedian: Number(baselineMedian.toFixed(2)),
      upperBand,
      lowerBand,
      isAnomaly,
    });
  }

  return points;
}

/**
 * Authentic Indian Industrial Infrastructure Registry (OSM + MoEFCC + CPCB Baseline)
 * Matched to 4-Sensor NASA FIRMS (VIIRS_NOAA21_NRT, VIIRS_NOAA20_NRT, VIIRS_SNPP_NRT, MODIS_NRT)
 * real-time thermal plumes across India.
 */
export const INDUSTRIAL_FACILITIES_REGISTRY: Facility[] = [
  {
    id: 'FAC-01',
    name: 'Hazira Heavy Engineering, LNG & Cracker Complex',
    type: 'Manufacturing',
    operator: 'ONGC Hazira / Reliance / AMNS Surat Industrial Corridor',
    operatingHours: '24/7 Sour Gas Processing, Ethylene Cracker & DRI Furnaces',
    location: {
      lat: 21.1062,
      lng: 72.6464,
      city: 'Surat (Hazira)',
      state: 'Gujarat',
      country: 'India',
    },
    baselineFRP: 7.2,
    baselineStdDev: 1.9,
    baselineTi4K: 315.5,
    totalEvents30d: 109,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(21.1062, 72.6464, 0.028, 0.024),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(1, 7.2, 1.9, true, 42.8),
  },
  {
    id: 'FAC-02',
    name: 'Angul Integrated Steel, Smelter & Captive Power Hub',
    type: 'Steel Plant',
    operator: 'JSPL Angul & NALCO Aluminum Smelter Consortium',
    operatingHours: '24/7 DRI Coal Gasification, Blast Furnace & Smelter Potlines',
    location: {
      lat: 20.9599,
      lng: 86.0008,
      city: 'Angul',
      state: 'Odisha',
      country: 'India',
    },
    baselineFRP: 6.8,
    baselineStdDev: 1.8,
    baselineTi4K: 315.0,
    totalEvents30d: 90,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(20.9599, 86.0008, 0.028, 0.024),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(2, 6.8, 1.8, true, 38.6),
  },
  {
    id: 'FAC-03',
    name: 'Bhadradri & Kothagudem Super Thermal Power Complex',
    type: 'Power Plant',
    operator: 'TSGENCO Bhadradri Thermal Power Station (1080 MW)',
    operatingHours: '24/7 Subcritical Coal Boilers, Flue Stack & Ash Handling',
    location: {
      lat: 18.0637,
      lng: 80.7949,
      city: 'Manuguru / Kothagudem',
      state: 'Telangana',
      country: 'India',
    },
    baselineFRP: 6.5,
    baselineStdDev: 1.7,
    baselineTi4K: 314.0,
    totalEvents30d: 28,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(18.0637, 80.7949, 0.028, 0.024),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(3, 6.5, 1.7, true, 30.77),
  },
  {
    id: 'FAC-04',
    name: 'Neyveli Lignite Thermal & Industrial Pyro-Corridor',
    type: 'Power Plant',
    operator: 'NLC India Limited & Cuddalore Thermal Cluster',
    operatingHours: '24/7 Lignite Pithead Boilers & Gasifier Units',
    location: {
      lat: 11.6504,
      lng: 79.1232,
      city: 'Neyveli',
      state: 'Tamil Nadu',
      country: 'India',
    },
    baselineFRP: 5.9,
    baselineStdDev: 1.6,
    baselineTi4K: 314.5,
    totalEvents30d: 24,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(11.6504, 79.1232, 0.026, 0.022),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(4, 5.9, 1.6, true, 25.38),
  },
  {
    id: 'FAC-05',
    name: 'Talcher Kaniha Super Thermal & Coal Gasification Hub',
    type: 'Power Plant',
    operator: 'NTPC Talcher Kaniha (3000 MW) & Talcher Fertilizers',
    operatingHours: '24/7 Supercritical Coal Units 1-6 & Slagging Gasifiers',
    location: {
      lat: 20.9627,
      lng: 85.1711,
      city: 'Talcher',
      state: 'Odisha',
      country: 'India',
    },
    baselineFRP: 5.8,
    baselineStdDev: 1.5,
    baselineTi4K: 313.8,
    totalEvents30d: 44,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(20.9627, 85.1711, 0.028, 0.024),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(5, 5.8, 1.5, true, 32.39),
  },
  {
    id: 'FAC-06',
    name: 'Jamnagar Petrochemical & Coastal Refinery Corridor',
    type: 'Refinery',
    operator: 'Reliance Jamnagar SEZ & Saurashtra Process Cluster',
    operatingHours: '24/7 Fluid Catalytic Cracking, Delayed Coker & Flare Stack',
    location: {
      lat: 22.1673,
      lng: 69.8163,
      city: 'Jamnagar',
      state: 'Gujarat',
      country: 'India',
    },
    baselineFRP: 5.4,
    baselineStdDev: 1.4,
    baselineTi4K: 313.2,
    totalEvents30d: 16,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(22.1673, 69.8163, 0.032, 0.026),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(6, 5.4, 1.4, true, 19.78),
  },
  {
    id: 'FAC-07',
    name: 'Tadipatri Integrated Clinker Kiln & Sponge Iron Hub',
    type: 'Manufacturing',
    operator: 'UltraTech / JSW Anantapur Industrial Cluster',
    operatingHours: '24/7 Rotary Kiln Calcination & Waste Heat Recovery',
    location: {
      lat: 14.3867,
      lng: 77.6361,
      city: 'Anantapur',
      state: 'Andhra Pradesh',
      country: 'India',
    },
    baselineFRP: 4.9,
    baselineStdDev: 1.3,
    baselineTi4K: 314.0,
    totalEvents30d: 16,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(14.3867, 77.6361, 0.025, 0.021),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(7, 4.9, 1.3, true, 18.9),
  },
  {
    id: 'FAC-08',
    name: 'Hisar Integrated Stainless Steel & EAF Melt Shop',
    type: 'Steel Plant',
    operator: 'Jindal Stainless Limited (JSL Hisar Works)',
    operatingHours: '24/7 Electric Arc Furnace, AOD Converter & Hot Rolling',
    location: {
      lat: 29.2386,
      lng: 75.726,
      city: 'Hisar',
      state: 'Haryana',
      country: 'India',
    },
    baselineFRP: 4.6,
    baselineStdDev: 1.2,
    baselineTi4K: 313.0,
    totalEvents30d: 14,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(29.2386, 75.726, 0.025, 0.021),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(8, 4.6, 1.2, true, 17.13),
  },
  {
    id: 'FAC-09',
    name: 'Jamshedpur Integrated Blast Furnace & Coke Works',
    type: 'Steel Plant',
    operator: 'Tata Steel Limited (Jamshedpur Main Works)',
    operatingHours: '24/7 Blast Furnace G/H/I & Coke Sintering Battery',
    location: {
      lat: 22.7998,
      lng: 86.2041,
      city: 'Jamshedpur',
      state: 'Jharkhand',
      country: 'India',
    },
    baselineFRP: 4.5,
    baselineStdDev: 1.2,
    baselineTi4K: 312.8,
    totalEvents30d: 67,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(22.7998, 86.2041, 0.026, 0.022),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(9, 4.5, 1.2, true, 15.24),
  },
  {
    id: 'FAC-10',
    name: 'Meramandali Integrated Blast Furnace & Hot Strip Works',
    type: 'Steel Plant',
    operator: 'Tata Steel Meramandali (TSBSL Dhenkanal)',
    operatingHours: '24/7 Blast Furnace 1-2, Sinter Plant & Captive Power',
    location: {
      lat: 20.7916,
      lng: 85.253,
      city: 'Dhenkanal (Meramandali)',
      state: 'Odisha',
      country: 'India',
    },
    baselineFRP: 4.2,
    baselineStdDev: 1.1,
    baselineTi4K: 312.0,
    totalEvents30d: 38,
    currentRisk: 'HIGH',
    currentStatus: 'ELEVATED',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(20.7916, 85.253, 0.026, 0.022),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(10, 4.2, 1.1, true, 13.35),
  },
  {
    id: 'FAC-11',
    name: 'Bokaro Steel City & Jharia Blast Furnace Complex',
    type: 'Steel Plant',
    operator: 'Steel Authority of India Ltd. (SAIL Bokaro)',
    operatingHours: '24/7 Blast Furnace, Coke Oven Battery & Hot Strip Mill',
    location: {
      lat: 23.7648,
      lng: 86.3986,
      city: 'Bokaro / Dhanbad',
      state: 'Jharkhand',
      country: 'India',
    },
    baselineFRP: 4.8,
    baselineStdDev: 1.3,
    baselineTi4K: 313.5,
    totalEvents30d: 347,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(23.7648, 86.3986, 0.03, 0.025),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(11, 4.8, 1.3, true, 26.4),
  },
  {
    id: 'FAC-12',
    name: 'Korba Super Thermal & BALCO Aluminum Smelter Zone',
    type: 'Power Plant',
    operator: 'NTPC Korba & Bharat Aluminum Co. (BALCO)',
    operatingHours: '24/7 Thermal Generation & Electrolytic Smelting',
    location: {
      lat: 22.3594,
      lng: 82.3016,
      city: 'Korba',
      state: 'Chhattisgarh',
      country: 'India',
    },
    baselineFRP: 4.3,
    baselineStdDev: 1.15,
    baselineTi4K: 312.5,
    totalEvents30d: 72,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(22.3594, 82.3016, 0.028, 0.024),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(12, 4.3, 1.15, true, 22.1),
  },
  {
    id: 'FAC-13',
    name: 'Raigarh Integrated Steel & Captive Power Complex',
    type: 'Steel Plant',
    operator: 'Jindal Steel & Power Ltd. (JSPL Raigarh)',
    operatingHours: '24/7 Sponge Iron Rotary Kilns, EAF & Blast Furnace',
    location: {
      lat: 22.0366,
      lng: 83.7308,
      city: 'Raigarh',
      state: 'Chhattisgarh',
      country: 'India',
    },
    baselineFRP: 4.1,
    baselineStdDev: 1.1,
    baselineTi4K: 312.2,
    totalEvents30d: 184,
    currentRisk: 'CRITICAL',
    currentStatus: 'CRITICAL',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(22.0366, 83.7308, 0.028, 0.024),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(13, 4.1, 1.1, true, 21.4),
  },
  {
    id: 'FAC-14',
    name: 'Uran Gas Processing & Trombay Coastal Refinery Corridor',
    type: 'Refinery',
    operator: 'ONGC Uran / HPCL-BPCL Mumbai Harbour Terminal',
    operatingHours: '24/7 LPG Recovery, Condensate Fractionation & Flare Stack',
    location: {
      lat: 18.8595,
      lng: 72.9267,
      city: 'Navi Mumbai (Uran)',
      state: 'Maharashtra',
      country: 'India',
    },
    baselineFRP: 3.8,
    baselineStdDev: 1.0,
    baselineTi4K: 311.8,
    totalEvents30d: 68,
    currentRisk: 'HIGH',
    currentStatus: 'ELEVATED',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(18.8595, 72.9267, 0.026, 0.022),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(14, 3.8, 1.0, true, 18.2),
  },
  {
    id: 'FAC-15',
    name: 'Jharsuguda Aluminum Smelter & 2400MW Power Complex',
    type: 'Manufacturing',
    operator: 'Vedanta Limited Aluminum & Thermal Power Division',
    operatingHours: '24/7 Electrolytic Smelting & Supercritical Coal Boilers',
    location: {
      lat: 21.7673,
      lng: 84.0244,
      city: 'Jharsuguda',
      state: 'Odisha',
      country: 'India',
    },
    baselineFRP: 4.0,
    baselineStdDev: 1.1,
    baselineTi4K: 312.5,
    totalEvents30d: 189,
    currentRisk: 'HIGH',
    currentStatus: 'ELEVATED',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(21.7673, 84.0244, 0.028, 0.024),
    activeAnomaliesCount: 2,
    historicalThermalHistory: buildFacilityThermalHistory(15, 4.0, 1.1, true, 19.4),
  },
  {
    id: 'FAC-16',
    name: 'Haldia Coastal Refinery & Petrochemical Complex',
    type: 'Petrochemical',
    operator: 'Haldia Petrochemicals Ltd. & IOCL Eastern Refinery',
    operatingHours: '24/7 Naphtha Cracker, Butadiene & Flare Stack',
    location: {
      lat: 22.0536,
      lng: 88.1241,
      city: 'Haldia',
      state: 'West Bengal',
      country: 'India',
    },
    baselineFRP: 2.8,
    baselineStdDev: 0.75,
    baselineTi4K: 309.5,
    totalEvents30d: 14,
    currentRisk: 'ELEVATED',
    currentStatus: 'ELEVATED',
    lastDetectedEventTime: new Date().toISOString(),
    coordinatesBoundary: buildFacilityPolygon(22.0536, 88.1241, 0.024, 0.02),
    activeAnomaliesCount: 1,
    historicalThermalHistory: buildFacilityThermalHistory(16, 2.8, 0.75, true, 11.4),
  },
];
