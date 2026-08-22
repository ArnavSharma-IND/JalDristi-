"""
Data Provenance route — exposes verified dataset metadata, citation, and coverage statistics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.schemas.station import DataProvenance

router = APIRouter()


@router.get("/provenance", response_model=DataProvenance)
async def get_data_provenance(db: AsyncSession = Depends(get_db)):
    """
    Return data provenance, dataset sources, temporal span, and coverage.
    """
    # Station stats
    st_count = await db.scalar(select(func.count(Station.id))) or 0
    resolved_districts = await db.scalar(
        select(func.count(distinct(Station.district))).where(Station.district != "Unresolved")
    ) or 0
    unresolved_stations = await db.scalar(
        select(func.count(Station.id)).where(Station.district == "Unresolved")
    ) or 0

    # Reading stats
    rd_count = await db.scalar(select(func.count(WaterLevelReading.id))) or 0
    min_ts = await db.scalar(select(func.min(WaterLevelReading.timestamp)))
    max_ts = await db.scalar(select(func.max(WaterLevelReading.timestamp)))

    start_str = min_ts.strftime("%d %b %Y") if min_ts else "1994-01-05"
    end_str = max_ts.strftime("%d %b %Y") if max_ts else "2025-09-27"

    return DataProvenance(
        dataset_name="Groundwater India DWLR Time-Series Telemetry",
        source_organization="Central Ground Water Board (CGWB) / Ministry of Jal Shakti",
        source_portal="India-WRIS / National Water Informatics Centre (NWIC) & Open Data Portal",
        source_url="https://indiawris.gov.in",
        ingestion_date="22 Aug 2026",
        total_stations=st_count,
        total_readings=rd_count,
        date_range_start=start_str,
        date_range_end=end_str,
        resolved_districts_count=resolved_districts,
        unresolved_stations_count=unresolved_stations,
        primary_classification_metric="Dynamic GW Resource Assessment (Stage of Development + Depth Proxy)",
        cgwb_reference="CGWB 'Dynamic Ground Water Resources of India, 2023'",
    )
