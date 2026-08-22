import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { Reading, StationForecast } from '../../types/station';
import { RISK_COLORS } from '../../types/station';
import { TrendingDown, Calendar, AlertCircle } from 'lucide-react';

interface WaterLevelChartProps {
  readings: Reading[];
  forecast: StationForecast | null;
  wellDepth?: number;
}

interface MergedDataPoint {
  date: string;
  displayDate: string;
  historicalDepth?: number;
  forecastDepth?: number;
  isForecast: boolean;
}

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data: MergedDataPoint = payload[0]?.payload;
  if (!data) return null;

  const depth = data.historicalDepth ?? data.forecastDepth ?? 0;
  let status = 'Safe';
  let statusColor = RISK_COLORS['Safe'];

  if (depth >= 25) {
    status = 'Over-Exploited';
    statusColor = RISK_COLORS['Over-Exploited'];
  } else if (depth >= 15) {
    status = 'Critical';
    statusColor = RISK_COLORS['Critical'];
  } else if (depth >= 8) {
    status = 'Semi-Critical';
    statusColor = RISK_COLORS['Semi-Critical'];
  }

  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg)',
        fontSize: 'var(--font-size-xs)',
      }}
    >
      <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>
        {data.displayDate} {data.isForecast && '(Projected)'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ color: data.isForecast ? '#38bdf8' : '#0ea5e9', fontWeight: 600 }}>
          {data.isForecast ? 'Forecast Depth:' : 'Observed Depth:'}
        </span>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
          {depth.toFixed(2)} m bgl
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
        <span style={{ color: statusColor, fontWeight: 600 }}>{status}</span>
      </div>
    </div>
  );
};

export default function WaterLevelChart({ readings, forecast, wellDepth }: WaterLevelChartProps) {
  const [timeRange, setTimeRange] = useState<'1Y' | '3Y' | '5Y' | 'ALL'>('ALL');

  // Filter historical readings based on timeRange
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    if (timeRange === 'ALL') return readings;

    const now = new Date(readings[readings.length - 1]?.timestamp || Date.now());
    const years = timeRange === '1Y' ? 1 : timeRange === '3Y' ? 3 : 5;
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - years);

    const filtered = readings.filter((r) => new Date(r.timestamp) >= cutoff);
    return filtered.length > 0 ? filtered : readings;
  }, [readings, timeRange]);

  // Combine historical and forecast into one continuous chart data stream
  const chartData = useMemo<MergedDataPoint[]>(() => {
    const data: MergedDataPoint[] = [];

    // Historical readings
    filteredReadings.forEach((r) => {
      const d = new Date(r.timestamp);
      data.push({
        date: r.timestamp,
        displayDate: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        historicalDepth: r.depth_below_ground_m,
        isForecast: false,
      });
    });

    // Bridge point to connect historical line to forecast line
    if (filteredReadings.length > 0 && forecast && forecast.forecast_points?.length > 0) {
      const last = filteredReadings[filteredReadings.length - 1];
      // Attach forecast starting at the last historical point
      data[data.length - 1].forecastDepth = last.depth_below_ground_m;

      forecast.forecast_points.forEach((fp) => {
        const d = new Date(fp.date);
        data.push({
          date: fp.date,
          displayDate: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          forecastDepth: fp.projected_depth_m,
          isForecast: true,
        });
      });
    }

    return data;
  }, [filteredReadings, forecast]);

  // Key stats
  const depths = readings.map((r) => r.depth_below_ground_m);
  const minDepth = depths.length > 0 ? Math.min(...depths) : 0;
  const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
  const latestDepth = depths.length > 0 ? depths[depths.length - 1] : 0;

  // Max Y boundary for chart (ensure well depth and risk lines fit)
  const maxY = useMemo(() => {
    const highestVal = Math.max(maxDepth, forecast?.forecast_points?.[forecast.forecast_points.length - 1]?.projected_depth_m || 0, 30);
    return Math.ceil(highestVal / 5) * 5 + 5;
  }, [maxDepth, forecast]);

  if (!readings || readings.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No historical water level readings available for this station.
      </div>
    );
  }

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
            Meters below ground level (m bgl) · Lower is deeper
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Current Depth</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#ffffff' }}>
            {latestDepth.toFixed(2)}m
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Annual Trend Rate</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: forecast && forecast.rate_of_change_m_per_year > 0 ? 'var(--color-over-exploited)' : 'var(--color-safe)' }}>
            {forecast ? `${forecast.rate_of_change_m_per_year > 0 ? '+' : ''}${forecast.rate_of_change_m_per_year.toFixed(2)}m/yr` : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>All-Time Best / Worst</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
            {minDepth.toFixed(1)}m / {maxDepth.toFixed(1)}m
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
              {/* Historical depth area gradient */}
              <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
              {/* Forecast depth gradient */}
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
              reversed={true} // Inverted so surface (0m) is at top and deep well is at bottom
              unit="m"
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* CGWB Standard Risk Thresholds */}
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

            {/* Historical Readings Area */}
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

            {/* Forecast Projection Line (Dashed) */}
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

      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <AlertCircle size={12} />
        <span>Y-axis is inverted: 0m is ground surface; readings deepen downwards. Linear trend line projected forward 24 months.</span>
      </div>
    </div>
  );
}
