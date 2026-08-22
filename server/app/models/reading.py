"""
WaterLevelReading / TelemetryReading model — a single DWLR observation.
"""

import uuid
from sqlalchemy import Column, Float, DateTime, ForeignKey, String, Boolean
from sqlalchemy.orm import relationship

from app.models.base import Base


class WaterLevelReading(Base):
    __tablename__ = "water_level_readings"

    id = Column(String(200), primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id = Column(String(100), ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Core measurement
    depth_below_ground_m = Column(Float, nullable=True)
    water_level_m_bgl = Column(Float, nullable=True)

    # Optional enrichment
    reduced_level_m = Column(Float, nullable=True)
    quality_flag = Column(String(20), default="valid")

    # Anomaly & Telemetry status
    is_anomaly = Column(Boolean, default=False)
    quality_status = Column(String(20), default="VALID")  # VALID, STALE, REJECTED

    # Relationships
    station = relationship("Station", back_populates="readings")

    def __init__(self, **kwargs):
        # Synchronize depth_below_ground_m and water_level_m_bgl
        lvl = kwargs.get("water_level_m_bgl") or kwargs.get("depth_below_ground_m")
        if lvl is not None:
            kwargs.setdefault("depth_below_ground_m", lvl)
            kwargs.setdefault("water_level_m_bgl", lvl)
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<Reading {self.station_id} @ {self.timestamp}: {self.water_level_m_bgl or self.depth_below_ground_m}m>"


# Alias for domain consistency
TelemetryReading = WaterLevelReading
