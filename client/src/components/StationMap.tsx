import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { StationSummary } from '../services/api';

interface StationMapProps {
  stations: StationSummary[];
  onSelectStation: (stationId: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  SAFE: '#10b981',           // Emerald
  SEMI_CRITICAL: '#f59e0b',  // Amber
  CRITICAL: '#f97316',       // Orange
  OVER_EXPLOITED: '#f43f5e',  // Rose
  INSUFFICIENT_DATA: '#64748b' // Slate
};

// Lightweight GeoJSON polygon representing "Northern Depletion Zone (Alluvial Aquifer System)"
const mockAquiferZone: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Indo-Gangetic Alluvial Depletion Zone", risk: "CRITICAL" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.0, 28.0],
            [77.0, 31.0],
            [81.5, 28.5],
            [80.0, 26.0],
            [75.5, 25.5],
            [74.0, 28.0]
          ]
        ]
      }
    }
  ]
};

export const StationMap: React.FC<StationMapProps> = ({ stations, onSelectStation }) => {
  // Validate coordinates: India bounding box approx [6°N - 38°N, 68°E - 98°E]
  const validStations = stations.filter(
    (s) =>
      typeof s.latitude === 'number' &&
      typeof s.longitude === 'number' &&
      s.latitude >= 6.0 &&
      s.latitude <= 38.0 &&
      s.longitude >= 68.0 &&
      s.longitude <= 98.0
  );

  return (
    <div className="h-[520px] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative z-10">
      <MapContainer
        center={[22.5937, 78.9629]} // Center of India
        zoom={5}
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* GeoJSON Regional Aquifer Boundary Layer */}
        <GeoJSON
          data={mockAquiferZone}
          style={{
            fillColor: "#ef4444",
            weight: 1.5,
            opacity: 0.7,
            color: "#dc2626",
            fillOpacity: 0.12,
            dashArray: "4 4"
          }}
        />

        {validStations.map((station) => (
          <CircleMarker
            key={station.station_id}
            center={[station.latitude, station.longitude]}
            radius={7}
            pathOptions={{
              fillColor: RISK_COLORS[station.telemetry_risk] || '#64748b',
              fillOpacity: 0.85,
              color: '#ffffff',
              weight: 1.2
            }}
          >
            <Popup className="station-leaflet-popup">
              <div className="text-slate-900 p-1 text-xs">
                <div className="font-bold border-b pb-1 mb-1">{station.name}</div>
                <div><strong>ID:</strong> {station.station_id}</div>
                <div><strong>District:</strong> {station.district}, {station.state}</div>
                <div>
                  <strong>Telemetry Depth:</strong>{' '}
                  {station.latest_water_level_m_bgl !== null
                    ? `${station.latest_water_level_m_bgl.toFixed(2)} m bgl`
                    : 'N/A'}
                </div>
                <div><strong>Operational Risk:</strong> {station.telemetry_risk}</div>
                <button
                  onClick={() => onSelectStation(station.station_id)}
                  className="mt-2 w-full py-1 bg-cyan-700 text-white rounded text-[11px] font-medium hover:bg-cyan-800 cursor-pointer"
                >
                  View Station Intelligence
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 border border-slate-700 px-3 py-2 rounded text-[11px] text-slate-300 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border border-red-500 bg-red-500/20 inline-block"></span>
          Alluvial Depletion Zone
        </span>
        <span>{validStations.length} of {stations.length} mapped DWLR units</span>
      </div>
    </div>
  );
};
