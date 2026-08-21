"""
District-level aggregate endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.station import Station
from app.schemas.station import DistrictSummary, StationSummary
from app.core.constants import RiskCategory

router = APIRouter()


@router.get("/districts", response_model=List[DistrictSummary])
async def list_districts(db: AsyncSession = Depends(get_db)):
    """Get aggregate risk summary per district."""
    query = (
        select(
            Station.district,
            Station.state,
            func.count(Station.id).label("total"),
            func.count().filter(Station.current_risk_category == RiskCategory.SAFE).label("safe"),
            func.count().filter(Station.current_risk_category == RiskCategory.SEMI_CRITICAL).label("semi_critical"),
            func.count().filter(Station.current_risk_category == RiskCategory.CRITICAL).label("critical"),
            func.count().filter(Station.current_risk_category == RiskCategory.OVER_EXPLOITED).label("over_exploited"),
        )
        .group_by(Station.district, Station.state)
        .order_by(Station.state, Station.district)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        DistrictSummary(
            district=row.district,
            state=row.state,
            total_stations=row.total,
            safe_count=row.safe or 0,
            semi_critical_count=row.semi_critical or 0,
            critical_count=row.critical or 0,
            over_exploited_count=row.over_exploited or 0,
            unclassified_count=row.total - (row.safe or 0) - (row.semi_critical or 0) - (row.critical or 0) - (row.over_exploited or 0),
        )
        for row in rows
    ]


@router.get("/districts/{district_name}/stations", response_model=List[StationSummary])
async def get_district_stations(
    district_name: str,
    db: AsyncSession = Depends(get_db),
):
    """List all stations within a specific district."""
    query = (
        select(Station)
        .where(Station.district.ilike(f"%{district_name}%"))
        .order_by(Station.name)
    )
    result = await db.execute(query)
    return result.scalars().all()
