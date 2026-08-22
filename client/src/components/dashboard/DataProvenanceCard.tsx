import React, { useEffect, useState } from 'react';
import type { DataProvenance } from '../../types/station';
import { fetchProvenance } from '../../services/api';
import { ShieldCheck, Database, Calendar, MapPin, Layers, ExternalLink } from 'lucide-react';

export default function DataProvenanceCard() {
  const [provenance, setProvenance] = useState<DataProvenance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvenance()
      .then(setProvenance)
      .catch((err) => console.error('Provenance load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !provenance) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 4px 20px -2px rgba(14, 165, 233, 0.1)',
        padding: 'var(--space-5)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(14, 165, 233, 0.15)',
              color: 'var(--color-water-primary)',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Verified Data Provenance &amp; Benchmark Methodology
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {provenance.source_organization} · {provenance.cgwb_reference}
            </p>
          </div>
        </div>

        <a
          href="https://indiawris.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-water-light)',
            textDecoration: 'none',
            padding: '4px 10px',
            background: 'rgba(14, 165, 233, 0.1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
          }}
        >
          <span>India-WRIS Open Portal</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Provenance Stat Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            <Database size={12} color="var(--color-water-primary)" /> Total DWLR Stations
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
            {provenance.total_stations.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>monitored</span>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            <Layers size={12} color="var(--color-water-light)" /> Logged Observations
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-water-light)', marginTop: '2px' }}>
            {provenance.total_readings.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>telemetry pts</span>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            <Calendar size={12} color="var(--color-accent)" /> Temporal Span
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
            {provenance.date_range_start} – {provenance.date_range_end}
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            <MapPin size={12} color="var(--color-safe)" /> Geospatial Coverage
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-safe)', marginTop: '4px' }}>
            {provenance.resolved_districts_count} Districts · 3 Deep Focus
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          lineHeight: 1.5,
          color: 'var(--color-text-secondary)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-water-primary)',
        }}
      >
        <strong>Technical Evaluation Note:</strong> Real-time DWLR observations are evaluated against CGWB standard norms. Focus districts (<strong>Mehsana, Jaipur, Nagpur</strong>) incorporate official block-level <em>Stage of Groundwater Development (%)</em> extraction-recharge metrics. All stations maintain active sensor-depth telemetry proxies.
      </div>
    </div>
  );
}
