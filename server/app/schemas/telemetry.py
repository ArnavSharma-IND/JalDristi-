"""
Telemetry & Station Pydantic schemas for API data contracts.
Explicitly separates statutory CGWB benchmark status from live telemetry risk.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.station import RiskLevel


class TelemetryBase(BaseModel):
    station_id: str
    timestamp: datetime
    water_level_m_bgl: float
    quality_status: str = "VALID"

    model_config = {"from_attributes": True}


class StationDetailResponse(BaseModel):
    station_id: str
    district: str
    latitude: float
    longitude: float
    latest_water_level: Optional[float] = Field(None, description="Latest reading in m bgl")
    last_updated: Optional[datetime] = None

    # Strictly separated UI properties
    official_benchmark_status: RiskLevel = Field(RiskLevel.INSUFFICIENT_DATA, description="CGWB Statutory Assessment")
    telemetry_risk: RiskLevel = Field(RiskLevel.INSUFFICIENT_DATA, description="Live Telemetry Depth Proxy")

    # Forecast metadata
    forecast_trend_slope: Optional[float] = None
    forecast_confidence: str = Field("INSUFFICIENT_DATA", description="HIGH, MEDIUM, LOW, INSUFFICIENT_DATA")

    model_config = {"from_attributes": True}
