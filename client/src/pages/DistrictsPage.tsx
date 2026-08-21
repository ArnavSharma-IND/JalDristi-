import { useEffect, useState } from 'react';
import type { DistrictSummary } from '../types/station';
import { fetchDistricts } from '../services/api';
import { RISK_COLORS } from '../types/station';

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-12)', textAlign: 'center' }}>Loading districts...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
        District Risk Overview
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
        {districts.map((d) => (
          <div key={\-\} className="card">
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              {d.district}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
              {d.state} · {d.total_stations} stations
            </p>

            {/* Risk Distribution Bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
              {d.safe_count > 0 && (
                <div style={{ flex: d.safe_count, background: RISK_COLORS['Safe'] }} />
              )}
              {d.semi_critical_count > 0 && (
                <div style={{ flex: d.semi_critical_count, background: RISK_COLORS['Semi-Critical'] }} />
              )}
              {d.critical_count > 0 && (
                <div style={{ flex: d.critical_count, background: RISK_COLORS['Critical'] }} />
              )}
              {d.over_exploited_count > 0 && (
                <div style={{ flex: d.over_exploited_count, background: RISK_COLORS['Over-Exploited'] }} />
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Safe'] }} />
                Safe: {d.safe_count}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Semi-Critical'] }} />
                Semi-Critical: {d.semi_critical_count}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Critical'] }} />
                Critical: {d.critical_count}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Over-Exploited'] }} />
                Over-Exploited: {d.over_exploited_count}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
