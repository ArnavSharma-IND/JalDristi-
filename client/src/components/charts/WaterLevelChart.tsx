import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { Reading, StationForecast } from '../../types/station';
import { RISK_COLORS } from '../../types/station';
import { TrendingDown, AlertCircle, ShieldCheck, Activity, HelpCircle } from 'lucide-react';

interface WaterLevelChartProps {
  readings: Reading[];
  forecast?: StationForecast | null;
  wellDepth?: number;
}

export default function WaterLevelChart({
  readings,
  forecast,
  wellDepth = 50,
}: WaterLevelChartProps) {
  const [timeRange, setTimeRange] = useState<'1Y' | '3Y' | '5Y' | 'ALL'>('ALL');

  // Filter historical readings based on active time range
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    if (timeRange === 'ALL') return readings;

    const lastDate = new Date(readings[readings.length - 1].timestamp);
    const cutoffYears = timeRange === '1Y' ? 1 : timeRange === '3Y' ? 3 : 5;
    const cutoffDate = new Date(lastDate);
    cutoffDate.setFullYear(cutoffDate.getFullYear() - cutoffYears);

    return readings.filter((r) => new Date(r.timestamp) >= cutoffDate);
  }, [readings, timeRange]);

  // Combine historical readings with future projected forecast points
  const chartData = useMemo(() => {
    const data: Array<{
      date: string;
      displayDate: string;
      historicalDepth?: number;
      forecastDepth?: number;
      isForecast: boolean;
    }> = [];

    // Historical points
    filteredReadings.forEach((r) => {
      data.push({
        date: r.timestamp,
        displayDate: format(parseISO(r.timestamp), 'MMM yyyy'),
        historicalDepth: Number(r.depth_below_ground_m.toFixed(2)),
        isForecast: false,
      });
    });

    // Append forecast line starting from last historical reading for continuous continuity
    if (forecast && forecast.forecast_points && forecast.forecast_points.length > 0 && data.length > 0) {
      const lastHistorical = data[data.length - 1];
      lastHistorical.forecastDepth = lastHistorical.historicalDepth;

      forecast.forecast_points.forEach((fp) => {
        data.push({
          date: fp.date,
          displayDate: format(parseISO(fp.date), 'MMM yyyy'),
          forecastDepth: Number(fp.projected_depth_m.toFixed(2)),
          isForecast: true,
        });
      });
    }

    return data;
  }, [filteredReadings, forecast]);

  // Calculate dynamic axis depth bound (max depth padded)
  const maxY = useMemo(() => {
    if (chartData.length === 0) return 40;
    const depths = chartData.map((d) => Math.max(d.historicalDepth || 0, d.forecastDepth || 0));
    const highestObserved = Math.max(...depths);
    return Math.max(30, Math.ceil((highestObserved + 5) / 5) * 5);
  }, [chartData]);

  // Current status stats
  const latestReading = readings && readings.length > 0 ? readings[readings.length - 1] : null;
  const latestDepth = latestReading ? latestReading.depth_below_ground_m : 0;
  const minDepth = readings && readings.length > 0 ? Math.min(...readings.map((r) => r.depth_below_ground_m)) : 0;
  const maxDepth = readings && readings.length > 0 ? Math.max(...readings.map((r) => r.depth_below_ground_m)) : 0;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
            {p.displayDate}
          </div>
          {p.historicalDepth !== undefined && (
            <div style={{ color: 'var(--color-water-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Observed Water Depth:</span>
              <strong style={{ fontFamily: 'monospace' }}>{p.historicalDepth}m bgl</strong>
            </div>
          )}
          {p.forecastDepth !== undefined && p.isForecast && (
            <div style={{ color: 'var(--color-critical)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span>Projected Trend:</span>
              <strong style={{ fontFamily: 'monospace' }}>{p.forecastDepth}m bgl</strong>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!readings || readings.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
        No historical water level readings available for this station.
      </div>
    );
  }

  // Confidence color & badge text
  const confidenceColor =
    forecast?.confidence === 'high'
      ? 'var(--color-safe)'
      : forecast?.confidence === 'moderate'
      ? 'var(--color-semi-critical)'
      : 'var(--color-critical)';

  const confidenceDesc =
    forecast?.confidence === 'high'
      ? 'High Confidence (12+ mo continuous coverage Â· RÂ² > 0.7)'
      : forecast?.confidence === 'moderate'
      ? 'Moderate Confidence (6â€“12 mo sensor span)'
      : 'Low Confidence (Sparse temporal baseline)';

  return (
    <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingDown size={20} color="var(--color-water-primary)" />
            Water Table Trend &amp; CGWB Threshold Trajectory
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Meters below ground level (m bgl) Â· Ground surface is 0m (inverted vertical profile)
          </p>
        </div>

        {/* Time range buttons */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-secondary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          {(['1Y', '3Y', '5Y', 'ALL'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                background: timeRange === range ? 'var(--color-accent)' : 'transparent',
                color: timeRange === range ? '#ffffff' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: timeRange === range ? 600 : 400,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Mini-Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Current Depth</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#ffffff' }}>
            {latestDepth.toFixed(2)}m
          </div>
        </div>

        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Annual Trend Rate</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: forecast && forecast.rate_of_change_m_per_year > 0 ? 'var(--color-over-exploited)' : 'var(--color-safe)' }}>
            {forecast ? `${forecast.rate_of_change_m_per_year > 0 ? "+" : ""}${forecast.rate_of_change_m_per_year.toFixed(2)}m/yr` : "—"}
          </div>
        </div>

        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>All-Time Best / Worst</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
            {minDepth.toFixed(1)}m / {maxDepth.toFixed(1)}m
          </div>
        </div>

        {/* Statistical Confidence Badge (Feature #5) */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} color={confidenceColor} /> Model Confidence
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: confidenceColor, textTransform: 'capitalize', marginTop: '2px' }}>
            {forecast?.confidence || 'Moderate'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {forecast?.data_points_used || readings.length} observations
          </div>
        </div>

        {forecast?.months_to_next_risk_tier && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-over-exploited)', fontWeight: 600 }}>Next Threshold</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-over-exploited)' }}>
              {forecast.months_to_next_risk_tier} Months
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div style={{ height: '380px', width: '100%', marginTop: 'var(--space-2)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={30}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, maxY]}
              reversed={true}
              unit="m"
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={8}
              stroke={RISK_COLORS['Semi-Critical']}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Semi-Critical (8m)', fill: RISK_COLORS['Semi-Critical'], fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={15}
              stroke={RISK_COLORS['Critical']}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Critical (15m)', fill: RISK_COLORS['Critical'], fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={25}
              stroke={RISK_COLORS['Over-Exploited']}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Over-Exploited (25m)', fill: RISK_COLORS['Over-Exploited'], fontSize: 10, position: 'insideTopRight' }}
            />

            <Area
              type="monotone"
              dataKey="historicalDepth"
              name="Observed Depth"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#depthGradient)"
              connectNulls={false}
            />

            <Line
              type="linear"
              dataKey="forecastDepth"
              name="24-Month Forecast"
              stroke="#f97316"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={true}
            />

            <Legend
              wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
              iconType="plainline"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={12} />
          <span>Y-axis is inverted: 0m is ground surface; readings deepen downwards. Linear trend line projected forward 24 months.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: confidenceColor }}>
          <ShieldCheck size={12} />
          <span>{confidenceDesc}</span>
        </div>
      </div>
    </div>
  );
}
