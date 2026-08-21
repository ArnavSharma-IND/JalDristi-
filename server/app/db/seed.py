"""
Database seeder — loads sample DWLR data for development and demo.

Usage:
    python -m app.db.seed
"""

import asyncio
import csv
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory, engine
from app.models.base import Base
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.core.constants import RiskCategory


DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "processed"


async def seed_stations(session: AsyncSession):
    """Seed stations from processed CSV."""
    stations_file = DATA_DIR / "stations.csv"
    if not stations_file.exists():
        print(f"[WARN] {stations_file} not found — skipping station seed.")
        print("       Run data processing scripts first: python data/scripts/process_dwlr.py")
        return

    with open(stations_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            station = Station(
                id=uuid4(),
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
            session.add(station)

    await session.commit()
    print("[OK] Stations seeded.")


async def seed_readings(session: AsyncSession):
    """Seed water-level readings from processed CSV."""
    readings_file = DATA_DIR / "readings.csv"
    if not readings_file.exists():
        print(f"[WARN] {readings_file} not found — skipping readings seed.")
        return

    with open(readings_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        batch = []
        for i, row in enumerate(reader):
            reading = WaterLevelReading(
                id=uuid4(),
                station_id=row["station_id"],
                timestamp=datetime.fromisoformat(row["timestamp"]),
                depth_below_ground_m=float(row["depth_below_ground_m"]),
                quality_flag=row.get("quality_flag", "valid"),
            )
            batch.append(reading)

            if len(batch) >= 1000:
                session.add_all(batch)
                await session.commit()
                batch = []
                print(f"  ... {i + 1} readings loaded")

        if batch:
            session.add_all(batch)
            await session.commit()

    print("[OK] Readings seeded.")


async def main():
    """Run full seed."""
    print("=== JalDrishti Database Seeder ===")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables created.")

    async with async_session_factory() as session:
        await seed_stations(session)
        await seed_readings(session)

    await engine.dispose()
    print("=== Seed complete ===")


if __name__ == "__main__":
    asyncio.run(main())
