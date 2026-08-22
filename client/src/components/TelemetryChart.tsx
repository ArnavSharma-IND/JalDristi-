import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ChartDataPoint {
  date: string;
  observed_level: number | null;
  forecast_level?: number;
}

interface TelemetryChartProps {
  history: { timestamp: string; water_level_m_bgl: number }[];
  forecast: {
    slope_m_per_day: number;
    projected_water_level: number | null;
    forecast_horizon_days: number;
  } | null;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ history, forecast }) => {
  if (!history || history.length === 0) {
    return <div className="p-10 text-center text-slate-500 text-sm">Insufficient telemetry history to render chart.</div>;
  }

  // Map history to chart data
  const data: ChartDataPoint[] = history.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    observed_level: item.water_level_m_bgl !== null ? Number(item.water_level_m_bgl.toFixed(2)) : null
  }));

  // Append a forecast point if valid regression data exists
  if (forecast && forecast.projected_water_level !== null && data.length > 0) {
    const lastDate = new Date(history[history.length - 1].timestamp);
    const futureDate = new Date(lastDate.getTime() + (forecast.forecast_horizon_days || 30) * 86400000);
    
    // Add the current point to the forecast line so they connect seamlessly
    data[data.length - 1].forecast_level = data[data.length - 1].observed_level ?? undefined;

    data.push({
      date: futureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' (Proj)',
      observed_level: null, // Don't connect the solid line
      forecast_level: forecast.projected_water_level
    });
  }

  // Reverse Y-Axis because higher depth (m bgl) means water is DEEPER (worse)
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          
          {/* Y-Axis is reversed so 0 (ground level) is at the top */}
          <YAxis 
            reversed={true} 
            stroke="#94a3b8" 
            label={{ value: 'Depth (m bgl)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            tickFormatter={(val) => (typeof val === 'number' ? val.toFixed(1) : val)}
          />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            formatter={(value: any) => [value !== null && value !== undefined ? `${Number(value).toFixed(2)} m bgl` : 'N/A', 'Depth']}
          />
          <Legend />

          {/* Real-life Government Risk Thresholds */}
          <ReferenceLine y={5.0} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Safe Limit', fill: '#10b981', fontSize: 10 }} />
          <ReferenceLine y={10.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Semi-Critical', fill: '#f59e0b', fontSize: 10 }} />
          <ReferenceLine y={20.0} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Over-Exploited', fill: '#f43f5e', fontSize: 10 }} />

          <Line 
            type="monotone" 
            dataKey="observed_level" 
            name="Observed Telemetry" 
            stroke="#06b6d4" 
            strokeWidth={3}
            dot={{ r: 3, fill: '#06b6d4' }} 
            activeDot={{ r: 6 }} 
          />
          
          {forecast && (
            <Line 
              type="monotone" 
              dataKey="forecast_level" 
              name="30-Day Regression Forecast" 
              stroke="#a855f7" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
