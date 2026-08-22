"""
Station endpoints - list, detail, and forecast.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
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
    PaginatedStations,
)
from app.services.forecasting.trend import compute_forecast
from app.core.constants import RiskCategory

router = APIRouter()


@router.get("/stations", response_model=PaginatedStations)
async def list_stations(
    district: Optional[str] = Query(None, description="Filter by district name"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    risk: Optional[RiskCategory] = Query(None, description="Filter by risk category"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(100, ge=1, le=500, description="Results per page"),
    db: AsyncSession = Depends(get_db),
):
    """List all monitoring stations with optional filters and pagination."""
    query = select(Station)

    if district:
        query = query.where(Station.district.ilike(f"%{district}%"))
    if state:
        query = query.where(Station.state.ilike(f"%{state}%"))
    if risk:
        query = query.where(Station.current_risk_category == risk)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    offset = (page - 1) * page_size
    paginated_query = query.order_by(Station.district, Station.name).offset(offset).limit(page_size)

    result = await db.execute(paginated_query)
    stations = result.scalars().all()

    return PaginatedStations(
        items=stations,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


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
