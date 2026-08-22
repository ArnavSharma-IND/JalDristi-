"""
Database seeder — loads processed DWLR data into PostgreSQL.

Usage:
    python -m app.db.seed
"""

import asyncio
import csv
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory, engine
from app.models.base import Base
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.services.classification.classifier import classify_by_depth
from app.services.forecasting.trend import compute_forecast

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"


async def seed_stations(session: AsyncSession):
    """Seed stations from processed CSV."""
    stations_file = DATA_DIR / "stations.csv"
    if not stations_file.exists():
        print(f"[WARN] {stations_file} not found — skipping station seed.")
        return

    print(f"Reading stations from {stations_file} ...")
    stations_to_add = []
    with open(stations_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            station_id = UUID(row["id"]) if "id" in row and row["id"] else uuid4()
            station = Station(
                id=station_id,
                station_code=row["station_code"],
                name=row["name"],
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                district=row["district"],
                state=row["state"],
                block=row.get("block", ""),
                aquifer_type=row.get("aquifer_type"),
                well_depth_m=float(row["well_depth_m"]) if row.get("well_depth_m") else None,
            )
            stations_to_add.append(station)

    # Batch insert
    batch_size = 1000
    for i in range(0, len(stations_to_add), batch_size):
        batch = stations_to_add[i:i + batch_size]
        session.add_all(batch)
        await session.commit()
        print(f"  Inserted {min(i + batch_size, len(stations_to_add))}/{len(stations_to_add)} stations")

    print(f"[OK] {len(stations_to_add)} Stations seeded.")


async def seed_readings(session: AsyncSession, limit: int = None):
    """Seed water-level readings from processed CSV."""
    readings_file = DATA_DIR / "readings.csv"
    if not readings_file.exists():
        print(f"[WARN] {readings_file} not found — skipping readings seed.")
        return

    print(f"Reading water level data from {readings_file} ...")
    with open(readings_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        batch = []
        count = 0
        for row in reader:
            reading = WaterLevelReading(
                id=uuid4(),
                station_id=UUID(row["station_id"]),
                timestamp=datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")),
                depth_below_ground_m=float(row["depth_below_ground_m"]),
                quality_flag=row.get("quality_flag", "valid"),
            )
            batch.append(reading)
            count += 1

            if len(batch) >= 5000:
                session.add_all(batch)
                await session.commit()
                print(f"  Inserted {count:,} readings...")
                batch = []

            if limit and count >= limit:
                break

        if batch:
            session.add_all(batch)
            await session.commit()

    print(f"[OK] Total {count:,} readings seeded.")


async def reclassify_all_stations(session: AsyncSession):
    """Compute latest water depth and CGWB classification for all stations."""
    print("Computing current risk classification and forecasts for all stations...")
    result = await session.execute(select(Station))
    stations = result.scalars().all()
    
    # Update stations with readings
    for i, station in enumerate(stations):
        # Find latest reading
        r_result = await session.execute(
            select(WaterLevelReading)
            .where(WaterLevelReading.station_id == station.id)
            .order_by(WaterLevelReading.timestamp.desc())
            .limit(1)
        )
        latest_reading = r_result.scalar_one_or_none()
        if latest_reading:
            station.current_depth_m = round(latest_reading.depth_below_ground_m, 2)
            station.current_risk_category = classify_by_depth(station.current_depth_m)
            
        if (i + 1) % 500 == 0 or (i + 1) == len(stations):
            await session.commit()
            print(f"  Classified {i + 1}/{len(stations)} stations")

    await session.commit()
    print("[OK] Station classifications updated.")


async def main():
    print("=== JalDrishti Database Seeder ===")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Database schema verified.")

    async with async_session_factory() as session:
        await seed_stations(session)
        await seed_readings(session)
        await reclassify_all_stations(session)

    await engine.dispose()
    print("=== Seeding complete! ===")


if __name__ == "__main__":
    asyncio.run(main())
