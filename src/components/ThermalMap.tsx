import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ThermalEvent, Facility, MapLayerState, RiskLevel } from '../types';
import {
  Layers,
  Flame,
  Building2,
  Radio,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Compass,
  Activity,
  Scan,
  Crosshair,
} from 'lucide-react';

interface ThermalMapProps {
  events: ThermalEvent[];
  facilities: Facility[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  selectedFacility: Facility | null;
  onSelectFacility?: (facility: Facility) => void;
  layers?: MapLayerState;
  onLayerChange?: (layers: MapLayerState) => void;
  center?: [number, number];
  zoom?: number;
}

export const ThermalMap: React.FC<ThermalMapProps> = ({
  events,
  facilities,
  selectedEvent,
  onSelectEvent,
  selectedFacility,
  onSelectFacility,
  layers: externalLayers,
  onLayerChange,
  center = [78.9629, 20.5937] as [number, number],
  zoom = 4.7,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const facilityMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  const [layers, setLayers] = useState<MapLayerState>(
    externalLayers || {
      thermalEvents: true,
      facilities: true,
      riskZones: true,
      historicalEvents: false,
      heatmap: false,
      satelliteFootprints: true,
    }
  );

  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [basemapMode, setBasemapMode] = useState<'dark' | 'satellite'>('dark');
  const [hoveredEvent, setHoveredEvent] = useState<ThermalEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: center[1],
    lng: center[0],
    zoom,
  });

  const toggleLayer = (key: keyof MapLayerState) => {
    const updated = { ...layers, [key]: !layers[key] };
    setLayers(updated);
    if (onLayerChange) onLayerChange(updated);
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'ELEVATED':
        return '#f59e0b';
      case 'MODERATE':
        return '#10b981';
      case 'LOW':
      default:
        return '#06b6d4';
    }
  };

  // 1. Initialize MapLibre GL JS Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'esri-dark-base': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'esri-dark-labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'esri-satellite-labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'esri-dark-base-layer',
          type: 'raster',
          source: 'esri-dark-base',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'esri-dark-labels-layer',
          type: 'raster',
          source: 'esri-dark-labels',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: 'none',
          },
        },
        {
          id: 'esri-satellite-labels-layer',
          type: 'raster',
          source: 'esri-satellite-labels',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: 'none',
          },
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center,
      zoom,
      attributionControl: false,
    });

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: Number(e.lngLat.lat.toFixed(4)),
        lng: Number(e.lngLat.lng.toFixed(4)),
        zoom: Number(map.getZoom().toFixed(1)),
      });
    });

    map.on('zoomend', () => {
      const c = map.getCenter();
      setCursorCoords((prev) => ({
        lat: prev.lat || Number(c.lat.toFixed(4)),
        lng: prev.lng || Number(c.lng.toFixed(4)),
        zoom: Number(map.getZoom().toFixed(1)),
      }));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // 2. Sync GeoJSON Vector & Heatmap Overlays in MapLibre
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // A. Facility Polygons GeoJSON
    const facilityFeatures = facilities
      .filter((f) => f.coordinatesBoundary && f.coordinatesBoundary.length >= 4)
      .map((f) => ({
        type: 'Feature' as const,
        properties: {
          id: f.id,
          name: f.name,
          risk: f.currentRisk,
          color:
            f.currentStatus === 'CRITICAL'
              ? '#ef4444'
              : f.currentStatus === 'ELEVATED'
              ? '#f59e0b'
              : '#06b6d4',
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [f.coordinatesBoundary!],
        },
      }));

    const facilityGeoJson = {
      type: 'FeatureCollection' as const,
      features: layers.facilities ? facilityFeatures : [],
    };

    if (map.getSource('facilities-polygons-src')) {
      (map.getSource('facilities-polygons-src') as maplibregl.GeoJSONSource).setData(
        facilityGeoJson as any
      );
    } else {
      map.addSource('facilities-polygons-src', {
        type: 'geojson',
        data: facilityGeoJson as any,
      });
      map.addLayer({
        id: 'facilities-polygons-fill',
        type: 'fill',
        source: 'facilities-polygons-src',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.14,
        },
      });
      map.addLayer({
        id: 'facilities-polygons-outline',
        type: 'line',
        source: 'facilities-polygons-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });
    }

    // B. Risk Zone Buffers & Heatmap Points GeoJSON
    const eventPointFeatures = events.map((e) => ({
      type: 'Feature' as const,
      properties: {
        id: e.id,
        frp: e.frp,
        probability: e.modelProbability,
        color: getRiskColor(e.riskLevel),
        radius:
          e.riskLevel === 'CRITICAL'
            ? 34
            : e.riskLevel === 'HIGH'
            ? 26
            : e.riskLevel === 'ELEVATED'
            ? 20
            : 14,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [e.location.lng, e.location.lat],
      },
    }));

    const eventsGeoJson = {
      type: 'FeatureCollection' as const,
      features: eventPointFeatures,
    };

    if (map.getSource('events-geojson-src')) {
      (map.getSource('events-geojson-src') as maplibregl.GeoJSONSource).setData(
        eventsGeoJson as any
      );
    } else {
      map.addSource('events-geojson-src', {
        type: 'geojson',
        data: eventsGeoJson as any,
      });

      map.addLayer({
        id: 'risk-zones-layer',
        type: 'circle',
        source: 'events-geojson-src',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.14,
          'circle-stroke-width': 1,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'thermal-heatmap-layer',
        type: 'heatmap',
        source: 'events-geojson-src',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'frp'], 0, 0.1, 45, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 1, 10, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(6, 182, 212, 0)',
            0.2,
            'rgba(6, 182, 212, 0.45)',
            0.4,
            'rgba(16, 185, 129, 0.65)',
            0.6,
            'rgba(245, 158, 11, 0.8)',
            0.8,
            'rgba(249, 115, 22, 0.9)',
            1,
            'rgba(239, 68, 68, 0.98)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 22, 9, 48],
          'heatmap-opacity': 0.78,
        },
      });
    }

    if (map.getLayer('esri-dark-base-layer')) {
      map.setLayoutProperty(
        'esri-dark-base-layer',
        'visibility',
        basemapMode === 'dark' ? 'visible' : 'none'
      );
    }
    if (map.getLayer('esri-dark-labels-layer')) {
      map.setLayoutProperty(
        'esri-dark-labels-layer',
        'visibility',
        basemapMode === 'dark' ? 'visible' : 'none'
      );
    }
    if (map.getLayer('esri-satellite-layer')) {
      map.setLayoutProperty(
        'esri-satellite-layer',
        'visibility',
        basemapMode === 'satellite' ? 'visible' : 'none'
      );
    }
    if (map.getLayer('esri-satellite-labels-layer')) {
      map.setLayoutProperty(
        'esri-satellite-labels-layer',
        'visibility',
        basemapMode === 'satellite' ? 'visible' : 'none'
      );
    }

    if (map.getLayer('risk-zones-layer')) {
      map.setLayoutProperty(
        'risk-zones-layer',
        'visibility',
        layers.riskZones ? 'visible' : 'none'
      );
    }
    if (map.getLayer('thermal-heatmap-layer')) {
      map.setLayoutProperty(
        'thermal-heatmap-layer',
        'visibility',
        layers.heatmap ? 'visible' : 'none'
      );
    }

    // C. VIIRS 375m Satellite Footprints Polygons
    const footprintFeatures = events.map((e) => {
      const d = 0.0085; // ~900m visual bounding footprint
      const lng = e.location.lng;
      const lat = e.location.lat;
      return {
        type: 'Feature' as const,
        properties: {
          id: e.id,
          sat: e.satellite,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [lng - d, lat - d],
              [lng + d, lat - d],
              [lng + d, lat + d],
              [lng - d, lat + d],
              [lng - d, lat - d],
            ],
          ],
        },
      };
    });

    const footprintsGeoJson = {
      type: 'FeatureCollection' as const,
      features: layers.satelliteFootprints ? footprintFeatures : [],
    };

    if (map.getSource('sat-footprints-src')) {
      (map.getSource('sat-footprints-src') as maplibregl.GeoJSONSource).setData(
        footprintsGeoJson as any
      );
    } else {
      map.addSource('sat-footprints-src', {
        type: 'geojson',
        data: footprintsGeoJson as any,
      });
      map.addLayer({
        id: 'sat-footprints-line',
        type: 'line',
        source: 'sat-footprints-src',
        paint: {
          'line-color': '#a855f7',
          'line-width': 1.2,
          'line-opacity': 0.65,
        },
      });
    }

    // D. Historical 30-Day Pass Detections Layer
    const historicalFeatures: any[] = [];
    if (layers.historicalEvents) {
      facilities.forEach((fac, fIdx) => {
        for (let k = 0; k < 5; k++) {
          const angle = ((fIdx * 3 + k) * Math.PI) / 2.5;
          const r = 0.006 + (k % 3) * 0.004;
          historicalFeatures.push({
            type: 'Feature',
            properties: { facilityName: fac.name },
            geometry: {
              type: 'Point',
              coordinates: [
                fac.location.lng + Math.cos(angle) * r,
                fac.location.lat + Math.sin(angle) * r,
              ],
            },
          });
        }
      });
    }

    const histGeoJson = {
      type: 'FeatureCollection' as const,
      features: historicalFeatures,
    };

    if (map.getSource('historical-passes-src')) {
      (map.getSource('historical-passes-src') as maplibregl.GeoJSONSource).setData(
        histGeoJson as any
      );
    } else {
      map.addSource('historical-passes-src', {
        type: 'geojson',
        data: histGeoJson as any,
      });
      map.addLayer({
        id: 'historical-passes-dots',
        type: 'circle',
        source: 'historical-passes-src',
        paint: {
          'circle-radius': 4,
          'circle-color': '#38bdf8',
          'circle-opacity': 0.55,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0284c7',
        },
      });
    }
  }, [
    events,
    facilities,
    mapLoaded,
    layers.facilities,
    layers.riskZones,
    layers.heatmap,
    layers.satelliteFootprints,
    layers.historicalEvents,
    basemapMode,
  ]);

  // 3. Render Thermal Anomaly DOM Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m: any) => m?.remove());
    markersRef.current = {};

    if (!layers.thermalEvents) return;

    events.forEach((event) => {
      const el = document.createElement('div');
      el.className = 'thermal-hotspot-marker cursor-pointer relative group';

      const isSelected = selectedEvent?.id === event.id;
      const isCriticalOrHigh = event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH';
      const color = getRiskColor(event.riskLevel);

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            isCriticalOrHigh
              ? `<div class="absolute -inset-2 rounded-full animate-ping opacity-60" style="background-color: ${color};"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center rounded-full border-2 transition-transform duration-150 ${
            isSelected ? 'scale-125 ring-4 ring-cyan-400/60 shadow-lg' : 'hover:scale-110'
          }" style="
            width: ${isSelected ? '24px' : isCriticalOrHigh ? '20px' : '16px'};
            height: ${isSelected ? '24px' : isCriticalOrHigh ? '20px' : '16px'};
            background: radial-gradient(circle, ${color} 30%, #090d16 100%);
            border-color: ${isSelected ? '#ffffff' : color};
            box-shadow: 0 0 14px ${color};
          ">
            <div class="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
          </div>
        </div>
      `;

      el.addEventListener('mouseenter', (e) => {
        setHoveredEvent(event);
        const rect = mapContainerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top - 15,
          });
        }
      });

      el.addEventListener('mouseleave', () => {
        setHoveredEvent(null);
        setTooltipPos(null);
      });

      el.addEventListener('click', () => {
        onSelectEvent(event);
        map.flyTo({
          center: [event.location.lng, event.location.lat],
          zoom: Math.max(map.getZoom(), 9.2),
          essential: true,
          duration: 1100,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.location.lng, event.location.lat])
        .addTo(map);

      markersRef.current[event.id] = marker;
    });
  }, [events, layers.thermalEvents, selectedEvent]);

  // 4. Render Industrial Facility Labels / Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(facilityMarkersRef.current).forEach((m: any) => m?.remove());
    facilityMarkersRef.current = {};

    if (!layers.facilities) return;

    facilities.forEach((facility) => {
      const el = document.createElement('div');
      el.className = 'facility-marker cursor-pointer relative group';

      const isSelected = selectedFacility?.id === facility.id;

      el.innerHTML = `
        <div class="flex items-center gap-1.5 rounded-md border border-slate-700/90 bg-slate-950/90 px-2 py-0.5 shadow-lg backdrop-blur-md transition-transform duration-150 hover:border-cyan-400 hover:scale-105 ${
          isSelected ? 'border-cyan-400 ring-2 ring-cyan-500/50' : ''
        }">
          <span class="h-2 w-2 rounded-xs bg-cyan-400 shrink-0"></span>
          <span class="text-[10px] font-mono font-medium text-slate-200 tracking-tight whitespace-nowrap">${
            facility.name.split(' (')[0]
          }</span>
        </div>
      `;

      el.addEventListener('click', () => {
        if (onSelectFacility) onSelectFacility(facility);
        map.flyTo({
          center: [facility.location.lng, facility.location.lat],
          zoom: Math.max(map.getZoom(), 9.5),
          essential: true,
          duration: 1000,
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -10] })
        .setLngLat([facility.location.lng, facility.location.lat])
        .addTo(map);

      facilityMarkersRef.current[facility.id] = marker;
    });
  }, [facilities, layers.facilities, selectedFacility]);

  // 5. Fly to selected event or facility when prop updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEvent) return;

    map.flyTo({
      center: [selectedEvent.location.lng, selectedEvent.location.lat],
      zoom: Math.max(map.getZoom(), 9.5),
      essential: true,
      duration: 1100,
    });
  }, [selectedEvent]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility || selectedEvent) return;

    map.flyTo({
      center: [selectedFacility.location.lng, selectedFacility.location.lat],
      zoom: Math.max(map.getZoom(), 9.5),
      essential: true,
      duration: 1100,
    });
  }, [selectedFacility]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 select-none cursor-crosshair">
      {/* MapLibre DOM Target */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Grid crosshair scanline effect */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-35" />

      {/* COMPACT HOVER TOOLTIP */}
      {hoveredEvent && tooltipPos && (
        <div
          className="pointer-events-none absolute z-40 transform -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 w-68 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-mono text-[10px] text-slate-400">
            <span>Thermal Event · {hoveredEvent.eventNumber}</span>
            <span
              className="font-bold uppercase"
              style={{ color: getRiskColor(hoveredEvent.riskLevel) }}
            >
              ● {hoveredEvent.riskLevel}
            </span>
          </div>

          <div className="space-y-1 pt-0.5 font-mono tabular-nums">
            <div className="font-sans font-semibold text-white truncate">
              {hoveredEvent.facilityName}
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span className="text-slate-400">Risk Probability:</span>
              <span className="font-bold text-amber-300">
                {hoveredEvent.modelProbability.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span className="text-slate-400">Radiative Power (FRP):</span>
              <span className="font-bold text-orange-400">
                {hoveredEvent.frp.toFixed(1)} MW ({hoveredEvent.baselineDeviationSigma >= 0 ? '+' : ''}
                {hoveredEvent.baselineDeviationSigma}σ)
              </span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span className="text-slate-400">Brightness Temp (Ti4):</span>
              <span className="text-cyan-300">{hoveredEvent.brightnessTempTi4.toFixed(1)} K</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span className="text-slate-400">Detected:</span>
              <span className="text-slate-400">
                {new Date(hoveredEvent.detectedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAP CONTROLS & LAYER SWITCHER (TOP-RIGHT) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition whitespace-nowrap"
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>GIS Overlays</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-11 w-64 rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl space-y-2 text-xs text-slate-300 font-mono animate-in fade-in zoom-in-95">
              <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                Basemap Tile Engine
              </div>
              <div className="grid grid-cols-2 gap-1.5 pb-1.5 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setBasemapMode('dark')}
                  className={`rounded-md py-1.5 px-2 text-[11px] font-semibold transition ${
                    basemapMode === 'dark'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Dark GIS
                </button>
                <button
                  type="button"
                  onClick={() => setBasemapMode('satellite')}
                  className={`rounded-md py-1.5 px-2 text-[11px] font-semibold transition ${
                    basemapMode === 'satellite'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Satellite
                </button>
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1.5 pt-0.5">
                Active Spatial Layers
              </div>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  Thermal Hotspots
                </span>
                <input
                  type="checkbox"
                  checked={layers.thermalEvents}
                  onChange={() => toggleLayer('thermalEvents')}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  Facilities & Polygons
                </span>
                <input
                  type="checkbox"
                  checked={layers.facilities}
                  onChange={() => toggleLayer('facilities')}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  Hazard Risk Buffers
                </span>
                <input
                  type="checkbox"
                  checked={layers.riskZones}
                  onChange={() => toggleLayer('riskZones')}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  FRP Radiative Heatmap
                </span>
                <input
                  type="checkbox"
                  checked={layers.heatmap}
                  onChange={() => toggleLayer('heatmap')}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Scan className="h-3.5 w-3.5 text-purple-400" />
                  VIIRS 375m Footprints
                </span>
                <input
                  type="checkbox"
                  checked={layers.satelliteFootprints}
                  onChange={() => toggleLayer('satelliteFootprints')}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-sky-400" />
                  30d Historical Passes
                </span>
                <input
                  type="checkbox"
                  checked={layers.historicalEvents}
                  onChange={() => toggleLayer('historicalEvents')}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col self-end rounded-lg border border-slate-700 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-md">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-2 text-slate-300 hover:bg-slate-800 hover:text-white border-b border-slate-800 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              mapInstanceRef.current?.flyTo({
                center: [78.9629, 20.5937],
                zoom: 4.7,
                essential: true,
              })
            }
            title="Reset to National India View"
            className="p-2 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 border-t border-slate-800 transition"
          >
            <Compass className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MAP LEGEND (BOTTOM-LEFT) */}
      <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-slate-800 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md space-y-2 text-[11px] font-mono">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Thermal Threat Classification
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            <span>Critical (≥+2.6σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Elevated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Nominal Flare</span>
          </div>
        </div>
      </div>

      {/* LIVE CURSOR COORDINATE HUD (BOTTOM-RIGHT) */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-[11px] font-mono tabular-nums text-slate-300 shadow-lg backdrop-blur-md">
        <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
        <span>LAT {cursorCoords.lat.toFixed(4)}° N</span>
        <span className="text-slate-600">·</span>
        <span>LNG {cursorCoords.lng.toFixed(4)}° E</span>
        <span className="text-slate-600">·</span>
        <span className="text-cyan-400">Z {cursorCoords.zoom.toFixed(1)}</span>
      </div>
    </div>
  );
};
