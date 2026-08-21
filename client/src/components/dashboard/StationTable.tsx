import { Link } from 'react-router-dom';
import type { Station } from '../../types/station';
import RiskBadge from '../common/RiskBadge';

interface StationTableProps {
  stations: Station[];
}

export default function StationTable({ stations }: StationTableProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
          Monitoring Stations
        </h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                textAlign: 'left',
              }}
            >
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Station</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>District</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Depth (m)</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Forecast</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr
                key={station.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background var(--transition-fast)',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = 'var(--color-bg-card-hover)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Link
                    to={/station/\}
                    style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}
                  >
                    {station.station_code}
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {station.name}
                    </div>
                  </Link>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {station.district}, {station.state}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace' }}>
                  {station.current_depth_m?.toFixed(1) ?? '—'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RiskBadge risk={station.current_risk_category} size='sm' />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {station.months_to_next_risk_tier
                    ? \ months
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
