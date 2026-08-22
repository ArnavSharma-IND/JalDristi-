"""
Database Seeder (SIH Demo Provisioning).
Generates SIH demo stations and historical telemetry sequences to demonstrate
dual-classification and the forecasting engine.
"""

import os
import sys
import random
from datetime import datetime, timedelta, timezone

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy.orm import Session
from app.models.database import sync_engine as engine, Base, SessionLocal
from app.models.station import Station, RiskLevel
from app.services.ingestion import process_telemetry_batch


def seed_database():
    # Explicitly drop and recreate for clean testing environments
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    print("🌱 Seeding JalDrishti Database with SIH Demo Data...")

    stations_data = [
        {"id": "DWLR-UP-001", "name": "Lucknow Central", "dist": "Lucknow", "state": "UP", "lat": 26.8467, "lon": 80.9462, "cgwb": RiskLevel.SAFE},
        {"id": "DWLR-PB-042", "name": "Patiala Agri-Block", "dist": "Patiala", "state": "Punjab", "lat": 30.3398, "lon": 76.3869, "cgwb": RiskLevel.OVER_EXPLOITED},
        {"id": "DWLR-RJ-105", "name": "Jaipur Urban", "dist": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873, "cgwb": RiskLevel.CRITICAL},
        {"id": "DWLR-MH-088", "name": "Pune Industrial", "dist": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567, "cgwb": RiskLevel.SEMI_CRITICAL}
    ]

    # 1. Insert Stations
    for s in stations_data:
        station = Station(
            station_id=s["id"],
            name=s["name"],
            district=s["dist"],
            state=s["state"],
            latitude=s["lat"],
            longitude=s["lon"],
            official_cgwb_status=s["cgwb"],
            telemetry_risk_indicator=RiskLevel.INSUFFICIENT_DATA
        )
        db.add(station)
    db.commit()

    # 2. Generate 30 days of Synthetic Telemetry (Required for Forecasting Engine)
    print("📈 Generating historical telemetry sequences...")
    base_time = datetime.now(timezone.utc) - timedelta(days=30)
    batch = []

    for s in stations_data:
        # Create a specific trend per station to test the analytics engine
        current_level = {
            "DWLR-UP-001": 4.0,   # Safe, stable
            "DWLR-PB-042": 21.0,  # Over-exploited, declining
            "DWLR-RJ-105": 16.0,  # Critical, declining fast
            "DWLR-MH-088": 8.5    # Semi-critical, recharging slightly
        }[s["id"]]

        trend = {
            "DWLR-UP-001": 0.01,
            "DWLR-PB-042": 0.05,
            "DWLR-RJ-105": 0.08,
            "DWLR-MH-088": -0.02
        }[s["id"]]

        for day in range(31):
            reading_time = base_time + timedelta(days=day)
            # Add a tiny bit of noise to make R² realistic (not 1.0)
            noise = random.uniform(-0.1, 0.1)
            water_level = current_level + (trend * day) + noise
            
            batch.append({
                "station_id": s["id"],
                "timestamp": reading_time.isoformat(),
                "water_level_m_bgl": round(water_level, 2)
            })

    # 3. Process via ingestion pipeline to ensure consistency
    stats = process_telemetry_batch(db, batch)
    print(f"✅ Ingestion Complete: {stats}")
    print("🚀 Database Seeded successfully. Ready for SIH Demonstration.")


if __name__ == "__main__":
    seed_database()
