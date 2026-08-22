import io
import csv
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.models.database import get_sync_db as get_db
from app.models.station import Station, TelemetryReading
from datetime import datetime, timezone

router = APIRouter(prefix="/export", tags=["Data Export"])


@router.get("/stations.csv")
def export_stations_csv(db: Session = Depends(get_db)):
    """Generates a real-time CSV report of all stations and their current risk status."""
    stations = db.query(Station).filter(Station.is_active == True).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write CSV Header
    writer.writerow([
        "Station_ID", "Name", "District", "State", 
        "Latitude", "Longitude", "CGWB_Status", "Telemetry_Risk", "Last_Exported"
    ])
    
    current_time = datetime.now(timezone.utc).isoformat()
    
    for s in stations:
        cgwb_status = s.official_cgwb_status.value if hasattr(s.official_cgwb_status, "value") else str(s.official_cgwb_status or "N/A")
        telemetry_risk = s.telemetry_risk_indicator.value if hasattr(s.telemetry_risk_indicator, "value") else str(s.telemetry_risk_indicator or "N/A")
        
        writer.writerow([
            s.station_id, s.name, s.district, s.state,
            s.latitude, s.longitude, 
            cgwb_status, 
            telemetry_risk,
            current_time
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=jaldrishti_stations_report.csv"}
    )
