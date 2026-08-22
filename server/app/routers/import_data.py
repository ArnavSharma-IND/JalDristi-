import csv
import io
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.database import get_sync_db as get_db
from app.services.ingestion import process_telemetry_batch

router = APIRouter(prefix="/import", tags=["Data Import"])


@router.post("/telemetry")
async def upload_historical_telemetry(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Accepts a CSV file of historical telemetry and processes it through the validation pipeline."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
    
    content = await file.read()
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')
        
    reader = csv.DictReader(io.StringIO(decoded))
    
    batch = []
    for row in reader:
        try:
            station_id = row.get("station_id") or row.get("Station_ID") or row.get("station_code")
            raw_ts = row.get("timestamp") or row.get("Timestamp") or row.get("date")
            raw_level = row.get("water_level_m_bgl") or row.get("water_level") or row.get("depth_m")
            
            if not station_id or not raw_ts or raw_level is None:
                continue

            parsed_ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            batch.append({
                "station_id": station_id.strip(),
                "timestamp": parsed_ts,
                "water_level_m_bgl": float(raw_level)
            })
        except (KeyError, ValueError, TypeError):
            continue  # Skip malformed rows gracefully
            
    if not batch:
        raise HTTPException(status_code=400, detail="No valid telemetry rows found in CSV.")
        
    stats = process_telemetry_batch(db, batch)
    return {"message": "Upload complete", "statistics": stats}
