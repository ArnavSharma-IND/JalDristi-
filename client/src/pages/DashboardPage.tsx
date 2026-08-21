import { useEffect, useState } from 'react';
import type { Station } from '../types/station';
import { fetchStations } from '../services/api';
import StatsCards from '../components/dashboard/StatsCards';
import StationTable from '../components/dashboard/StationTable';

export default function DashboardPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading stations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--color-over-exploited)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-over-exploited)' }}>Failed to load data: {error}</p>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
          Make sure the backend server is running on port 8000.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
          Groundwater Monitoring Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
          Real-time risk classification and trend forecasting across monitored stations
        </p>
      </div>

      <StatsCards stations={stations} />

      <div style={{ marginTop: 'var(--space-8)' }}>
        <StationTable stations={stations} />
      </div>
    </div>
  );
}
