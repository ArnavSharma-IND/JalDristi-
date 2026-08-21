# Data Dictionary

## CGWB Risk Classification

| Category | Stage of Development (%) | Depth Proxy (m bgl) | Color |
|----------|--------------------------|---------------------|-------|
| Safe | < 70% | < 8m | Green |
| Semi-Critical | 70–90% | 8–15m | Amber |
| Critical | 90–100% | 15–25m | Orange |
| Over-Exploited | > 100% | > 25m | Red |

**Stage of Development** = (Annual GW Extraction / Net Annual GW Recharge) × 100

When Stage of Development data is unavailable (common for station-level data),
depth below ground level (m bgl) is used as a proxy classification.

## Data Sources

| Source | Description | URL |
|--------|-------------|-----|
| CGWB DWLR | Station locations and water-level readings | https://cgwb.gov.in/ |
| India-WRIS | Rainfall, river basin, and water resource data | https://indiawris.gov.in/ |
| IMD | India Meteorological Department rainfall records | https://www.imdpune.gov.in/ |

## Measurement Units

| Field | Unit | Description |
|-------|------|-------------|
| depth_below_ground_m | meters (m bgl) | Water depth below ground level |
| reduced_level_m | meters (m amsl) | Water level above mean sea level |
| well_depth_m | meters | Total depth of the monitoring well |
| rate_of_change_m_per_year | meters/year | Trend slope of depth change |
