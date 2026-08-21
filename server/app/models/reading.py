"""
WaterLevelReading model — a single DWLR observation.

Each reading records the water depth at a station at a specific timestamp.
"""

import uuid

from sqlalchemy import Column, Float, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class WaterLevelReading(Base):
    __tablename__ = "water_level_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id = Column(UUID(as_uuid=True), ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Core measurement
    depth_below_ground_m = Column(Float, nullable=False)  # meters below ground level

    # Optional enrichment
    reduced_level_m = Column(Float, nullable=True)  # meters above mean sea level
    quality_flag = Column(String(20), default="valid")  # valid | suspect | missing

    # Relationships
    station = relationship("Station", back_populates="readings")

    def __repr__(self):
        return f"<Reading {self.station_id} @ {self.timestamp}: {self.depth_below_ground_m}m>"
