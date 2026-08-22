import React from 'react';
import { Link } from 'react-router-dom';
import type { Station } from '../../types/station';
import RiskBadge from '../common/RiskBadge';
import { ArrowRight } from 'lucide-react';

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
          Telemetry Station Register
        </h2>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Showing top {Math.min(stations.length, 100)} stations
        </span>
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
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Station Code &amp; Name</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>District &amp; State</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Latest Depth</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>CGWB Category</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {stations.slice(0, 100).map((station) => (
              <tr
                key={station.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background var(--transition-fast)',
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
                    to={'/station/' + station.id}
                    style={{ color: 'var(--color-text-primary)', fontWeight: 600, display: 'block' }}
                  >
                    {station.station_code}
                  </Link>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {station.name}
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {station.district}, {station.state}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {station.current_depth_m ? station.current_depth_m.toFixed(2) + 'm' : '—'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <RiskBadge risk={station.current_risk_category} size="sm" />
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Link
                    to={'/station/' + station.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-water-light)',
                      fontWeight: 600,
                    }}
                  >
                    Details <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}