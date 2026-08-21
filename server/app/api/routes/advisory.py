"""
Advisory endpoint — Tier 2 LLM-generated explanations & recommendations.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.station import Station
from app.schemas.station import AdvisoryResponse
from app.services.advisory.gemini_advisor import generate_advisory

router = APIRouter()


@router.get("/stations/{station_id}/advisory", response_model=AdvisoryResponse)
async def get_station_advisory(
    station_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an LLM-powered advisory for a station.

    Uses the station's classification, forecast, and recent readings to produce
    a plain-language explanation and actionable recommendation.
    """
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
    advisory = await generate_advisory(station)
    return advisory
