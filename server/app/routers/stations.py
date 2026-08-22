"""
Station endpoints & routes using Telemetry & Station analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import random
import io
import csv

from sqlalchemy import func
from app.models.database import get_sync_db as get_db
from app.models.station import Station, TelemetryReading, RiskLevel
from app.schemas.telemetry import StationDetailResponse
from app.services.analytics import evaluate_telemetry_risk, compute_linear_forecast, check_predictive_risk
from app.services.advisory import generate_advisory
from app.services.sensor_health import evaluate_sensor_health
from app.services.ingestion import process_telemetry_batch

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("", response_model=List[dict])
def list_stations(
    district: Optional[str] = None,
    risk: Optional[RiskLevel] = None,
    db: Session = Depends(get_db)
):
    """
    Highly optimized query using SQL subqueries to eliminate the N+1 problem.
    Fetches stations and their latest telemetry reading in a single database roundtrip.
    """
    # 1. Subquery to find the most recent telemetry timestamp per station
    subquery = db.query(
        TelemetryReading.station_id,
        func.max(TelemetryReading.timestamp).label("max_time")
    ).group_by(TelemetryReading.station_id).subquery()

    # 2. Join Station with TelemetryReading filtered by latest timestamp
    query = db.query(Station, TelemetryReading).outerjoin(
        subquery, (Station.station_id == subquery.c.station_id) | (Station.id == subquery.c.station_id)
    ).outerjoin(
        TelemetryReading,
        ((TelemetryReading.station_id == subquery.c.station_id) | (TelemetryReading.station_id == Station.id)) &
        (TelemetryReading.timestamp == subquery.c.max_time)
    ).filter(Station.is_active == True)

    # 3. Apply Filters
    if district:
        query = query.filter(Station.district.ilike(f"%{district}%"))
    if risk:
        query = query.filter(Station.telemetry_risk_indicator == risk)

    # 4. Execute single query and deduplicate
    results = []
    seen = set()
    for station, latest_reading in query.all():
        if station.id in seen:
            continue
        seen.add(station.id)
        results.append({
            "station_id": station.station_id,
            "name": station.name,
            "district": station.district,
            "state": station.state,
            "latitude": station.latitude,
            "longitude": station.longitude,
            "official_cgwb_status": station.official_cgwb_status.value if hasattr(station.official_cgwb_status, "value") else (station.official_cgwb_status or "INSUFFICIENT_DATA"),
            "telemetry_risk": station.telemetry_risk_indicator.value if hasattr(station.telemetry_risk_indicator, "value") else (station.telemetry_risk_indicator or "INSUFFICIENT_DATA"),
            "latest_water_level_m_bgl": latest_reading.water_level_m_bgl if latest_reading else None,
            "last_updated": latest_reading.timestamp if latest_reading else None
        })
    return results


@router.get("/export/csv")
def export_stations_csv(db: Session = Depends(get_db)):
    """Exports all monitored DWLR stations with their telemetry risk and forecast to CSV format."""
    stations = db.query(Station).filter(Station.is_active == True).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Station ID", "Name", "District", "State", "Latitude", "Longitude",
        "Official CGWB Status", "Current Telemetry Risk", "Latest Depth (m bgl)",
        "Last Telemetry Ping", "Trend Direction", "30d Projected Depth (m bgl)", "Forecast Confidence"
    ])

    for s in stations:
        latest = db.query(TelemetryReading).filter(TelemetryReading.station_id == s.id).order_by(TelemetryReading.timestamp.desc()).first()
        readings = db.query(TelemetryReading).filter(TelemetryReading.station_id == s.id).order_by(TelemetryReading.timestamp.asc()).all()
        raw_data = [{"timestamp": r.timestamp, "water_level_m_bgl": r.water_level_m_bgl if r.water_level_m_bgl is not None else r.depth_below_ground_m} for r in readings]
        forecast = compute_linear_forecast(raw_data, horizon_days=30)

        writer.writerow([
            s.station_id,
            s.name,
            s.district,
            s.state,
            s.latitude,
            s.longitude,
            s.official_cgwb_status.value if hasattr(s.official_cgwb_status, "value") else str(s.official_cgwb_status or "N/A"),
            s.telemetry_risk_indicator.value if hasattr(s.telemetry_risk_indicator, "value") else str(s.telemetry_risk_indicator or "N/A"),
            latest.water_level_m_bgl if latest else "N/A",
            latest.timestamp.isoformat() if latest and latest.timestamp else "N/A",
            forecast.get("trend_direction", "N/A"),
            forecast.get("projected_water_level", "N/A"),
            forecast.get("confidence", "N/A")
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=jaldrishti_groundwater_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.post("/simulate-ping")
def simulate_telemetry_ping(station_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Simulates a live DWLR sensor ping, dynamically recalculating risk and forecasts."""
    query = db.query(Station).filter(Station.is_active == True)
    if station_id:
        station = query.filter((Station.station_code == station_id) | (Station.id == station_id) | (Station.station_id == station_id)).first()
    else:
        stations = query.all()
        station = random.choice(stations) if stations else None

    if not station:
        raise HTTPException(status_code=404, detail="No active station found to simulate ping.")

    # Fetch latest depth
    latest = db.query(TelemetryReading).filter(TelemetryReading.station_id == station.id).order_by(TelemetryReading.timestamp.desc()).first()
    current_depth = latest.water_level_m_bgl if latest and latest.water_level_m_bgl is not None else 10.0

    # Add plausible fluctuation (+- 0.05m to 0.20m with occasional seasonal drawdown)
    delta = random.uniform(-0.15, 0.25)
    new_depth = round(max(0.5, current_depth + delta), 2)
    timestamp = datetime.now(timezone.utc)

    payload = [{
        "station_id": station.station_id or station.id,
        "timestamp": timestamp.isoformat(),
        "water_level_m_bgl": new_depth
    }]

    stats = process_telemetry_batch(db, payload)

    return {
        "status": "SUCCESS",
        "station_id": station.station_id,
        "name": station.name,
        "district": station.district,
        "previous_depth_m_bgl": current_depth,
        "new_depth_m_bgl": new_depth,
        "delta_m": round(new_depth - current_depth, 2),
        "new_telemetry_risk": station.telemetry_risk_indicator.value if hasattr(station.telemetry_risk_indicator, "value") else str(station.telemetry_risk_indicator),
        "timestamp": timestamp.isoformat(),
        "ingestion_stats": stats
    }


@router.get("/analytics/aquifer-summary")
def get_aquifer_summary(db: Session = Depends(get_db)):
    """Computes high-level aquifer health and critical resource stress index."""
    stations = db.query(Station).filter(Station.is_active == True).all()
    total = len(stations)
    if total == 0:
        return {"total_stations": 0, "avg_depth_m": 0, "stress_index": 0}

    depths = []
    critical_count = 0
    over_exploited_count = 0
    safe_count = 0

    for s in stations:
        latest = db.query(TelemetryReading).filter(TelemetryReading.station_id == s.id).order_by(TelemetryReading.timestamp.desc()).first()
        if latest and latest.water_level_m_bgl is not None:
            depths.append(latest.water_level_m_bgl)
        risk = s.telemetry_risk_indicator.value if hasattr(s.telemetry_risk_indicator, "value") else str(s.telemetry_risk_indicator)
        if risk == "CRITICAL":
            critical_count += 1
        elif risk == "OVER_EXPLOITED":
            over_exploited_count += 1
        elif risk == "SAFE":
            safe_count += 1

    avg_depth = sum(depths) / len(depths) if depths else 0.0
    stress_index = round(((critical_count + (over_exploited_count * 1.5)) / (total * 1.5)) * 100, 1) if total > 0 else 0.0

    return {
        "total_active_dwlr": total,
        "monitored_readings_count": db.query(TelemetryReading).count(),
        "average_aquifer_depth_m_bgl": round(avg_depth, 2),
        "critical_count": critical_count,
        "over_exploited_count": over_exploited_count,
        "safe_count": safe_count,
        "resource_stress_index": stress_index,
        "aquifer_health_rating": "HEALTHY" if stress_index < 30 else ("VULNERABLE" if stress_index < 60 else "STRESSED")
    }


@router.get("/{station_id}", response_model=dict)
def get_station_detail(station_id: str, db: Session = Depends(get_db)):
    # Support lookup by either station_code or uuid string
    station = db.query(Station).filter((Station.station_code == station_id) | (Station.id == station_id) | (Station.station_id == station_id)).first()
    if not station:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "STATION_NOT_FOUND", "message": f"Station {station_id} does not exist."}}
        )

    readings = db.query(TelemetryReading)\
        .filter(TelemetryReading.station_id == station.id)\
        .order_by(TelemetryReading.timestamp.asc())\
        .all()

    raw_data = [
        {
            "timestamp": r.timestamp,
            "water_level_m_bgl": r.water_level_m_bgl if r.water_level_m_bgl is not None else r.depth_below_ground_m
        }
        for r in readings
    ]
    forecast = compute_linear_forecast(raw_data, horizon_days=30)
    health = evaluate_sensor_health(station.station_id, raw_data)
    pred_warning = check_predictive_risk(forecast, station.telemetry_risk_indicator)
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
        "history": [
            {
                "timestamp": (r["timestamp"].isoformat() if hasattr(r["timestamp"], "isoformat") else str(r["timestamp"])),
                "water_level_m_bgl": r["water_level_m_bgl"]
            }
            for r in raw_data
        ],
        "sensor_health": health,
        "forecast": forecast,
        "predictive_warning": pred_warning
    }


@router.get("/{station_id}/advisory")
async def get_station_advisory(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter((Station.station_code == station_id) | (Station.id == station_id) | (Station.station_id == station_id)).first()
    if not station:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "STATION_NOT_FOUND", "message": f"Station {station_id} does not exist."}}
        )

    readings = db.query(TelemetryReading)\
        .filter(TelemetryReading.station_id == station.id)\
        .order_by(TelemetryReading.timestamp.asc())\
        .all()

    raw_data = [{"timestamp": r.timestamp, "water_level_m_bgl": r.water_level_m_bgl if r.water_level_m_bgl is not None else r.depth_below_ground_m} for r in readings]
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
