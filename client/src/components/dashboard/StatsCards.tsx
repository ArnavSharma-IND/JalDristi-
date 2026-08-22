import React from 'react';
import { Droplets, AlertTriangle, TrendingDown, Activity, ShieldCheck, Gauge } from 'lucide-react';
import type { Station } from '../../types/station';

interface StatsCardsProps {
  stations: Station[];
}

export default function StatsCards({ stations }: StatsCardsProps) {
  const total = stations.length || 6424;
  const safe = stations.filter((s) => s.current_risk_category === 'Safe').length;
  const semiCritical = stations.filter((s) => s.current_risk_category === 'Semi-Critical').length;
  const critical = stations.filter(
    (s) => s.current_risk_category === 'Critical' || s.current_risk_category === 'Over-Exploited'
  ).length;
  const overExploited = stations.filter((s) => s.current_risk_category === 'Over-Exploited').length;

  const safePct = ((safe / total) * 100).toFixed(1);
  const semiPct = ((semiCritical / total) * 100).toFixed(1);
  const critPct = ((critical / total) * 100).toFixed(1);

  const stats = [
    {
      label: 'Telemetry Network',
      value: total.toLocaleString(),
      subtext: 'Active DWLR telemetry nodes',
      pct: '100%',
      icon: Activity,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.12)',
      border: 'rgba(14, 165, 233, 0.3)',
      barColor: '#0ea5e9',
    },
    {
      label: 'Safe Aquifers',
      value: safe.toLocaleString(),
      subtext: `${safePct}% of national coverage (< 8m bgl)`,
      pct: `${safePct}%`,
      icon: Droplets,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      barColor: '#10b981',
    },
    {
      label: 'Semi-Critical Zone',
      value: semiCritical.toLocaleString(),
      subtext: `${semiPct}% caution threshold (8–15m bgl)`,
      pct: `${semiPct}%`,
      icon: TrendingDown,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      barColor: '#f59e0b',
    },
    {
      label: 'Critical & Over-Exploited',
      value: critical.toLocaleString(),
      subtext: `${overExploited} Over-Exploited (> 25m or > 100% Stage)`,
      pct: `${critPct}%`,
      icon: AlertTriangle,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(239, 68, 68, 0.35)',
      barColor: '#ef4444',
    },
  ];

  return (
    <div className="grid-stats">
      {stats.map(({ label, value, subtext, pct, icon: Icon, color, bg, border, barColor }) => (
        <div
          key={label}
          className="card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            borderColor: border,
          }}
        >
          {/* Subtle watermark background icon */}
          <div
            style={{
              position: 'absolute',
              top: -15,
              right: -15,
              opacity: 0.04,
              pointerEvents: 'none',
            }}
          >
            <Icon size={120} color={color} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${bg}`,
                }}
              >
                <Icon size={18} color={color} />
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {label}
              </span>
            </div>

            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: color,
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                background: bg,
              }}
            >
              {pct}
            </span>
          </div>

          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              marginTop: '4px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.03em',
            }}
          >
            {value}
          </div>

          {/* Progress Distribution Bar */}
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '2px',
            }}
          >
            <div
              style={{
                width: pct,
                height: '100%',
                backgroundColor: barColor,
                borderRadius: '2px',
                boxShadow: `0 0 8px ${barColor}`,
              }}
            />
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {subtext}
          </div>
        </div>
      ))}
    </div>
  );
}
