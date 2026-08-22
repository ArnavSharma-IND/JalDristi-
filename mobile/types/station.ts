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
  stage_of_development?: number;
  classification_method?: string;
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
  advisory_source?: 'gemini' | 'template';
  generated_at: string;
}

export interface DataProvenance {
  dataset_name: string;
  source_organization: string;
  source_portal: string;
  source_url: string;
  ingestion_date: string;
  total_stations: number;
  total_readings: number;
  date_range_start: string;
  date_range_end: string;
  resolved_districts_count: number;
  unresolved_stations_count: number;
  primary_classification_metric: string;
  cgwb_reference: string;
}

export interface DualClassification {
  station_id: string;
  station_code: string;
  station_name: string;
  district: string;
  state: string;
  block?: string;
  current_depth_m?: number;
  depth_proxy_category: RiskCategory;
  depth_proxy_basis: string;
  stage_of_development?: number;
  stage_category?: RiskCategory;
  stage_basis?: string;
  active_method: 'stage' | 'depth_proxy';
  cgwb_citation?: string;
}

export interface AlertItem {
  id: string;
  station_id: string;
  station_code: string;
  station_name: string;
  district: string;
  state: string;
  previous_risk_category: string;
  current_risk_category: string;
  current_depth_m: number;
  alert_type: string;
  message: string;
  notified_roles: string[];
  created_at: string;
}

export interface PaginatedStations {
  items: Station[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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
