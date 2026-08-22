"""
Station model - represents a DWLR monitoring station.
"""

import uuid
from sqlalchemy import Column, String, Float, Integer, Enum as SAEnum, Uuid
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.core.constants import RiskCategory


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

    # Stage of Groundwater Development (%)
    # = (Annual GW Extraction / Net Annual GW Recharge) x 100
    # When available, this is the official CGWB metric and takes precedence
    # over depth-based proxy classification.
    stage_of_development = Column(Float, nullable=True)

    # Classification method used
    # 'stage' = official CGWB metric, 'depth_proxy' = depth-based proxy
    classification_method = Column(String(20), nullable=True)

    # Current classification
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

    def __repr__(self):
        return f"<Station {self.station_code} | {self.name} | {self.current_risk_category}>"
