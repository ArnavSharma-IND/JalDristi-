"""
Station endpoints & routes using Telemetry & Station analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.models.database import get_sync_db as get_db
from app.models.station import Station, TelemetryReading, RiskLevel
from app.schemas.telemetry import StationDetailResponse
from app.services.analytics import evaluate_telemetry_risk, compute_linear_forecast
from app.services.advisory import generate_advisory

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("", response_model=List[dict])
def list_stations(
    district: Optional[str] = None,
    risk: Optional[RiskLevel] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Station).filter(Station.is_active == True)
    if district:
        query = query.filter(Station.district.ilike(f"%{district}%"))
    if risk:
        query = query.filter(Station.telemetry_risk_indicator == risk)

    stations = query.all()
    results = []
    for s in stations:
        latest_reading = db.query(TelemetryReading)\
            .filter(TelemetryReading.station_id == s.id)\
            .order_by(TelemetryReading.timestamp.desc())\
            .first()

        results.append({
            "station_id": s.station_id,
            "name": s.name,
            "district": s.district,
            "state": s.state,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "official_cgwb_status": s.official_cgwb_status.value if hasattr(s.official_cgwb_status, "value") else (s.official_cgwb_status or "INSUFFICIENT_DATA"),
            "telemetry_risk": s.telemetry_risk_indicator.value if hasattr(s.telemetry_risk_indicator, "value") else (s.telemetry_risk_indicator or "INSUFFICIENT_DATA"),
            "latest_water_level_m_bgl": latest_reading.water_level_m_bgl if latest_reading else None,
            "last_updated": latest_reading.timestamp if latest_reading else None
        })
    return results


@router.get("/{station_id}", response_model=dict)
def get_station_detail(station_id: str, db: Session = Depends(get_db)):
    # Support lookup by either station_code or uuid string
    station = db.query(Station).filter((Station.station_code == station_id) | (Station.id == station_id)).first()
    if not station:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "STATION_NOT_FOUND", "message": f"Station {station_id} does not exist."}}
        )

    readings = db.query(TelemetryReading)\
        .filter(TelemetryReading.station_id == station.id)\
        .order_by(TelemetryReading.timestamp.asc())\
        .all()

    raw_data = [{"timestamp": r.timestamp, "water_level_m_bgl": r.water_level_m_bgl} for r in readings]
    forecast = compute_linear_forecast(raw_data, horizon_days=30)
    latest_reading = raw_data[-1] if raw_data else None

    return {
        "station_id": station.station_id,
        "name": station.name,
        "district": station.district,
        "state": station.state,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "official_cgwb_status": station.official_cgwb_status.value if hasattr(station.official_cgwb_status, "value") else (station.official_cgwb_status or "INSUFFICIENT_DATA"),
        "telemetry_risk": station.telemetry_risk_indicator.value if hasattr(station.telemetry_risk_indicator, "value") else (station.telemetry_risk_indicator or "INSUFFICIENT_DATA"),
        "latest_water_level_m_bgl": latest_reading["water_level_m_bgl"] if latest_reading else None,
        "last_updated": latest_reading["timestamp"] if latest_reading else None,
        "observation_count": len(raw_data),
        "forecast": forecast
    }


@router.get("/{station_id}/advisory")
async def get_station_advisory(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter((Station.station_code == station_id) | (Station.id == station_id)).first()
    if not station:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "STATION_NOT_FOUND", "message": f"Station {station_id} does not exist."}}
        )

    readings = db.query(TelemetryReading)\
        .filter(TelemetryReading.station_id == station.id)\
        .order_by(TelemetryReading.timestamp.asc())\
        .all()

    raw_data = [{"timestamp": r.timestamp, "water_level_m_bgl": r.water_level_m_bgl} for r in readings]
    forecast = compute_linear_forecast(raw_data, horizon_days=30)
    latest = raw_data[-1] if raw_data else {}

    context = {
        "station_id": station.station_id,
        "district": station.district,
        "state": station.state,
        "latest_water_level": latest.get("water_level_m_bgl"),
        "telemetry_risk": station.telemetry_risk_indicator.value if hasattr(station.telemetry_risk_indicator, "value") else str(station.telemetry_risk_indicator or "INSUFFICIENT_DATA"),
        "official_cgwb_status": station.official_cgwb_status.value if hasattr(station.official_cgwb_status, "value") else str(station.official_cgwb_status or "INSUFFICIENT_DATA"),
        "trend_direction": forecast.get("trend_direction"),
        "slope_m_per_day": forecast.get("slope_m_per_day"),
        "projected_water_level": forecast.get("projected_water_level"),
        "confidence": forecast.get("confidence")
    }

    return await generate_advisory(context)
