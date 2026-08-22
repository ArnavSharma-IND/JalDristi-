"""
Alert model — tracks risk category transitions and stakeholders notified.
"""

import uuid
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, Uuid
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id = Column(Uuid(as_uuid=True), ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    alert_type = Column(String(50), default="threshold_crossed", nullable=False)
    previous_risk_category = Column(String(50), nullable=False)
    current_risk_category = Column(String(50), nullable=False)
    depth_at_trigger_m = Column(Float, nullable=False)
    message = Column(String(500), nullable=False)
    notified_roles = Column(String(200), default="District Collector, Block Development Officer, Gram Panchayat")
    acknowledged = Column(Boolean, default=False)

    station = relationship("Station", backref="alerts")

    def __repr__(self):
        return f"<Alert {self.station_id} | {self.current_risk_category} | {self.created_at}>"
