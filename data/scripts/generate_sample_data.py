"""
Generate realistic synthetic DWLR data for development and testing.

Creates sample stations and readings that demonstrate all four risk categories
with realistic seasonal patterns and long-term trends.

Usage:
    python data/scripts/generate_sample_data.py
"""

import csv
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "processed"


# Sample stations covering the 3 target districts
SAMPLE_STATIONS = [
    # Mehsana, Gujarat — Over-exploited trend
    {
        "station_code": "GJ-MEH-001",
        "name": "Mehsana DWLR Station 1 - Visnagar",
        "latitude": 23.6985,
        "longitude": 72.5463,
        "district": "Mehsana",
        "state": "Gujarat",
        "block": "Visnagar",
        "aquifer_type": "Alluvial",
        "well_depth_m": 120.0,
        "base_depth": 18.0,
        "trend_rate": 1.8,  # m/year deepening
        "seasonal_amplitude": 4.0,
    },
    {
        "station_code": "GJ-MEH-002",
        "name": "Mehsana DWLR Station 2 - Kadi",
        "latitude": 23.2997,
        "longitude": 72.3340,
        "district": "Mehsana",
        "state": "Gujarat",
        "block": "Kadi",
        "aquifer_type": "Alluvial",
        "well_depth_m": 95.0,
        "base_depth": 22.0,
        "trend_rate": 2.5,
        "seasonal_amplitude": 5.0,
    },
    {
        "station_code": "GJ-MEH-003",
        "name": "Mehsana DWLR Station 3 - Unjha",
        "latitude": 23.8046,
        "longitude": 72.3940,
        "district": "Mehsana",
        "state": "Gujarat",
        "block": "Unjha",
        "aquifer_type": "Alluvial",
        "well_depth_m": 85.0,
        "base_depth": 12.0,
        "trend_rate": 0.8,
        "seasonal_amplitude": 3.5,
    },
    # Jaipur, Rajasthan — Mixed risk zones
    {
        "station_code": "RJ-JAI-001",
        "name": "Jaipur DWLR Station 1 - Amber",
        "latitude": 26.9855,
        "longitude": 75.8513,
        "district": "Jaipur",
        "state": "Rajasthan",
        "block": "Amber",
        "aquifer_type": "Hard Rock",
        "well_depth_m": 60.0,
        "base_depth": 5.0,
        "trend_rate": 0.3,
        "seasonal_amplitude": 2.5,
    },
    {
        "station_code": "RJ-JAI-002",
        "name": "Jaipur DWLR Station 2 - Sanganer",
        "latitude": 26.8166,
        "longitude": 75.7885,
        "district": "Jaipur",
        "state": "Rajasthan",
        "block": "Sanganer",
        "aquifer_type": "Hard Rock",
        "well_depth_m": 75.0,
        "base_depth": 10.0,
        "trend_rate": 1.2,
        "seasonal_amplitude": 3.0,
    },
    {
        "station_code": "RJ-JAI-003",
        "name": "Jaipur DWLR Station 3 - Chaksu",
        "latitude": 26.6050,
        "longitude": 75.9500,
        "district": "Jaipur",
        "state": "Rajasthan",
        "block": "Chaksu",
        "aquifer_type": "Hard Rock",
        "well_depth_m": 50.0,
        "base_depth": 16.0,
        "trend_rate": 1.5,
        "seasonal_amplitude": 4.0,
    },
    # Tumkur, Karnataka — Semi-critical trending
    {
        "station_code": "KA-TUM-001",
        "name": "Tumkur DWLR Station 1 - Tiptur",
        "latitude": 13.2590,
        "longitude": 76.4780,
        "district": "Tumkur",
        "state": "Karnataka",
        "block": "Tiptur",
        "aquifer_type": "Granitic",
        "well_depth_m": 45.0,
        "base_depth": 7.0,
        "trend_rate": 0.6,
        "seasonal_amplitude": 2.0,
    },
    {
        "station_code": "KA-TUM-002",
        "name": "Tumkur DWLR Station 2 - Gubbi",
        "latitude": 13.3120,
        "longitude": 76.9430,
        "district": "Tumkur",
        "state": "Karnataka",
        "block": "Gubbi",
        "aquifer_type": "Granitic",
        "well_depth_m": 55.0,
        "base_depth": 9.0,
        "trend_rate": 0.9,
        "seasonal_amplitude": 2.5,
    },
]


def generate_readings(station: dict, start_year: int = 2019, end_year: int = 2025):
    """Generate synthetic monthly readings for a station."""
    readings = []
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 6, 30)
    
    current_date = start_date
    while current_date <= end_date:
        # Years elapsed from start
        years_elapsed = (current_date - start_date).days / 365.25
        
        # Linear trend component
        trend = station["base_depth"] + station["trend_rate"] * years_elapsed
        
        # Seasonal component (monsoon recharge ~July-Sept causes shallower levels)
        month = current_date.month
        # Lowest depth (most recharged) in Sept-Oct, deepest in May-June
        seasonal = station["seasonal_amplitude"] * math.sin(2 * math.pi * (month - 3) / 12)
        
        # Random noise
        noise = random.gauss(0, 0.3)
        
        depth = max(0.5, trend + seasonal + noise)
        
        readings.append({
            "timestamp": current_date.isoformat(),
            "depth_below_ground_m": round(depth, 2),
            "quality_flag": "valid" if random.random() > 0.02 else "suspect",
        })
        
        # Advance ~1 month (with slight randomness)
        current_date += timedelta(days=random.randint(28, 32))
    
    return readings


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate station IDs
    station_ids = {}
    for s in SAMPLE_STATIONS:
        station_ids[s["station_code"]] = str(uuid4())
    
    # Write stations.csv
    stations_file = OUTPUT_DIR / "stations.csv"
    with open(stations_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "id", "station_code", "name", "latitude", "longitude",
            "district", "state", "block", "aquifer_type", "well_depth_m",
        ])
        writer.writeheader()
        for s in SAMPLE_STATIONS:
            writer.writerow({
                "id": station_ids[s["station_code"]],
                "station_code": s["station_code"],
                "name": s["name"],
                "latitude": s["latitude"],
                "longitude": s["longitude"],
                "district": s["district"],
                "state": s["state"],
                "block": s["block"],
                "aquifer_type": s["aquifer_type"],
                "well_depth_m": s["well_depth_m"],
            })
    
    print(f"[OK] Wrote {len(SAMPLE_STATIONS)} stations to {stations_file}")
    
    # Write readings.csv
    readings_file = OUTPUT_DIR / "readings.csv"
    total_readings = 0
    with open(readings_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "station_id", "station_code", "timestamp",
            "depth_below_ground_m", "quality_flag",
        ])
        writer.writeheader()
        for s in SAMPLE_STATIONS:
            readings = generate_readings(s)
            for r in readings:
                writer.writerow({
                    "station_id": station_ids[s["station_code"]],
                    "station_code": s["station_code"],
                    **r,
                })
                total_readings += 1
    
    print(f"[OK] Wrote {total_readings} readings to {readings_file}")
    print(f"\nSample data generation complete. Files in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
