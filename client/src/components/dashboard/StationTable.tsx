import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Station, RiskCategory } from '../../types/station';
import RiskBadge from '../common/RiskBadge';
import {
  ArrowRight,
  Search,
  Filter,
  MapPin,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface StationTableProps {
  stations: Station[];
}

export default function StationTable({ stations }: StationTableProps) {
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    stations.forEach((s) => {
      if (s.district && s.district !== 'Unresolved') set.add(s.district);
    });
    return Array.from(set).sort();
  }, [stations]);

  // Filter stations
  const filtered = useMemo(() => {
    return stations.filter((s) => {
      const matchSearch =
        search === '' ||
        s.station_code.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.district.toLowerCase().includes(search.toLowerCase());

      const matchRisk =
        selectedRisk === 'ALL' || s.current_risk_category === selectedRisk;

      const matchDist =
        selectedDistrict === 'ALL' || s.district === selectedDistrict;

      return matchSearch && matchRisk && matchDist;
    });
  }, [stations, search, selectedRisk, selectedDistrict]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Table Header & Search Bar */}
      <div
        style={{
          padding: 'var(--space-5) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800 }}>
              Telemetry Station Register &amp; Live Observations
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Sub-annual water level depth telemetry mapped against statutory CGWB risk categories
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            <span>Showing <strong style={{ color: '#ffffff' }}>{paginated.length}</strong> of <strong style={{ color: '#ffffff' }}>{filtered.length}</strong> matching units</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search station code, name, district..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-control"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          {/* District Dropdown */}
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setPage(1);
            }}
            className="select-control"
            style={{ flex: '0 1 200px' }}
          >
            <option value="ALL">All Districts ({districts.length})</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Risk Pill Filter Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            {(['ALL', 'Safe', 'Semi-Critical', 'Critical', 'Over-Exploited'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRisk(r);
                  setPage(1);
                }}
                style={{
                  background: selectedRisk === r ? 'var(--color-water-primary)' : 'transparent',
                  color: selectedRisk === r ? '#ffffff' : 'var(--color-text-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: selectedRisk === r ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Station Code &amp; Name</th>
              <th>District &amp; State</th>
              <th>Latest Depth (m bgl)</th>
              <th>Classification Method</th>
              <th>CGWB Category</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No monitoring stations found matching your search criteria.
                </td>
              </tr>
            ) : (
              paginated.map((st) => (
                <tr key={st.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {st.station_code}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {st.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                      <MapPin size={12} color="var(--color-water-primary)" />
                      <span>{st.district}, {st.state}</span>
                    </div>
                    {st.block && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', paddingLeft: '18px' }}>
                        Block: {st.block}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                      {st.current_depth_m != null ? `${st.current_depth_m.toFixed(2)}m` : '—'}
                    </div>
                  </td>
                  <td>
                    {st.classification_method === 'stage' ? (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        CGWB Stage ({st.stage_of_development?.toFixed(1)}%)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Depth Telemetry Proxy
                      </span>
                    )}
                  </td>
                  <td>
                    <RiskBadge risk={st.current_risk_category} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/station/${st.id}`}
                      className="btn btn-secondary"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        gap: '4px',
                      }}
                    >
                      <span>Analysis</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Page {page} of {totalPages} ({filtered.length} total stations)
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
