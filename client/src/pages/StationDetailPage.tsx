import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { StationWithReadings, StationForecast, Advisory } from '../types/station';
import { fetchStation, fetchStationForecast, fetchStationAdvisory } from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import WaterLevelChart from '../components/charts/WaterLevelChart';
import { ArrowLeft, Brain, ShieldAlert, Sparkles, MapPin, Gauge } from 'lucide-react';

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [station, setStation] = useState<StationWithReadings | null>(null);
  const [forecast, setForecast] = useState<StationForecast | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetchStation(id),
      fetchStationForecast(id).catch(() => null),
      fetchStationAdvisory(id).catch(() => null),
    ])
      .then(([stationData, forecastData, advisoryData]) => {
        setStation(stationData);
        setForecast(forecastData);
        setAdvisory(advisoryData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const refreshAdvisory = () => {
    if (!id) return;
    setLoadingAdvisory(true);
    fetchStationAdvisory(id)
      .then(setAdvisory)
      .finally(() => setLoadingAdvisory(false));
  };

  if (loading) {
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-12)', textAlign: 'center' }}>
        Loading station telemetry &amp; forecasting models...
      </div>
    );
  }

  if (!station) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <h2>Station Not Found</h2>
        <Link to="/" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <ArrowLeft size={16} /> Back to Monitoring Overview
        </Link>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>
                {station.station_code}
              </h1>
              <RiskBadge risk={station.current_risk_category} />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <MapPin size={16} color="var(--color-water-primary)" />
              {station.name} · {station.district}, {station.state} {station.block && `(${station.block} Block)`}
            </p>
          </div>

          {forecast?.months_to_next_risk_tier && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 18px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--color-over-exploited)', textTransform: 'uppercase', fontWeight: 700 }}>
                Critical Transition Window
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-over-exploited)' }}>
                {forecast.months_to_next_risk_tier} Months Remaining
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Time Series Trend Chart */}
      <WaterLevelChart
        readings={station.readings}
        forecast={forecast}
        wellDepth={station.well_depth_m}
      />

      {/* 2-Column Info & Advisory Grid */}
      <div className="grid-dashboard">
        {/* Station Metadata & Hydrogeology */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Gauge size={20} color="var(--color-accent)" />
            Station Hydrogeology &amp; Specifications
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Aquifer Type</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{station.aquifer_type || 'Alluvial'}</div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Total Well Depth</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                {station.well_depth_m ? `${station.well_depth_m} meters` : '50 meters'}
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Coordinates</span>
              <div style={{ fontFamily: 'monospace', fontWeight: 600, marginTop: '2px' }}>
                {station.latitude.toFixed(4)}° N, {station.longitude.toFixed(4)}° E
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Total Logged Readings</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{station.readings.length} observations</div>
            </div>
          </div>
        </div>

        {/* AI Advisory Reasoning Panel */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-water-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Brain size={20} color="var(--color-water-primary)" />
              JalDrishti AI Advisory (Gemini)
            </h2>
            {advisory && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(14, 165, 233, 0.2)',
                  color: 'var(--color-water-light)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {advisory.urgency} Urgency
              </span>
            )}
          </div>

          {advisory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Situation Analysis
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                  {advisory.summary}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Recommended Interventions
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                  {advisory.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Generating plain-language reasoning &amp; stakeholder recommendations...
            </p>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Powered by Google Gemini 2.0 Flash
            </span>
            <button
              onClick={refreshAdvisory}
              disabled={loadingAdvisory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-water-light)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={12} /> Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
