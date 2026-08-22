import React, { useEffect, useState } from 'react';
import type { DistrictSummary } from '../types/station';
import { fetchDistricts } from '../services/api';
import { RISK_COLORS } from '../types/station';
import { MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

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
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-12)', textAlign: 'center' }}>
        Loading regional district classifications...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MapPin size={28} color="var(--color-water-primary)" />
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>
            District Risk &amp; Resource Summary
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', marginTop: '4px' }}>
          Aggregated CGWB classification distribution across monitoring districts
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
        {districts.map((d) => {
          const total = d.total_stations || 1;
          const safePct = (d.safe_count / total) * 100;
          const semiPct = (d.semi_critical_count / total) * 100;
          const critPct = (d.critical_count / total) * 100;
          const overPct = (d.over_exploited_count / total) * 100;

          return (
            <div key={d.district + '-' + d.state} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
                    {d.district}
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                    {d.state}
                  </p>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontWeight: 600 }}>
                  {d.total_stations} Stations
                </div>
              </div>

              {/* Risk Distribution Bar */}
              <div style={{ display: 'flex', height: 10, borderRadius: 'var(--radius-full)', overflow: 'hidden', background: '#1e293b' }}>
                {d.safe_count > 0 && (
                  <div style={{ width: safePct + '%', background: RISK_COLORS['Safe'] }} title={'Safe: ' + d.safe_count} />
                )}
                {d.semi_critical_count > 0 && (
                  <div style={{ width: semiPct + '%', background: RISK_COLORS['Semi-Critical'] }} title={'Semi-Critical: ' + d.semi_critical_count} />
                )}
                {d.critical_count > 0 && (
                  <div style={{ width: critPct + '%', background: RISK_COLORS['Critical'] }} title={'Critical: ' + d.critical_count} />
                )}
                {d.over_exploited_count > 0 && (
                  <div style={{ width: overPct + '%', background: RISK_COLORS['Over-Exploited'] }} title={'Over-Exploited: ' + d.over_exploited_count} />
                )}
              </div>

              {/* Stats Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Safe'] }} />
                  <span>Safe: <strong>{d.safe_count}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Semi-Critical'] }} />
                  <span>Semi-Crit: <strong>{d.semi_critical_count}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Critical'] }} />
                  <span>Critical: <strong>{d.critical_count}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS['Over-Exploited'] }} />
                  <span>Over-Exploited: <strong>{d.over_exploited_count}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}