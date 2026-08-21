"""
Station endpoints — list, detail, and forecast.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.schemas.station import (
    StationSummary,
    StationDetail,
    StationWithReadings,
    StationForecast,
)
from app.services.forecasting.trend import compute_forecast
from app.core.constants import RiskCategory

router = APIRouter()


@router.get("/stations", response_model=List[StationSummary])
async def list_stations(
    district: Optional[str] = Query(None, description="Filter by district name"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    risk: Optional[RiskCategory] = Query(None, description="Filter by risk category"),
    db: AsyncSession = Depends(get_db),
):
    """List all monitoring stations with optional filters."""
    query = select(Station)

    if district:
        query = query.where(Station.district.ilike(f"%{district}%"))
    if state:
        query = query.where(Station.state.ilike(f"%{state}%"))
    if risk:
        query = query.where(Station.current_risk_category == risk)

    result = await db.execute(query.order_by(Station.district, Station.name))
    stations = result.scalars().all()
    return stations


@router.get("/stations/{station_id}", response_model=StationWithReadings)
async def get_station(
    station_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get full station detail including water-level reading history."""
    query = (
        select(Station)
        .options(selectinload(Station.readings))
        .where(Station.id == station_id)
    )
    result = await db.execute(query)
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    # Sort readings by timestamp
    station.readings.sort(key=lambda r: r.timestamp)
    return station


@router.get("/stations/{station_id}/forecast", response_model=StationForecast)
async def get_station_forecast(
    station_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get trend forecast and projected risk transition for a station."""
    query = (
        select(Station)
        .options(selectinload(Station.readings))
        .where(Station.id == station_id)
    )
    result = await db.execute(query)
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    station.readings.sort(key=lambda r: r.timestamp)
    forecast = compute_forecast(station)
    return forecast
