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

// For Android emulator use 10.0.2.2, for iOS simulator or local network use localhost / LAN IP
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

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
      page_size: 100,
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

export default api;
