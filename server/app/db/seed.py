"""
Optimized high-speed database seeder for DWLR datasets.
Loads 400k+ records in seconds using direct batch insertion.

Usage:
    python -m app.db.seed
"""

import asyncio
import csv
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory, engine
from app.models.base import Base
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.services.classification.classifier import classify_by_depth

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"


async def fast_seed():
    start_time = time.time()
    print("=== JalDrishti High-Speed Database Seeder ===")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database schema initialized.")

    stations_file = DATA_DIR / "stations.csv"
    readings_file = DATA_DIR / "readings.csv"

    if not stations_file.exists() or not readings_file.exists():
        print("[ERROR] Processed CSV files missing in data/processed/!")
        return

    # 1. Load Stations
    print(f"Reading stations from {stations_file} ...")
    stations_data = []
    with open(stations_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Handle aquifer_type: treat empty strings as None
            aquifer = row.get("aquifer_type")
            if aquifer in (None, "", "None"):
                aquifer = None
            
            stations_data.append({
                "id": UUID(row["id"]) if "id" in row and row["id"] else uuid4(),
                "station_code": row["station_code"],
                "name": row["name"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "district": row["district"],
                "state": row["state"],
                "block": row.get("block", ""),
                "aquifer_type": aquifer,
                "well_depth_m": float(row["well_depth_m"]) if row.get("well_depth_m") else None,
                "stage_of_development": None,  # Not available in Kaggle dataset
                "classification_method": None,
                "current_risk_category": None,
                "current_depth_m": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

    async with async_session_factory() as session:
        # Bulk insert stations
        await session.execute(insert(Station), stations_data)
        await session.commit()
        print(f"[OK] {len(stations_data):,} stations inserted.")

    # 2. Fast Bulk Load Readings
    print(f"Reading time-series from {readings_file} ...")
    readings_data = []
    station_latest_reading = {} # station_id -> (timestamp, depth)

    with open(readings_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            st_id = UUID(row["station_id"])
            ts = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
            depth = float(row["depth_below_ground_m"])
            
            readings_data.append({
                "id": uuid4(),
                "station_id": st_id,
                "timestamp": ts,
                "depth_below_ground_m": depth,
                "quality_flag": row.get("quality_flag", "valid"),
            })

            # Track latest reading per station for instant classification
            if st_id not in station_latest_reading or ts > station_latest_reading[st_id][0]:
                station_latest_reading[st_id] = (ts, depth)

    print(f"Loaded {len(readings_data):,} records into memory. Streaming into database in 50k chunks...")

    async with async_session_factory() as session:
        chunk_size = 50000
        for i in range(0, len(readings_data), chunk_size):
            chunk = readings_data[i:i + chunk_size]
            await session.execute(insert(WaterLevelReading), chunk)
            await session.commit()
            print(f"  Inserted {min(i + chunk_size, len(readings_data)):,}/{len(readings_data):,} readings")

    print("[OK] All readings inserted.")

    # 3. Update Station Classifications in Bulk
    print("Computing station classifications from latest telemetry observations...")
    async with async_session_factory() as session:
        result = await session.execute(select(Station))
        stations = result.scalars().all()
        
        for st in stations:
            if st.id in station_latest_reading:
                latest_depth = station_latest_reading[st.id][1]
                st.current_depth_m = round(latest_depth, 2)
                st.current_risk_category = classify_by_depth(latest_depth)
                st.classification_method = "depth_proxy"

        await session.commit()
        print(f"[OK] {len(stations):,} stations classified according to CGWB norms.")

    await engine.dispose()
    elapsed = time.time() - start_time
    print(f"=== Complete in {elapsed:.1f}s! ===")


if __name__ == "__main__":
    asyncio.run(fast_seed())
