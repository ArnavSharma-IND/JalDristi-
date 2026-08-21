import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { StationWithReadings, StationForecast, Advisory } from '../types/station';
import { fetchStation, fetchStationForecast, fetchStationAdvisory } from '../services/api';
import RiskBadge from '../components/common/RiskBadge';

export default function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [station, setStation] = useState<StationWithReadings | null>(null);
  const [forecast, setForecast] = useState<StationForecast | null>(null);
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

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

  if (loading) {
    return <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-12)', textAlign: 'center' }}>Loading station details...</div>;
  }

  if (!station) {
    return <div className="card">Station not found.</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          ← Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
            {station.station_code}
          </h1>
          <RiskBadge risk={station.current_risk_category} />
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {station.name} · {station.district}, {station.state}
        </p>
      </div>

      <div className="grid-dashboard">
        {/* Station Info Card */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Station Information
          </h2>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
            <div>
              <dt style={{ color: 'var(--color-text-muted)' }}>Block</dt>
              <dd>{station.block || '—'}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--color-text-muted)' }}>Aquifer Type</dt>
              <dd>{station.aquifer_type || '—'}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--color-text-muted)' }}>Well Depth</dt>
              <dd>{station.well_depth_m ? \m : '—'}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--color-text-muted)' }}>Current Depth</dt>
              <dd style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
                {station.current_depth_m?.toFixed(1) ?? '—'}m
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--color-text-muted)' }}>Coordinates</dt>
              <dd style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
                {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--color-text-muted)' }}>Readings Count</dt>
              <dd>{station.readings.length}</dd>
            </div>
          </dl>
        </div>

        {/* Forecast Card */}
        <div className="card" style={{ borderColor: forecast?.months_to_next_risk_tier ? 'var(--color-critical)' : 'var(--color-border)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Trend Forecast
          </h2>
          {forecast ? (
            <div style={{ display: 'grid', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Trend: </span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {forecast.trend_direction}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Rate: </span>
                <span style={{ fontFamily: 'monospace' }}>
                  {forecast.rate_of_change_m_per_year > 0 ? '+' : ''}
                  {forecast.rate_of_change_m_per_year.toFixed(2)} m/year
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Confidence: </span>
                <span style={{ textTransform: 'capitalize' }}>{forecast.confidence}</span>
              </div>
              {forecast.months_to_next_risk_tier && (
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-over-exploited)', fontSize: 'var(--font-size-2xl)' }}>
                    {forecast.months_to_next_risk_tier} months
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                    until projected transition to{' '}
                    <strong>{forecast.forecast_risk_category}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)' }}>Forecast unavailable</p>
          )}
        </div>
      </div>

      {/* Advisory Card */}
      {advisory && (
        <div className="card" style={{ marginTop: 'var(--space-6)', borderLeft: '3px solid var(--color-water-primary)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            🤖 AI Advisory
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(14, 165, 233, 0.15)',
                color: 'var(--color-water-light)',
              }}
            >
              {advisory.urgency.toUpperCase()}
            </span>
          </h2>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              Situation Summary
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.7 }}>{advisory.summary}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              Recommendation
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.7 }}>{advisory.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
