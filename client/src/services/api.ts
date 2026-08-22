import axios from 'axios';
import type {
  Station,
  StationWithReadings,
  StationForecast,
  DistrictSummary,
  Advisory,
  DataProvenance,
  DualClassification,
  AlertItem,
  PaginatedStations,
} from '../types/station';

export interface StationSummary {
  station_id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  official_cgwb_status: 'SAFE' | 'SEMI_CRITICAL' | 'CRITICAL' | 'OVER_EXPLOITED' | 'INSUFFICIENT_DATA';
  telemetry_risk: 'SAFE' | 'SEMI_CRITICAL' | 'CRITICAL' | 'OVER_EXPLOITED' | 'INSUFFICIENT_DATA';
  latest_water_level_m_bgl: number | null;
  last_updated: string | null;
}

export interface ForecastData {
  model_type: string;
  observation_count: number;
  historical_duration_days?: number;
  forecast_horizon_days: number;
  slope_m_per_day: number;
  r_squared: number | null;
  trend_direction: 'STABLE' | 'DEPLETING' | 'RECHARGING' | 'UNKNOWN';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  projected_water_level: number | null;
  reason: string;
}

export interface AdvisoryResponse {
  situation: string;
  risk_explanation: string;
  trend: string;
  recommended_actions: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  data_confidence: string;
  source: 'AI-GENERATED' | 'RULE-BASED FALLBACK';
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const res = await fetch(`${API_BASE_URL}${normalizedUrl}`);
  if (!res.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail?.error?.message || errorJson.detail || errorDetail;
    } catch {
      errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const apiService = {
  getStations: (params?: { district?: string; risk?: string }) => {
    const query = new URLSearchParams();
    if (params?.district) query.append('district', params.district);
    if (params?.risk) query.append('risk', params.risk);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithErrorHandling<StationSummary[]>(`/stations${queryString}`);
  },

  getStationDetail: (id: string) => {
    return fetchWithErrorHandling<any>(`/stations/${id}`);
  },

  getStationAdvisory: (id: string) => {
    return fetchWithErrorHandling<AdvisoryResponse>(`/stations/${id}/advisory`);
  },

  getProvenance: () => {
    return fetchWithErrorHandling<{
      source: string;
      dataset_name: string;
      time_period: string;
      coverage: string;
      processing_method: string;
      is_simulated_for_demo: boolean;
    }>('/provenance');
  },

  simulatePing: async (stationId?: string) => {
    const url = `${API_BASE_URL}/stations/simulate-ping${stationId ? `?station_id=${stationId}` : ''}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Simulation request failed');
    return res.json();
  },

  getAquiferSummary: () => {
    return fetchWithErrorHandling<{
      total_active_dwlr: number;
      monitored_readings_count: number;
      average_aquifer_depth_m_bgl: number;
      critical_count: number;
      over_exploited_count: number;
      safe_count: number;
      resource_stress_index: number;
      aquifer_health_rating: string;
    }>('/stations/analytics/aquifer-summary');
  },

  getExportCsvUrl: () => `${API_BASE_URL}/stations/export/csv`
};

// ── Compatible Legacy & Helper API Functions ──────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchStations(params?: {
  district?: string;
  state?: string;
  risk?: string;
  page?: number;
  page_size?: number;
}): Promise<Station[]> {
  const { data } = await api.get<PaginatedStations | Station[]>('/stations', {
    params: {
      page: 1,
      page_size: 500,
      ...params,
    },
  });
  if (data && 'items' in data) {
    return data.items;
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchStation(id: string): Promise<StationWithReadings> {
  const { data } = await api.get('/stations/' + id);
  return data;
}

export async function fetchStationForecast(id: string): Promise<StationForecast> {
  const { data } = await api.get('/stations/' + id + '/forecast');
  return data;
}

export async function fetchStationAdvisory(id: string): Promise<Advisory> {
  const { data } = await api.get('/stations/' + id + '/advisory');
  return data;
}

export async function fetchDualClassification(id: string): Promise<DualClassification> {
  const { data } = await api.get('/stations/' + id + '/dual-classification');
  return data;
}

export async function fetchProvenance(): Promise<DataProvenance> {
  const { data } = await api.get('/provenance');
  return data;
}

export async function fetchAlerts(limit: number = 50): Promise<AlertItem[]> {
  const { data } = await api.get('/alerts', { params: { limit } });
  return data;
}

export async function fetchDistricts(): Promise<DistrictSummary[]> {
  const { data } = await api.get('/districts');
  return data;
}

export async function fetchDistrictStations(district: string): Promise<Station[]> {
  const { data } = await api.get('/districts/' + encodeURIComponent(district) + '/stations');
  return data;
}

export async function fetchHealth(): Promise<{ status: string }> {
  const { data } = await api.get('/health');
  return data;
}

export default api;
