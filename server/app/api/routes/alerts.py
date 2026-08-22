"""
Alerts route — delivers live critical threshold crossing notifications and notification audits.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.alert import Alert
from app.models.station import Station
from app.schemas.station import AlertResponse

router = APIRouter()


@router.get("/alerts", response_model=List[AlertResponse])
async def list_alerts(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch active and recent groundwater depletion alerts.
    """
    query = (
        select(Alert)
        .options(selectinload(Alert.station))
        .order_by(desc(Alert.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    alerts = result.scalars().all()

    output = []
    for alert in alerts:
        st = alert.station
        output.append(
            AlertResponse(
                id=alert.id,
                station_id=alert.station_id,
                station_code=st.station_code if st else "UNKNOWN",
                station_name=st.name if st else "Unknown Station",
                district=st.district if st else "Unknown",
                state=st.state if st else "Unknown",
                previous_risk_category=alert.previous_risk_category,
                current_risk_category=alert.current_risk_category,
                current_depth_m=alert.depth_at_trigger_m,
                alert_type=alert.alert_type,
                message=alert.message,
                notified_roles=[r.strip() for r in (alert.notified_roles or "").split(",")],
                created_at=alert.created_at,
            )
        )
    return output


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Mark an alert as acknowledged by district authority.
    """
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    await db.commit()
    return {"status": "acknowledged", "alert_id": alert_id}
