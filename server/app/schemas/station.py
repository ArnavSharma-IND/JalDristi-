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
    """LLM-generated advisory for a station."""
    station_id: UUID
    station_code: str
    risk_category: Optional[RiskCategory] = None
    summary: str = Field(description="One-paragraph plain-language situation summary")
    recommendation: str = Field(description="Actionable recommendation for stakeholders")
    urgency: str = Field(default="moderate", description="'low' | 'moderate' | 'high' | 'critical'")
    generated_at: datetime


# -- Pagination ----------------------------------------------------------------

class PaginatedStations(BaseModel):
    """Paginated list of station summaries."""
    items: List[StationSummary] = []
    total: int = Field(description="Total number of matching stations")
    page: int = Field(description="Current page number (1-indexed)")
    page_size: int = Field(description="Number of items per page")
    total_pages: int = Field(description="Total number of pages")
