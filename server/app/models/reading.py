"""
WaterLevelReading / TelemetryReading model — a single DWLR observation.
"""

import uuid
from sqlalchemy import Column, Float, DateTime, ForeignKey, String, Uuid, Boolean
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

    # Anomaly & Telemetry status
    is_anomaly = Column(Boolean, default=False)
    quality_status = Column(String(20), default="VALID")  # VALID, STALE, REJECTED

    # Relationships
    station = relationship("Station", back_populates="readings")

    @property
    def water_level_m_bgl(self) -> float:
        return self.depth_below_ground_m

    def __repr__(self):
        return f"<Reading {self.station_id} @ {self.timestamp}: {self.depth_below_ground_m}m>"


# Alias for domain consistency
TelemetryReading = WaterLevelReading
