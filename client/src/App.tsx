import React, { useState, useEffect } from 'react';
import { apiService, StationSummary } from './services/api';
import { DashboardOverview } from './components/DashboardOverview';
import { StationMap } from './components/StationMap';
import { StationDetailModal } from './components/StationDetailModal';
import { DistrictIntelligence } from './components/DistrictIntelligence';

function App() {
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedRisk, selectedDistrict]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: { district?: string; risk?: string } = {};
      if (selectedRisk) params.risk = selectedRisk;
      if (selectedDistrict) params.district = selectedDistrict;
      const data = await apiService.getStations(Object.keys(params).length ? params : undefined);
      setStations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to JalDrishti Backend API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]">
            JD
          </div>
          <span className="font-bold text-lg tracking-wide text-white">JalDrishti <span className="text-cyan-500">Platform</span></span>
        </div>
        <div className="flex gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> API Online</span>
          <span>SIH25068 Demo</span>
        </div>
      </nav>

      <main className="p-6 max-w-[1600px] mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded bg-rose-950 border border-rose-800 text-rose-300 shadow-lg">
            <strong>System Error:</strong> {error}
            <button onClick={fetchDashboardData} className="ml-4 underline text-rose-200 cursor-pointer">Retry Connection</button>
          </div>
        )}

        <DashboardOverview 
          stations={stations} 
          selectedRisk={selectedRisk} 
          onSelectRisk={setSelectedRisk} 
          isLoading={isLoading} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Live Telemetry Map</h2>
            <StationMap stations={stations} onSelectStation={setSelectedStationId} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Early Warning Feed</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-[520px] overflow-y-auto space-y-3">
              {stations.filter(s => s.telemetry_risk === 'CRITICAL' || s.telemetry_risk === 'OVER_EXPLOITED').length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-10">No critical alerts detected in the selected filter.</div>
              ) : (
                stations
                  .filter(s => s.telemetry_risk === 'CRITICAL' || s.telemetry_risk === 'OVER_EXPLOITED')
                  .map(station => (
                    <div key={station.station_id} className="p-3 rounded border border-rose-900/50 bg-rose-950/20">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-rose-400">{station.station_id}</span>
                        <span className="text-[10px] text-slate-500">{station.last_updated ? new Date(station.last_updated).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                      <div className="text-sm text-slate-200 mb-2">
                        Water level at {station.district} has reached <span className="font-bold text-rose-300">{station.latest_water_level_m_bgl?.toFixed(2)} m bgl</span>.
                      </div>
                      <button 
                        onClick={() => setSelectedStationId(station.station_id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        Analyze Trend &rarr;
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Regional District Intelligence Section */}
        <DistrictIntelligence 
          stations={stations} 
          onSelectDistrict={(district) => setSelectedDistrict(selectedDistrict === district ? null : district)} 
        />
      </main>

      {selectedStationId && (
        <StationDetailModal 
          stationId={selectedStationId} 
          onClose={() => setSelectedStationId(null)} 
        />
      )}
    </div>
  );
}

export default App;
