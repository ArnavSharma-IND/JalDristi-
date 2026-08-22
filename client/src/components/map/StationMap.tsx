import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Station, RiskCategory } from '../../types/station';
import { RISK_COLORS } from '../../types/station';
import RiskBadge from '../common/RiskBadge';
import { Filter, Eye, Layers } from 'lucide-react';

interface StationMapProps {
  stations: Station[];
}

// Helper to create custom colored SVG pin icons for Leaflet
function createCustomPin(color: string, isHighlighted: boolean = false) {
  const size = isHighlighted ? 32 : 24;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Subcomponent to animate map viewpoint when selected district changes
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

export default function StationMap({ stations }: StationMapProps) {
  const navigate = useNavigate();
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set(stations.map((s) => s.district).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Filter stations based on controls
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchRisk =
        selectedRisk === 'ALL' || s.current_risk_category === selectedRisk;
      const matchDistrict =
        selectedDistrict === 'ALL' || s.district === selectedDistrict;
      const matchSearch =
        !searchQuery ||
        s.station_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.district.toLowerCase().includes(searchQuery.toLowerCase());

      return matchRisk && matchDistrict && matchSearch;
    });
  }, [stations, selectedRisk, selectedDistrict, searchQuery]);

  // Calculate dynamic map center
  const mapCenter = useMemo<[number, number]>(() => {
    if (filteredStations.length === 0) return [20.5937, 78.9629]; // Center of India
    const lats = filteredStations.map((s) => s.latitude).filter((lat) => !isNaN(lat));
    const lons = filteredStations.map((s) => s.longitude).filter((lon) => !isNaN(lon));
    if (lats.length === 0) return [20.5937, 78.9629];
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
    return [avgLat, avgLon];
  }, [filteredStations]);

  const mapZoom = useMemo(() => {
    if (selectedDistrict !== 'ALL') return 9;
    if (filteredStations.length < 50) return 6;
    return 5;
  }, [selectedDistrict, filteredStations.length]);

  return (
    <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Map Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers size={20} color="var(--color-water-primary)" />
            Interactive DWLR Telemetry Map
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Showing {filteredStations.length} of {stations.length} monitoring stations
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search station or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              minWidth: 180,
            }}
          />

          {/* District Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--color-text-muted)" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter Buttons */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-secondary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            {['ALL', 'Safe', 'Semi-Critical', 'Critical', 'Over-Exploited'].map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                style={{
                  background: selectedRisk === risk ? 'var(--color-accent)' : 'transparent',
                  color: selectedRisk === risk ? '#ffffff' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: selectedRisk === risk ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height: '480px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#0a0e1a' }}
        >
          {/* Dark Mode CartoDB tiles for rich UI */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapViewController center={mapCenter} zoom={mapZoom} />

          {filteredStations.slice(0, 1000).map((station) => {
            const risk = station.current_risk_category || 'Safe';
            const color = RISK_COLORS[risk as RiskCategory] || '#0ea5e9';
            const icon = createCustomPin(color);

            return (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
                icon={icon}
              >
                <Popup>
                  <div style={{ padding: '4px', minWidth: '180px', color: '#1e293b' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      {station.station_code}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>
                      {station.district}, {station.state}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem' }}>
                      <span>Water Depth:</span>
                      <strong style={{ fontFamily: 'monospace' }}>
                        {station.current_depth_m ? `${station.current_depth_m.toFixed(1)}m` : 'N/A'}
                      </strong>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <RiskBadge risk={station.current_risk_category} size="sm" />
                    </div>

                    {station.months_to_next_risk_tier && (
                      <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginBottom: '8px', fontWeight: 600 }}>
                        ⚠️ Shifts to next risk tier in ~{station.months_to_next_risk_tier} mos
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/station/${station.id}`)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={12} /> View Full Forecast
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', padding: '0 var(--space-2)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS['Safe'] }}></span>
            Safe (&lt; 8m bgl)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS['Semi-Critical'] }}></span>
            Semi-Critical (8–15m bgl)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS['Critical'] }}></span>
            Critical (15–25m bgl)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS['Over-Exploited'] }}></span>
            Over-Exploited (&gt; 25m bgl)
          </span>
        </div>
        <div>Total mapped: {filteredStations.length}</div>
      </div>
    </div>
  );
}
