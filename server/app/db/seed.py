"""
High-speed database seeder for DWLR datasets & CGWB Stage of Development benchmark data.

Loads:
  1. 6,424 DWLR stations & 415,829 readings
  2. Block-level CGWB Stage of Development data for focus districts (Mehsana, Jaipur, Nagpur)
  3. Pre-populated risk transition alerts for critical telemetry observations

Usage:
    python -m app.db.seed
"""

import asyncio
import csv
import json
import random
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory, engine
from app.models.base import Base
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.models.alert import Alert
from app.services.classification.classifier import classify_by_depth, classify_by_stage

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data" / "processed"
CGWB_DIR = BASE_DIR / "data" / "raw" / "cgwb"


async def fast_seed():
    start_time = time.time()
    print("=== JalDrishti High-Speed Database Seeder ===")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database schema initialized.")

    stations_file = DATA_DIR / "stations.csv"
    readings_file = DATA_DIR / "readings.csv"
    cgwb_stage_file = CGWB_DIR / "stage_of_development.json"

    if not stations_file.exists() or not readings_file.exists():
        print("[ERROR] Processed CSV files missing in data/processed/!")
        return

    # 1. Load CGWB Block Stage Benchmark Data
    cgwb_blocks = []
    if cgwb_stage_file.exists():
        with open(cgwb_stage_file, "r", encoding="utf-8-sig") as f:
            cgwb_blocks = json.load(f)
        print(f"[OK] Loaded {len(cgwb_blocks)} curated CGWB block stage benchmarks for focus districts.")

    # Build district -> list of blocks mapping
    district_block_map = {}
    for block_info in cgwb_blocks:
        dist = block_info["district"]
        if dist not in district_block_map:
            district_block_map[dist] = []
        district_block_map[dist].append(block_info)

    # 2. Load Stations
    print(f"Reading stations from {stations_file} ...")
    stations_data = []
    with open(stations_file, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            aquifer = row.get("aquifer_type")
            if aquifer in (None, "", "None"):
                aquifer = None
            
            district = row["district"]
            block_assigned = row.get("block", "")
            stage_dev = None
            class_method = "depth_proxy"

            # Assign block & official Stage of Development for focus districts
            if district in district_block_map and district_block_map[district]:
                blocks_for_dist = district_block_map[district]
                # Distribute stations across available blocks deterministically
                block_info = blocks_for_dist[i % len(blocks_for_dist)]
                block_assigned = block_info["block"]
                stage_dev = block_info["stage_of_development_pct"]
                class_method = "stage"
            
            stations_data.append({
                "id": UUID(row["id"]) if "id" in row and row["id"] else uuid4(),
                "station_code": row["station_code"],
                "name": row["name"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "district": district,
                "state": row["state"],
                "block": block_assigned,
                "aquifer_type": aquifer,
                "well_depth_m": float(row["well_depth_m"]) if row.get("well_depth_m") else None,
                "stage_of_development": stage_dev,
                "classification_method": class_method,
                "current_risk_category": None,
                "current_depth_m": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

    async with async_session_factory() as session:
        await session.execute(insert(Station), stations_data)
        await session.commit()
        print(f"[OK] {len(stations_data):,} stations inserted.")

    # 3. Fast Bulk Load Readings
    print(f"Reading time-series from {readings_file} ...")
    readings_data = []
    station_latest_reading = {} # station_id -> (timestamp, depth)

    with open(readings_file, newline="", encoding="utf-8-sig") as f:
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

    # 4. Update Station Classifications & Generate Live Alerts
    print("Computing station classifications & initializing alert feed...")
    alerts_to_insert = []
    now = datetime.now(timezone.utc)

    async with async_session_factory() as session:
        result = await session.execute(select(Station))
        stations = result.scalars().all()
        
        for st in stations:
            if st.id in station_latest_reading:
                latest_depth = station_latest_reading[st.id][1]
                st.current_depth_m = round(latest_depth, 2)
                
                # If stage_of_development is available, it takes precedence (official CGWB)
                if st.stage_of_development is not None:
                    st.current_risk_category = classify_by_stage(st.stage_of_development)
                    st.classification_method = "stage"
                else:
                    st.current_risk_category = classify_by_depth(latest_depth)
                    st.classification_method = "depth_proxy"

                # Generate alert if in Critical or Over-Exploited state
                if st.current_risk_category.value in ["Critical", "Over-Exploited"]:
                    prev_cat = "Semi-Critical" if st.current_risk_category.value == "Critical" else "Critical"
                    time_offset = timedelta(hours=random.randint(1, 72))
                    alerts_to_insert.append({
                        "id": uuid4(),
                        "station_id": st.id,
                        "alert_type": "threshold_crossed",
                        "previous_risk_category": prev_cat,
                        "current_risk_category": st.current_risk_category.value,
                        "depth_at_trigger_m": round(latest_depth, 2),
                        "message": f"Station {st.station_code} ({st.district}, {st.state}) transitioned to {st.current_risk_category.value} with water table at {latest_depth:.1f}m bgl.",
                        "notified_roles": "District Collector, Block Development Officer, Gram Panchayat Water Committee",
                        "acknowledged": False,
                        "created_at": now - time_offset,
                        "updated_at": now - time_offset,
                    })

        # Save stations update
        await session.commit()
        print(f"[OK] {len(stations):,} stations classified.")

        # Insert alerts (cap initial alerts at 50 for clean dashboard presentation)
        if alerts_to_insert:
            alerts_sample = alerts_to_insert[:50]
            await session.execute(insert(Alert), alerts_sample)
            await session.commit()
            print(f"[OK] {len(alerts_sample)} critical risk transition alerts populated in feed.")

    await engine.dispose()
    elapsed = time.time() - start_time
    print(f"=== Complete in {elapsed:.1f}s! ===")


if __name__ == "__main__":
    asyncio.run(fast_seed())
