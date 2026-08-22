import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AlertItem } from '../../types/station';
import { fetchAlerts } from '../../services/api';
import { Bell, AlertTriangle, ArrowRight, CheckCircle2, Users, Clock } from 'lucide-react';

export default function AlertFeed() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts(8)
      .then(setAlerts)
      .catch((err) => console.error('Error fetching alerts:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-over-exploited)',
            }}
          >
            <Bell size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
              Live Groundwater Risk Alerts &amp; Dispatch Feed
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Automated notifications generated when DWLR telemetry crosses CGWB threshold boundaries
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-over-exploited)' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-over-exploited)',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontWeight: 600 }}>Active Monitoring Channel</span>
        </div>
      </div>

      {/* Alert Feed Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
        {alerts.slice(0, 6).map((alert) => {
          const isOE = alert.current_risk_category === 'Over-Exploited';
          return (
            <div
              key={alert.id}
              style={{
                background: isOE ? 'rgba(239, 68, 68, 0.05)' : 'rgba(249, 115, 22, 0.05)',
                border: isOE ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(249, 115, 22, 0.25)',
                borderLeft: isOE ? '4px solid var(--color-over-exploited)' : '4px solid var(--color-critical)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color={isOE ? 'var(--color-over-exploited)' : 'var(--color-critical)'} />
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: '#ffffff' }}>
                    {alert.station_code}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    ({alert.district})
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: isOE ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                    color: isOE ? 'var(--color-over-exploited)' : 'var(--color-critical)',
                  }}
                >
                  {alert.current_risk_category}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {alert.message}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}>
                  <Users size={12} />
                  <span>Notified: Collector, BDO, GP Committee</span>
                </div>

                <Link
                  to={/station/}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-water-light)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Inspect <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
