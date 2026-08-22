import React, { useState, useEffect, useMemo } from 'react';
import { apiService, StationSummary } from './services/api';
import { DashboardOverview } from './components/DashboardOverview';
import { StationMap } from './components/StationMap';
import { StationDetailModal } from './components/StationDetailModal';
import { DistrictIntelligence } from './components/DistrictIntelligence';

function App() {
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [aquiferSummary, setAquiferSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchAquiferMetrics();
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

  const fetchAquiferMetrics = async () => {
    try {
      const summary = await apiService.getAquiferSummary();
      setAquiferSummary(summary);
    } catch {
      // Non-blocking fallback
    }
  };

  const handleSimulatePing = async () => {
    try {
      setIsSimulating(true);
      setSimulationNotice(null);
      const result = await apiService.simulatePing();
      setSimulationNotice(
        `⚡ Simulated reading ingested for ${result.name} (${result.station_id}): ${result.previous_depth_m_bgl}m → ${result.new_depth_m_bgl}m bgl (${result.delta_m > 0 ? '+' : ''}${result.delta_m}m). Risk: ${result.new_telemetry_risk}.`
      );
      await fetchDashboardData();
      await fetchAquiferMetrics();
    } catch (err: any) {
      setSimulationNotice(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
      setTimeout(() => setSimulationNotice(null), 8000);
    }
  };

  // Filter stations by text search
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.toLowerCase();
    return stations.filter(
      s =>
        s.station_id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.telemetry_risk.toLowerCase().includes(q)
    );
  }, [stations, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap justify-between items-center sticky top-0 z-40 shadow-md gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center font-bold text-white shadow-[0_0_12px_rgba(8,145,178,0.6)]">
            JD
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide text-white">JalDrishti <span className="text-cyan-400">Command Center</span></span>
            <div className="text-[10px] text-slate-400 hidden sm:block">National Ground Water Telemetry & Decision Support System</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Action Buttons */}
          <button
            onClick={handleSimulatePing}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-md bg-cyan-950 border border-cyan-700 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            title="Inject simulated DWLR sensor reading"
          >
            <span className="animate-pulse">⚡</span> {isSimulating ? 'Ingesting...' : 'Simulate Sensor Ping'}
          </button>

          <a
            href={apiService.getExportCsvUrl()}
            download
            className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download CSV report of active stations"
          >
            📥 Export Report (CSV)
          </a>

          <div className="hidden md:flex gap-3 text-xs font-medium text-slate-400 pl-2 border-l border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              API Online
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-400 border border-slate-700">SIH25068</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* Simulation Feedback Alert */}
        {simulationNotice && (
          <div className="p-3.5 rounded-lg bg-cyan-950/80 border border-cyan-700 text-cyan-200 text-xs flex justify-between items-center shadow-lg animate-fadeIn">
            <span>{simulationNotice}</span>
            <button onClick={() => setSimulationNotice(null)} className="text-cyan-400 hover:text-white font-bold ml-3 cursor-pointer">✕</button>
          </div>
        )}

        {/* System Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-sm shadow-lg flex justify-between items-center">
            <div>
              <strong>System Connection Alert:</strong> {error}
            </div>
            <button onClick={fetchDashboardData} className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded text-xs cursor-pointer">Retry</button>
          </div>
        )}

        {/* Aquifer Health & Regional Overview Strip */}
        {aquiferSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs">
            <div>
              <div className="text-slate-400">Total Monitored DWLR Units</div>
              <div className="text-lg font-bold text-white mt-0.5">{aquiferSummary.total_active_dwlr} Units</div>
              <div className="text-[10px] text-slate-500">{aquiferSummary.monitored_readings_count} Ingested Observations</div>
            </div>
            <div>
              <div className="text-slate-400">Average Aquifer Depth</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{aquiferSummary.average_aquifer_depth_m_bgl} m bgl</div>
              <div className="text-[10px] text-slate-500">Real-time weighted regional depth</div>
            </div>
            <div>
              <div className="text-slate-400">Resource Stress Index</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{aquiferSummary.resource_stress_index}%</div>
              <div className="text-[10px] text-slate-500">Critical & Over-exploited ratio</div>
            </div>
            <div>
              <div className="text-slate-400">Overall Aquifer Health</div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  aquiferSummary.aquifer_health_rating === 'HEALTHY'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : aquiferSummary.aquifer_health_rating === 'VULNERABLE'
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                    : 'bg-rose-950/60 border-rose-700 text-rose-300'
                }`}>
                  {aquiferSummary.aquifer_health_rating}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Global Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station ID, name, district, state..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            {selectedDistrict && (
              <span className="px-2 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center gap-1">
                District: {selectedDistrict}
                <button onClick={() => setSelectedDistrict(null)} className="hover:text-white font-bold ml-1 cursor-pointer">✕</button>
              </span>
            )}
            {selectedRisk && (
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
                Risk: {selectedRisk}
                <button onClick={() => setSelectedRisk(null)} className="hover:text-white font-bold ml-1 cursor-pointer">✕</button>
              </span>
            )}
            {(selectedDistrict || selectedRisk || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDistrict(null);
                  setSelectedRisk(null);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Risk Distribution Cards */}
        <DashboardOverview 
          stations={stations} 
          selectedRisk={selectedRisk} 
          onSelectRisk={setSelectedRisk} 
          isLoading={isLoading} 
        />

        {/* Main Grid: Map & Early Warning Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Live DWLR Telemetry Map</h2>
              <span className="text-xs text-slate-500">Displaying {filteredStations.length} of {stations.length} Stations</span>
            </div>
            <StationMap stations={filteredStations} onSelectStation={setSelectedStationId} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Early Warning Alerts Feed</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-[520px] overflow-y-auto space-y-3">
              {filteredStations.filter(s => s.telemetry_risk === 'CRITICAL' || s.telemetry_risk === 'OVER_EXPLOITED').length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-16">
                  <div className="text-2xl mb-2">🛡️</div>
                  No critical alerts detected under active filter criteria.
                </div>
              ) : (
                filteredStations
                  .filter(s => s.telemetry_risk === 'CRITICAL' || s.telemetry_risk === 'OVER_EXPLOITED')
                  .map(station => (
                    <div key={station.station_id} className="p-3.5 rounded-lg border border-rose-900/60 bg-rose-950/25 hover:border-rose-700 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-bold text-rose-300 font-mono">{station.station_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-800 font-semibold">
                          {station.telemetry_risk}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mb-2">
                        {station.name} ({station.district}, {station.state}) has reached{' '}
                        <span className="font-bold text-rose-300">{station.latest_water_level_m_bgl?.toFixed(2)} m bgl</span>.
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-rose-900/40">
                        <span className="text-[10px] text-slate-400">
                          {station.last_updated ? new Date(station.last_updated).toLocaleDateString() : 'Active'}
                        </span>
                        <button 
                          onClick={() => setSelectedStationId(station.station_id)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          Analyze Telemetry &rarr;
                        </button>
                      </div>
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

      {/* Drill-down Intelligence Modal */}
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
