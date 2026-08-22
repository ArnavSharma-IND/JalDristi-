"""
Robust Data Ingestion Pipeline.
Handles missing values, validates timestamps, prevents duplicate records,
and returns explicit acceptance/rejection statistics without silently failing.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field, ValidationError

from app.models.station import Station, TelemetryReading, RiskLevel
from app.services.analytics import evaluate_telemetry_risk

logger = logging.getLogger(__name__)


# Strict validation schema for incoming DWLR data
class RawTelemetryPayload(BaseModel):
    station_id: str = Field(..., min_length=3)
    timestamp: datetime
    water_level_m_bgl: float = Field(..., ge=0.0, description="Cannot be negative")


def process_telemetry_batch(db: Session, batch: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates, deduplicates, and ingests a batch of telemetry readings.
    Updates the station's operational risk indicator automatically.
    """
    stats = {
        "total_received": len(batch),
        "accepted": 0,
        "rejected": 0,
        "duplicated": 0,
        "invalid_station": 0
    }

    # Pre-fetch valid station IDs to prevent N+1 queries
    valid_stations = {s[0] for s in db.query(Station.station_id).all() if s[0]}
    # Also include Station.id in valid stations if distinct
    valid_stations.update({str(s[0]) for s in db.query(Station.id).all() if s[0]})
    latest_levels: Dict[str, float] = {}

    for raw_record in batch:
        try:
            # 1. Pydantic Validation
            validated = RawTelemetryPayload(**raw_record)
        except ValidationError as e:
            logger.warning(f"Rejected malformed record: {e}")
            stats["rejected"] += 1
            continue

        # 2. Station Existence Check
        if validated.station_id not in valid_stations:
            stats["invalid_station"] += 1
            stats["rejected"] += 1
            continue

        # 3. Create Record
        reading_id = f"{validated.station_id}_{validated.timestamp.isoformat()}"
        
        # 4. Duplicate Check
        exists = db.query(TelemetryReading.id).filter(TelemetryReading.id == reading_id).first()
        if exists:
            stats["duplicated"] += 1
            continue

        new_reading = TelemetryReading(
            id=reading_id,
            station_id=validated.station_id,
            timestamp=validated.timestamp,
            water_level_m_bgl=validated.water_level_m_bgl,
            is_anomaly=False,  # Could plug in Z-score anomaly detection here
            quality_status="VALID"
        )
        
        db.add(new_reading)
        stats["accepted"] += 1
        latest_levels[validated.station_id] = validated.water_level_m_bgl

    # Commit readings
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.error("Database integrity error during batch insert.")
        raise

    # 5. Update Station Telemetry Risk (Phase 6 Separation)
    for stat_id, level in latest_levels.items():
        station = db.query(Station).filter((Station.station_id == stat_id) | (Station.id == stat_id)).first()
        if station:
            new_risk = evaluate_telemetry_risk(level)
            station.telemetry_risk_indicator = new_risk
            station.current_depth_m = level
    
    db.commit()
    return stats
