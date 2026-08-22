import React, { useEffect, useState } from 'react';
import { apiService, AdvisoryResponse } from '../services/api';
import { TelemetryChart } from './TelemetryChart';

interface StationDetailModalProps {
  stationId: string;
  onClose: () => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({ stationId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    document.body.classList.add('modal-open');
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const [stationRes, advisoryRes] = await Promise.all([
          apiService.getStationDetail(stationId),
          apiService.getStationAdvisory(stationId)
        ]);
        if (isMounted) {
          setData(stationRes);
          setAdvisory(advisoryRes);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load station telemetry.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
      document.body.classList.remove('modal-open');
    };
  }, [stationId]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl p-6 text-slate-200 relative">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{data?.name || stationId}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                {stationId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              District: {data?.district || '—'} | State: {data?.state || '—'} | Lat: {data?.latitude?.toFixed(4)}, Lon: {data?.longitude?.toFixed(4)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-4 py-2 rounded bg-slate-800 border border-slate-700 text-sm font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse text-sm">
            Retrieving DWLR observations, calculating regression forecasts, and generating advisory...
          </div>
        ) : error ? (
          <div className="my-6 p-4 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6 mt-6">

            {/* Dual Classification Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border border-cyan-800/40 bg-cyan-950/20">
                <div className="text-xs font-semibold uppercase text-cyan-400">Current Telemetry Risk Indicator</div>
                <div className="text-lg font-bold text-white mt-1">{data?.telemetry_risk}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Based on latest real-time depth observation ({data?.latest_water_level_m_bgl?.toFixed(2) ?? 'N/A'} m bgl)</div>
              </div>
              <div className="p-3.5 rounded-lg border border-indigo-800/40 bg-indigo-950/20">
                <div className="text-xs font-semibold uppercase text-indigo-400">Official CGWB Statutory Status</div>
                <div className="text-lg font-bold text-white mt-1">{data?.official_cgwb_status}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Statutory benchmark from Central Ground Water Board assessment</div>
              </div>
            </div>

            {/* Empirical Forecast Summary */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Trend & Empirical Forecast (30-Day Horizon)
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Confidence: {data?.forecast?.confidence}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Model Type</div>
                  <div className="font-semibold text-slate-200 mt-1">{data?.forecast?.model_type}</div>
                </div>
                <div>
                  <div className="text-slate-400">Trajectory</div>
                  <div className="font-semibold text-slate-200 mt-1">{data?.forecast?.trend_direction} ({data?.forecast?.slope_m_per_day} m/day)</div>
                </div>
                <div>
                  <div className="text-slate-400">Fit Quality (R²)</div>
                  <div className="font-semibold text-slate-200 mt-1">{data?.forecast?.r_squared !== null ? data?.forecast?.r_squared : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Projected 30d Level</div>
                  <div className="font-semibold text-slate-200 mt-1">
                    {data?.forecast?.projected_water_level !== null ? `${data?.forecast?.projected_water_level} m bgl` : 'Insufficient Data'}
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Time-Series Chart */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Telemetry Time-Series & 30-Day Regression Forecast
                </h3>
                {data?.sensor_health && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${data.sensor_health.status === 'HEALTHY'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : data.sensor_health.status === 'STALE'
                        ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                        : 'bg-rose-950/60 border-rose-700 text-rose-300'
                    }`}>
                    Sensor: {data.sensor_health.status}
                  </span>
                )}
              </div>
              <TelemetryChart history={data?.history || []} forecast={data?.forecast || null} />
            </div>

            {/* AI / Fallback Advisory Section */}
            {advisory && (
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Hydrological Advisory</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${advisory.source === 'AI-GENERATED'
                      ? 'bg-purple-950/60 border-purple-700 text-purple-300'
                      : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}>
                    {advisory.source}
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Situation Assessment: </span>
                    <span className="text-slate-200">{advisory.situation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Risk Analysis: </span>
                    <span className="text-slate-200">{advisory.risk_explanation}</span>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium mb-1">Recommended Directives:</div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-200">
                      {advisory.recommended_actions?.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Data Provenance Footer */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
              <span>Telemetry Source: National Water Informatics Centre (NWIC) DWLR Network</span>
              <span>Observations Processed: {data?.observation_count || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
