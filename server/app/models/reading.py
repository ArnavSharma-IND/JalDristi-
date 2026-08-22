"""
WaterLevelReading model — a single DWLR observation.
"""

import uuid
from sqlalchemy import Column, Float, DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import relationship

from app.models.base import Base


class WaterLevelReading(Base):
    __tablename__ = "water_level_readings"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id = Column(Uuid(as_uuid=True), ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Core measurement
    depth_below_ground_m = Column(Float, nullable=False)

    # Optional enrichment
    reduced_level_m = Column(Float, nullable=True)
    quality_flag = Column(String(20), default="valid")

    # Relationships
    station = relationship("Station", back_populates="readings")

    def __repr__(self):
        return f"<Reading {self.station_id} @ {self.timestamp}: {self.depth_below_ground_m}m>"
