import axios from 'axios';
import type {
  Station,
  StationWithReadings,
  StationForecast,
  DistrictSummary,
  Advisory,
} from '../types/station';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchStations(params?: {
  district?: string;
  state?: string;
  risk?: string;
}): Promise<Station[]> {
  const { data } = await api.get('/stations', { params });
  return data;
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