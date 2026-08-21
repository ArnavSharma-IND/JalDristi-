export type RiskCategory = 'Safe' | 'Semi-Critical' | 'Critical' | 'Over-Exploited';

export interface Station {
  id: string;
  station_code: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  block?: string;
  aquifer_type?: string;
  well_depth_m?: number;
  current_risk_category?: RiskCategory;
  current_depth_m?: number;
  months_to_next_risk_tier?: number;
  forecast_risk_category?: RiskCategory;
}

export interface Reading {
  timestamp: string;
  depth_below_ground_m: number;
  quality_flag: string;
}

export interface StationWithReadings extends Station {
  readings: Reading[];
  created_at: string;
  updated_at: string;
}

export interface ForecastPoint {
  date: string;
  projected_depth_m: number;
}

export interface StationForecast {
  station_id: string;
  station_code: string;
  current_risk_category?: RiskCategory;
  current_depth_m?: number;
  forecast_risk_category?: RiskCategory;
  months_to_next_risk_tier?: number;
  trend_direction: 'declining' | 'stable' | 'recovering';
  rate_of_change_m_per_year: number;
  forecast_points: ForecastPoint[];
  confidence: 'low' | 'moderate' | 'high';
  data_points_used: number;
}

export interface DistrictSummary {
  district: string;
  state: string;
  total_stations: number;
  safe_count: number;
  semi_critical_count: number;
  critical_count: number;
  over_exploited_count: number;
  unclassified_count: number;
}

export interface Advisory {
  station_id: string;
  station_code: string;
  risk_category?: RiskCategory;
  summary: string;
  recommendation: string;
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  generated_at: string;
}

export const RISK_COLORS: Record<RiskCategory, string> = {
  'Safe': '#22c55e',
  'Semi-Critical': '#f59e0b',
  'Critical': '#f97316',
  'Over-Exploited': '#ef4444',
};

export const RISK_ORDER: RiskCategory[] = [
  'Safe',
  'Semi-Critical',
  'Critical',
  'Over-Exploited',
];
