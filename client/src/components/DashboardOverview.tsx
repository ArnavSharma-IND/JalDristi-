import React from 'react';
import { StationSummary } from '../services/api';

interface DashboardOverviewProps {
  stations: StationSummary[];
  selectedRisk: string | null;
  onSelectRisk: (risk: string | null) => void;
  isLoading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stations,
  selectedRisk,
  onSelectRisk,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-lg border border-slate-700" />
        ))}
      </div>
    );
  }

  const total = stations.length;
  const counts = {
    SAFE: stations.filter((s) => s.telemetry_risk === 'SAFE').length,
    SEMI_CRITICAL: stations.filter((s) => s.telemetry_risk === 'SEMI_CRITICAL').length,
    CRITICAL: stations.filter((s) => s.telemetry_risk === 'CRITICAL').length,
    OVER_EXPLOITED: stations.filter((s) => s.telemetry_risk === 'OVER_EXPLOITED').length,
  };

  const cards = [
    {
      key: 'SAFE',
      label: 'Safe Aquifers',
      count: counts.SAFE,
      subtext: '< 5.0 m bgl depth',
      color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-950/50'
    },
    {
      key: 'SEMI_CRITICAL',
      label: 'Semi-Critical',
      count: counts.SEMI_CRITICAL,
      subtext: '5.0 - 10.0 m bgl depth',
      color: 'border-amber-500/50 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40',
      activeColor: 'ring-2 ring-amber-500 bg-amber-950/50'
    },
    {
      key: 'CRITICAL',
      label: 'Critical Depletion',
      count: counts.CRITICAL,
      subtext: '10.0 - 20.0 m bgl depth',
      color: 'border-orange-500/50 text-orange-400 bg-orange-950/20 hover:bg-orange-950/40',
      activeColor: 'ring-2 ring-orange-500 bg-orange-950/50'
    },
    {
      key: 'OVER_EXPLOITED',
      label: 'Over-Exploited',
      count: counts.OVER_EXPLOITED,
      subtext: '> 20.0 m bgl depth',
      color: 'border-rose-500/50 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40',
      activeColor: 'ring-2 ring-rose-500 bg-rose-950/50'
    }
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100">National Hydrological Command Center</h1>
          <p className="text-xs text-slate-400">Automated DWLR Telemetry & Groundwater Early Warning System</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Total Active DWLR Stations:</span>
          <span className="text-sm font-semibold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
            {total}
          </span>
          {selectedRisk && (
            <button
              onClick={() => onSelectRisk(null)}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const isSelected = selectedRisk === card.key;
          const percentage = total > 0 ? ((card.count / total) * 100).toFixed(1) : '0';
          return (
            <button
              key={card.key}
              onClick={() => onSelectRisk(isSelected ? null : card.key)}
              className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${card.color} ${
                isSelected ? card.activeColor : ''
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium uppercase tracking-wider">{card.label}</span>
                <span className="text-xs opacity-75">{percentage}%</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{card.count}</span>
                <span className="text-xs text-slate-400">stations</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{card.subtext}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
