"""
Station model — represents a DWLR monitoring station.

Each station has a fixed geographic location and belongs to a district/state.
"""

import uuid

from sqlalchemy import Column, String, Float, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.core.constants import RiskCategory


class Station(Base, TimestampMixin):
    __tablename__ = "stations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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

    # Current classification (updated on each recalculation)
    current_risk_category = Column(
        SAEnum(RiskCategory, name="risk_category"),
        nullable=True,
    )
    current_depth_m = Column(Float, nullable=True)

    # Forecast
    months_to_next_risk_tier = Column(Integer, nullable=True)
    forecast_risk_category = Column(
        SAEnum(RiskCategory, name="risk_category", create_constraint=False),
        nullable=True,
    )

    # Relationships
    readings = relationship("WaterLevelReading", back_populates="station", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Station {self.station_code} | {self.name} | {self.current_risk_category}>"
