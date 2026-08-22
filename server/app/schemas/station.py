"""Pydantic schemas for Station API responses."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import RiskCategory


# ── Base ──────────────────────────────────────────────────────────────────────

class StationBase(BaseModel):
    station_code: str
    name: str
    latitude: float
    longitude: float
    district: str
    state: str
    block: Optional[str] = None
    aquifer_type: Optional[str] = None
    well_depth_m: Optional[float] = None
    stage_of_development: Optional[float] = None
    classification_method: Optional[str] = None


class StationSummary(BaseModel):
    """Lightweight station representation for list views and map markers."""
    id: UUID
    station_code: str
    name: str
    latitude: float
    longitude: float
    district: str
    state: str
    current_risk_category: Optional[RiskCategory] = None
    current_depth_m: Optional[float] = None
    months_to_next_risk_tier: Optional[int] = None
    stage_of_development: Optional[float] = None
    classification_method: Optional[str] = None

    model_config = {"from_attributes": True}


class StationDetail(StationBase):
    """Full station detail including forecast info."""
    id: UUID
    current_risk_category: Optional[RiskCategory] = None
    current_depth_m: Optional[float] = None
    months_to_next_risk_tier: Optional[int] = None
    forecast_risk_category: Optional[RiskCategory] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Readings ──────────────────────────────────────────────────────────────────

class ReadingOut(BaseModel):
    timestamp: datetime
    depth_below_ground_m: float
    quality_flag: str = "valid"

    model_config = {"from_attributes": True}


class StationWithReadings(StationDetail):
    """Station detail with its full time-series of readings."""
    readings: List[ReadingOut] = []


# ── Forecast ──────────────────────────────────────────────────────────────────

class ForecastPoint(BaseModel):
    """A single point in the projected trend line."""
    date: datetime
    projected_depth_m: float


class StationForecast(BaseModel):
    """Forecast response for a single station."""
    station_id: UUID
    station_code: str
    current_risk_category: Optional[RiskCategory] = None
    current_depth_m: Optional[float] = None
    forecast_risk_category: Optional[RiskCategory] = None
    months_to_next_risk_tier: Optional[int] = None
    trend_direction: str = Field(description="'declining' | 'stable' | 'recovering'")
    rate_of_change_m_per_year: float = Field(description="Meters per year depth change")
    forecast_points: List[ForecastPoint] = []
    confidence: str = Field(default="moderate", description="'low' | 'moderate' | 'high'")
    data_points_used: int = 0


# ── District ──────────────────────────────────────────────────────────────────

class DistrictSummary(BaseModel):
    """Aggregate risk summary for a district."""
    district: str
    state: str
    total_stations: int
    safe_count: int = 0
    semi_critical_count: int = 0
    critical_count: int = 0
    over_exploited_count: int = 0
    unclassified_count: int = 0


# ── Advisory ──────────────────────────────────────────────────────────────────

class AdvisoryResponse(BaseModel):
    """Advisory response for a station."""
    station_id: UUID
    station_code: str
    risk_category: Optional[RiskCategory] = None
    summary: str = Field(description="One-paragraph plain-language situation summary")
    recommendation: str = Field(description="Actionable recommendation for stakeholders")
    urgency: str = Field(default="moderate", description="'low' | 'moderate' | 'high' | 'critical'")
    advisory_source: str = Field(default="template", description="'gemini' (LLM GenAI) or 'template' (Deterministic Fallback)")
    generated_at: datetime


# ── Provenance ────────────────────────────────────────────────────────────────

class DataProvenance(BaseModel):
    """Verified provenance & metadata for the loaded dataset."""
    dataset_name: str
    source_organization: str
    source_portal: str
    source_url: str
    ingestion_date: str
    total_stations: int
    total_readings: int
    date_range_start: str
    date_range_end: str
    resolved_districts_count: int
    unresolved_stations_count: int
    primary_classification_metric: str
    cgwb_reference: str


# ── Dual Classification ───────────────────────────────────────────────────────

class DualClassification(BaseModel):
    """Side-by-side comparison of CGWB Stage vs Sensor Depth Proxy."""
    station_id: UUID
    station_code: str
    station_name: str
    district: str
    state: str
    block: Optional[str] = None
    current_depth_m: Optional[float] = None
    depth_proxy_category: RiskCategory
    depth_proxy_basis: str
    stage_of_development: Optional[float] = None
    stage_category: Optional[RiskCategory] = None
    stage_basis: Optional[str] = None
    active_method: str = Field(description="'stage' | 'depth_proxy'")
    cgwb_citation: Optional[str] = None


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    """Live notification of risk transition / critical status."""
    id: UUID
    station_id: UUID
    station_code: str
    station_name: str
    district: str
    state: str
    previous_risk_category: str
    current_risk_category: str
    current_depth_m: float
    alert_type: str
    message: str
    notified_roles: List[str]
    created_at: datetime


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginatedStations(BaseModel):
    """Paginated list of station summaries."""
    items: List[StationSummary] = []
    total: int = Field(description="Total number of matching stations")
    page: int = Field(description="Current page number (1-indexed)")
    page_size: int = Field(description="Number of items per page")
    total_pages: int = Field(description="Total number of pages")
