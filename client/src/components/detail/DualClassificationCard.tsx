import React from 'react';
import type { DualClassification } from '../../types/station';
import RiskBadge from '../common/RiskBadge';
import { Scale, CheckCircle2, AlertCircle, BookmarkCheck, Activity } from 'lucide-react';

interface DualClassificationCardProps {
  classification: DualClassification | null;
  loading?: boolean;
}

export default function DualClassificationCard({
  classification,
  loading,
}: DualClassificationCardProps) {
  if (loading || !classification) {
    return null;
  }

  const isStageActive = classification.active_method === 'stage';
  const hasStageData = classification.stage_of_development != null;

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(56, 189, 248, 0.2)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
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
              background: 'rgba(14, 165, 233, 0.15)',
              color: 'var(--color-water-primary)',
            }}
          >
            <Scale size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>
              Dual-Mode Classification Matrix (CGWB vs Sensor Proxy)
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Side-by-side evaluation of statutory CGWB extraction-recharge ratio vs live DWLR depth telemetry
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Method 1: CGWB Official Stage of Development */}
        <div
          style={{
            background: hasStageData && isStageActive ? 'rgba(14, 165, 233, 0.08)' : 'var(--color-bg-secondary)',
            border: hasStageData && isStageActive ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookmarkCheck size={16} color="var(--color-water-light)" />
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                CGWB Statutory Standard
              </span>
            </div>

            {hasStageData && isStageActive && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: 'var(--color-safe)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={10} /> Active Governance
              </span>
            )}
          </div>

          {hasStageData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Stage of Development</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    {classification.stage_of_development?.toFixed(1)}%
                  </div>
                </div>
                <RiskBadge risk={classification.stage_category} />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {classification.stage_basis}
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                Ã°Å¸â€œâ€“ {classification.cgwb_citation || 'CGWB Dynamic GW Resource Assessment'}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: 'auto 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                <AlertCircle size={14} />
                <span>Statutory Block Data Not Mapped</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4, margin: 0 }}>
                Block-level recharge/extraction figures for this station are undergoing harmonization. Falling back automatically to real-time DWLR sensor depth proxy.
              </p>
            </div>
          )}
        </div>

        {/* Method 2: Sensor-Based Depth Proxy */}
        <div
          style={{
            background: !isStageActive ? 'rgba(14, 165, 233, 0.08)' : 'var(--color-bg-secondary)',
            border: !isStageActive ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="var(--color-water-primary)" />
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                Sensor Telemetry Proxy
              </span>
            </div>

            {!isStageActive && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(14, 165, 233, 0.2)',
                  color: 'var(--color-water-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={10} /> Active Proxy
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Latest Observation Depth</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                {classification.current_depth_m ? `${classification.current_depth_m.toFixed(2)}m` : 'N/A'}
              </div>
            </div>
            <RiskBadge risk={classification.depth_proxy_category} />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            {classification.depth_proxy_basis}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
            Thresholds: Safe (&lt;8m) Ã‚Â· Semi-Critical (8Ã¢â‚¬â€œ15m) Ã‚Â· Critical (15Ã¢â‚¬â€œ25m) Ã‚Â· Over-Exploited (&gt;25m)
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          lineHeight: 1.5,
          color: 'var(--color-text-secondary)',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-accent)',
        }}
      >
        <strong>Interoperability Pipeline:</strong> CGWB's statutory <em>Stage of Groundwater Development (%)</em> is evaluated once every 1Ã¢â‚¬â€œ2 years at block scale. JalDrishti pairs it with <em>high-frequency DWLR depth telemetry</em> to catch intra-year depletion spikes months before official annual yearbooks publish.
      </div>
    </div>
  );
}
