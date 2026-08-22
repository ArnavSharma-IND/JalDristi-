import React from 'react';
import { Droplets, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import type { Station } from '../../types/station';

interface StatsCardsProps {
  stations: Station[];
}

export default function StatsCards({ stations }: StatsCardsProps) {
  const total = stations.length;
  const safe = stations.filter((s) => s.current_risk_category === 'Safe').length;
  const semiCritical = stations.filter((s) => s.current_risk_category === 'Semi-Critical').length;
  const critical = stations.filter(
    (s) => s.current_risk_category === 'Critical' || s.current_risk_category === 'Over-Exploited'
  ).length;
  const overExploited = stations.filter((s) => s.current_risk_category === 'Over-Exploited').length;

  const stats = [
    {
      label: 'Monitored Stations',
      value: total.toLocaleString(),
      subtext: 'Active DWLR Telemetry Units',
      icon: Activity,
      color: 'var(--color-water-primary)',
      bg: 'rgba(14, 165, 233, 0.12)',
    },
    {
      label: 'Safe Aquifers',
      value: safe.toLocaleString(),
      subtext: '< 8m depth below ground',
      icon: Droplets,
      color: 'var(--color-safe)',
      bg: 'rgba(34, 197, 94, 0.12)',
    },
    {
      label: 'Semi-Critical Zone',
      value: semiCritical.toLocaleString(),
      subtext: '8–15m depth below ground',
      icon: TrendingDown,
      color: 'var(--color-semi-critical)',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Critical / Over-Exploited',
      value: critical.toLocaleString(),
      subtext: overExploited + ' Over-Exploited (> 25m)',
      icon: AlertTriangle,
      color: 'var(--color-over-exploited)',
      bg: 'rgba(239, 68, 68, 0.12)',
    },
  ];

  return (
    <div className="grid-stats">
      {stats.map(({ label, value, subtext, icon: Icon, color, bg }) => (
        <div key={label} className="card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              opacity: 0.05,
              pointerEvents: 'none',
            }}
          >
            <Icon size={110} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 800,
              color: color,
              marginTop: '4px',
              fontFamily: 'monospace',
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {subtext}
          </div>
        </div>
      ))}
    </div>
  );
}