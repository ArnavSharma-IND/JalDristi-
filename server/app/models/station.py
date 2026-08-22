"""
Station model - represents a DWLR monitoring station.
Explicitly separates statutory CGWB benchmarks from live telemetry sensor risks.
"""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Enum as SAEnum, Boolean, DateTime, Uuid, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.core.constants import RiskCategory


class RiskLevel(str, enum.Enum):
    SAFE = "SAFE"
    SEMI_CRITICAL = "SEMI_CRITICAL"
    CRITICAL = "CRITICAL"
    OVER_EXPLOITED = "OVER_EXPLOITED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class Station(Base, TimestampMixin):
    __tablename__ = "stations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)

    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)

    # Administrative
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    block = Column(String(100), nullable=True)

    # Aquifer info
    aquifer_type = Column(String(100), nullable=True)
    well_depth_m = Column(Float, nullable=True)

    # Status & Flags
    is_active = Column(Boolean, default=True)

    # Phase 6: Explicit Separation of Statutory CGWB vs Telemetry Risks
    official_cgwb_status = Column(
        SAEnum(RiskLevel, name="risk_level", native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=RiskLevel.INSUFFICIENT_DATA,
        nullable=True,
    )
    telemetry_risk_indicator = Column(
        SAEnum(RiskLevel, name="risk_level", native_enum=False, create_constraint=False, values_callable=lambda obj: [e.value for e in obj]),
        default=RiskLevel.INSUFFICIENT_DATA,
        nullable=True,
    )

    # Stage of Groundwater Development (%)
    # = (Annual GW Extraction / Net Annual GW Recharge) x 100
    stage_of_development = Column(Float, nullable=True)

    # Classification method used
    # 'stage' = official CGWB metric, 'depth_proxy' = depth-based proxy
    classification_method = Column(String(20), nullable=True)

    # Current classification (compatible with existing dashboard)
    current_risk_category = Column(
        SAEnum(RiskCategory, name="risk_category", native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    current_depth_m = Column(Float, nullable=True)

    # Forecast
    months_to_next_risk_tier = Column(Integer, nullable=True)
    forecast_risk_category = Column(
        SAEnum(RiskCategory, name="risk_category", native_enum=False, create_constraint=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )

    # Relationships
    readings = relationship("WaterLevelReading", back_populates="station", cascade="all, delete-orphan")

    @property
    def station_id(self) -> str:
        return self.station_code or str(self.id)

    def __repr__(self):
        return f"<Station {self.station_code} | {self.name} | {self.current_risk_category}>"
