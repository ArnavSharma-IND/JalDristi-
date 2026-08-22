import React, { useEffect, useState } from 'react';
import type { Station } from '../types/station';
import { fetchStations } from '../services/api';
import StatsCards from '../components/dashboard/StatsCards';
import DataProvenanceCard from '../components/dashboard/DataProvenanceCard';
import AlertFeed from '../components/dashboard/AlertFeed';
import StationTable from '../components/dashboard/StationTable';
import StationMap from '../components/map/StationMap';
import { Droplets, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchStations()
      .then(setStations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Header banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <Droplets size={32} color="var(--color-water-primary)" />
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Groundwater Resource Evaluation &amp; Telemetry
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)' }}>
            Real-time DWLR monitoring · Dual-mode CGWB risk categorization · 24-month trend projection
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-over-exploited)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <p style={{ color: 'var(--color-over-exploited)', fontWeight: 600 }}>Backend Connection Notice: {error}</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
            Ensure the FastAPI server is running (http://localhost:8000).
          </p>
        </div>
      )}

      {/* Verified Data Provenance Card (Feature #1) */}
      <DataProvenanceCard />

      {/* Metric High-Level Cards */}
      <StatsCards stations={stations} />

      {/* Real-time Alert & Dispatch Feed (Feature #4) */}
      <AlertFeed />

      {/* Interactive GIS Map */}
      <StationMap stations={stations} />

      {/* Station List Table */}
      <StationTable stations={stations} />
    </div>
  );
}
