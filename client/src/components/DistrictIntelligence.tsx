import React, { useMemo } from 'react';
import { StationSummary } from '../services/api';

interface DistrictIntelligenceProps {
  stations: StationSummary[];
  onSelectDistrict: (district: string) => void;
}

export const DistrictIntelligence: React.FC<DistrictIntelligenceProps> = ({ stations, onSelectDistrict }) => {
  // Aggregate stations by District
  const districtData = useMemo(() => {
    const map = new Map<string, any>();
    
    stations.forEach(s => {
      if (!map.has(s.district)) {
        map.set(s.district, {
          name: s.district,
          state: s.state,
          total_stations: 0,
          critical_count: 0,
          sum_water_level: 0,
          valid_readings_count: 0
        });
      }
      
      const dist = map.get(s.district);
      dist.total_stations += 1;
      
      if (s.telemetry_risk === 'CRITICAL' || s.telemetry_risk === 'OVER_EXPLOITED') {
        dist.critical_count += 1;
      }
      
      if (s.latest_water_level_m_bgl !== null) {
        dist.sum_water_level += s.latest_water_level_m_bgl;
        dist.valid_readings_count += 1;
      }
    });

    return Array.from(map.values()).map(d => ({
      ...d,
      avg_water_level: d.valid_readings_count > 0 ? (d.sum_water_level / d.valid_readings_count).toFixed(2) : 'N/A',
      health_percentage: Math.round(((d.total_stations - d.critical_count) / d.total_stations) * 100)
    })).sort((a, b) => b.critical_count - a.critical_count); // Sort by most critical first
  }, [stations]);

  if (districtData.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mt-6">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Regional District Intelligence</h2>
        <span className="text-xs text-slate-500">Aggregated from {stations.length} Active Stations</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
            <tr>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Monitored Stations</th>
              <th className="px-4 py-3">Avg Depth (m bgl)</th>
              <th className="px-4 py-3">Critical / Over-Exploited</th>
              <th className="px-4 py-3">Regional Health</th>
            </tr>
          </thead>
          <tbody>
            {districtData.map((dist, idx) => (
              <tr 
                key={idx} 
                onClick={() => onSelectDistrict && onSelectDistrict(dist.name)}
                className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-white">{dist.name}</td>
                <td className="px-4 py-3 text-slate-400">{dist.state}</td>
                <td className="px-4 py-3">{dist.total_stations}</td>
                <td className="px-4 py-3 font-mono">{dist.avg_water_level}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    dist.critical_count > 0 ? 'bg-rose-950/50 text-rose-400 border border-rose-900' : 'text-slate-500'
                  }`}>
                    {dist.critical_count} Stations
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${dist.health_percentage > 70 ? 'bg-emerald-500' : dist.health_percentage > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${dist.health_percentage}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
