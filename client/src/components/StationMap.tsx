import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
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
    <div className="h-[520px] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative">
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
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 border border-slate-700 px-3 py-2 rounded text-[11px] text-slate-300">
        Showing {validStations.length} of {stations.length} mapped DWLR units
      </div>
    </div>
  );
};
