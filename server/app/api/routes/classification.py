"""
Dual Classification route — provides side-by-side comparison of CGWB Stage vs Sensor Depth Proxy.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.station import Station
from app.schemas.station import DualClassification
from app.services.classification.classifier import classify_by_depth, classify_by_stage

router = APIRouter()


@router.get("/stations/{station_id}/dual-classification", response_model=DualClassification)
async def get_dual_classification(
    station_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Compare official CGWB Stage of Development metric vs real-time Depth Proxy side-by-side.
    """
    station = await db.get(Station, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    depth_val = station.current_depth_m or 0.0
    depth_cat = classify_by_depth(depth_val)
    depth_basis = f"Observed telemetry depth: {depth_val:.1f}m below ground level"

    stage_cat = None
    stage_basis = None
    cgwb_cite = None

    if station.stage_of_development is not None:
        stage_cat = classify_by_stage(station.stage_of_development)
        stage_basis = f"Annual Extraction vs Net Recharge Ratio: {station.stage_of_development:.1f}%"
        cgwb_cite = "CGWB Dynamic Ground Water Resources of India, 2023 (Annexure-III Block Assessment)"

    return DualClassification(
        station_id=station.id,
        station_code=station.station_code,
        station_name=station.name,
        district=station.district,
        state=station.state,
        block=station.block,
        current_depth_m=station.current_depth_m,
        depth_proxy_category=depth_cat,
        depth_proxy_basis=depth_basis,
        stage_of_development=station.stage_of_development,
        stage_category=stage_cat,
        stage_basis=stage_basis,
        active_method=station.classification_method or "depth_proxy",
        cgwb_citation=cgwb_cite,
    )
