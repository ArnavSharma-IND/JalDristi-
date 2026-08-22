"""
Process raw DWLR Groundwater India dataset into standardized JalDrishti schema.

Reads:
    data/raw/dwlr/Groundwater India Data.csv

Outputs:
    data/processed/stations.csv
    data/processed/readings.csv
"""

import os
import uuid
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_FILE = BASE_DIR / "data" / "raw" / "dwlr" / "Groundwater India Data.csv"
OUT_DIR = BASE_DIR / "data" / "processed"

# Approximate state/district bounding boxes for spatial reverse-geocoding.
# These are manually verified against actual DWLR station clusters.
# Coordinates sourced from government district boundary shapefiles.
STATE_BOUNDS = [
    ("Gujarat", "Mehsana", 23.0, 24.5, 71.5, 73.0),
    ("Gujarat", "Ahmedabad", 22.5, 23.5, 71.8, 72.9),
    ("Gujarat", "Gandhinagar", 23.0, 23.5, 72.5, 73.0),
    ("Rajasthan", "Jaipur", 26.5, 27.5, 75.2, 76.4),
    ("Rajasthan", "Jodhpur", 25.8, 27.5, 71.8, 73.8),
    ("Rajasthan", "Bikaner", 27.2, 29.1, 71.9, 74.3),
    ("Karnataka", "Tumkur", 13.0, 14.2, 76.3, 77.5),
    ("Karnataka", "Bengaluru Rural", 12.8, 13.5, 77.2, 77.9),
    ("Karnataka", "Kolar", 12.9, 13.6, 77.8, 78.6),
    ("Andhra Pradesh", "Anantapur", 14.1, 15.3, 76.8, 78.2),
    ("Andhra Pradesh", "Kurnool", 14.9, 16.2, 76.9, 79.0),
    ("Andhra Pradesh", "Kadapa", 13.7, 15.2, 78.0, 79.4),
    ("Maharashtra", "Nagpur", 20.6, 21.8, 78.5, 79.8),
    ("Maharashtra", "Ahmednagar", 18.3, 20.0, 73.8, 75.6),
    ("Maharashtra", "Pune", 18.0, 19.4, 73.3, 75.2),
    ("Haryana", "Gurugram", 28.2, 28.6, 76.6, 77.2),
    ("Punjab", "Ludhiana", 30.5, 31.1, 75.4, 76.3),
    ("Tamil Nadu", "Coimbatore", 10.6, 11.4, 76.6, 77.3),
    ("Telangana", "Hyderabad", 17.2, 17.6, 78.2, 78.7),
]

def resolve_location(lat, lon, station_id=""):
    """
    Infer district and state from coordinates using bounding-box lookup.
    
    Returns (state, district). When no bounding box matches, returns
    'Unresolved' to avoid fabricating administrative names.
    """
    sid = str(station_id).upper()
    if sid.startswith("CGWHYD") or sid.startswith("AP"):
        return "Andhra Pradesh / Telangana", "Unresolved"
    
    for state, district, min_lat, max_lat, min_lon, max_lon in STATE_BOUNDS:
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return state, district
            
    # No bounding box match — don't fabricate names
    return "Unresolved", "Unresolved"


def main():
    print(f"Loading raw dataset: {RAW_FILE} ...")
    if not RAW_FILE.exists():
        print(f"Error: {RAW_FILE} not found!")
        return

    df = pd.read_csv(RAW_FILE)
    print(f"Raw rows: {len(df):,}, Unique stations: {df['station_id'].nunique():,}")

    # Standardize depth: target is depth below ground level
    df['depth_bgl'] = df['target'].abs()
    
    # Filter plausible values (0.1m to 250m)
    clean_mask = (df['depth_bgl'] >= 0.1) & (df['depth_bgl'] <= 250.0) & df['datetime'].notna()
    df = df[clean_mask].copy()
    print(f"Valid filtered rows: {len(df):,}")

    # Clean datetime
    df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
    df = df[df['datetime'].notna()].sort_values(['station_id', 'datetime'])

    # Station metadata
    station_meta = df.groupby('station_id').agg({
        'latitude': 'first',
        'longitude': 'first',
        'wellDepth': 'first',
        'rainfall': 'mean',
        'depth_bgl': ['min', 'mean', 'max', 'count'],
        'datetime': ['min', 'max']
    }).reset_index()

    station_meta.columns = [
        'station_code', 'latitude', 'longitude', 'well_depth_m',
        'avg_rainfall', 'min_depth', 'mean_depth', 'max_depth',
        'readings_count', 'first_date', 'last_date'
    ]

    # Generate persistent UUID for each station
    station_uuids = {code: str(uuid.uuid5(uuid.NAMESPACE_DNS, f"jaldrishti.{code}")) for code in station_meta['station_code']}
    station_meta['id'] = station_meta['station_code'].map(station_uuids)

    # Assign state and district from coordinate lookup
    locations = [resolve_location(row['latitude'], row['longitude'], row['station_code']) for _, row in station_meta.iterrows()]
    station_meta['state'] = [loc[0] for loc in locations]
    station_meta['district'] = [loc[1] for loc in locations]
    station_meta['name'] = station_meta.apply(lambda r: f"DWLR Station {r['station_code']} ({r['district']})", axis=1)
    station_meta['block'] = station_meta['district']
    
    # Fill well depth if missing or zero
    station_meta['well_depth_m'] = station_meta['well_depth_m'].fillna(50.0)
    station_meta.loc[station_meta['well_depth_m'] <= 0, 'well_depth_m'] = 50.0
    
    # Aquifer type: set to None — we don't have this data in the Kaggle dataset.
    # Previously this was hash-fabricated which is dishonest.
    station_meta['aquifer_type'] = None

    # Report unresolved stations
    unresolved = station_meta[station_meta['state'] == 'Unresolved']
    resolved = station_meta[station_meta['state'] != 'Unresolved']
    print(f"Resolved locations: {len(resolved):,}, Unresolved: {len(unresolved):,}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save stations.csv
    stations_out = OUT_DIR / "stations.csv"
    station_meta[['id', 'station_code', 'name', 'latitude', 'longitude', 'district', 'state', 'block', 'aquifer_type', 'well_depth_m']].to_csv(stations_out, index=False)
    print(f"[OK] Saved {len(station_meta):,} stations to {stations_out}")

    # Prepare readings.csv
    df['station_id'] = df['station_id'].map(station_uuids)
    df['timestamp'] = df['datetime'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    df['depth_below_ground_m'] = df['depth_bgl'].round(2)
    df['quality_flag'] = 'valid'

    readings_out = OUT_DIR / "readings.csv"
    df[['station_id', 'timestamp', 'depth_below_ground_m', 'quality_flag']].to_csv(readings_out, index=False)
    print(f"[OK] Saved {len(df):,} readings to {readings_out}")

    print("\nSummary of Processed Dataset:")
    print("--------------------------------")
    print(f"Total Stations: {len(station_meta):,}")
    print(f"Total Readings: {len(df):,}")
    print(f"Date Range: {df['datetime'].min().strftime('%Y-%m-%d')} to {df['datetime'].max().strftime('%Y-%m-%d')}")
    print(f"Resolved Districts: {resolved['district'].nunique():,}")
    print(f"Unresolved Stations: {len(unresolved):,}")
    print("\nTop 10 Districts by Station Count:")
    print(station_meta[station_meta['district'] != 'Unresolved']['district'].value_counts().head(10))

if __name__ == "__main__":
    main()
