# Data Processing Scripts

## Directory Purpose
Scripts for sourcing, cleaning, and transforming raw DWLR and rainfall data
into the formats expected by the JalDrishti backend.

## Scripts

### `process_dwlr.py`
Processes raw DWLR CSV exports into standardized station and reading tables.

Usage:
```bash
python data/scripts/process_dwlr.py --input data/raw/dwlr/ --output data/processed/
```

### `fetch_rainfall.py`
Downloads and processes rainfall data from India-WRIS or IMD for
rainfall-adjusted analysis (Tier 2).

### `generate_sample_data.py`
Generates realistic synthetic DWLR data for development and testing
when real data sourcing is still in progress.

## Data Sources

| Source | URL | Format |
|--------|-----|--------|
| India-WRIS | https://indiawris.gov.in/ | CSV/Excel |
| CGWB DWLR Portal | https://cgwb.gov.in/GW-data-access | CSV |
| IMD Rainfall | https://www.imdpune.gov.in/ | CSV |

## Output Schema

### stations.csv
| Column | Type | Description |
|--------|------|-------------|
| station_code | string | Unique DWLR station identifier |
| name | string | Station name |
| latitude | float | WGS84 latitude |
| longitude | float | WGS84 longitude |
| district | string | District name |
| state | string | State name |
| block | string | Block/taluk name |
| aquifer_type | string | Aquifer classification |
| well_depth_m | float | Total well depth in meters |

### readings.csv
| Column | Type | Description |
|--------|------|-------------|
| station_id | uuid | FK to stations table |
| timestamp | datetime | Observation timestamp (ISO 8601) |
| depth_below_ground_m | float | Water depth in meters bgl |
| quality_flag | string | valid / suspect / missing |
