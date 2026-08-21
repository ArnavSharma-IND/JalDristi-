import { Droplets, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import type { Station } from '../../types/station';

interface StatsCardsProps {
  stations: Station[];
}

export default function StatsCards({ stations }: StatsCardsProps) {
  const total = stations.length;
  const safe = stations.filter((s) => s.current_risk_category === 'Safe').length;
  const critical = stations.filter(
    (s) => s.current_risk_category === 'Critical' || s.current_risk_category === 'Over-Exploited'
  ).length;
  const declining = stations.filter(
    (s) => s.months_to_next_risk_tier && s.months_to_next_risk_tier <= 12
  ).length;

  const stats = [
    {
      label: 'Total Stations',
      value: total,
      icon: Activity,
      color: 'var(--color-accent)',
    },
    {
      label: 'Safe',
      value: safe,
      icon: Droplets,
      color: 'var(--color-safe)',
    },
    {
      label: 'Critical / Over-Exploited',
      value: critical,
      icon: AlertTriangle,
      color: 'var(--color-over-exploited)',
    },
    {
      label: 'At Risk (< 12 months)',
      value: declining,
      icon: TrendingDown,
      color: 'var(--color-critical)',
    },
  ];

  return (
    <div className="grid-stats">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              opacity: 0.06,
            }}
          >
            <Icon size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                background: \20,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {label}
            </span>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 800,
              color,
              marginTop: 'var(--space-3)',
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
