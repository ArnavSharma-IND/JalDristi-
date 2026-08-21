# JalDrishti System Architecture

## Overview

JalDrishti is a four-layer groundwater monitoring and advisory system.

## Data Flow

```
DWLR Station → CSV/API → Ingestion → Validation → PostgreSQL
                                                      ↓
                                                Classification (CGWB Norms)
                                                      ↓
                                                Forecasting (Linear Trend)
                                                      ↓
                                                Advisory (Gemini LLM)
                                                      ↓
                                                Dashboard (React)
```

## Database Schema

### stations
Core table for monitoring stations with geographic and administrative data.

### water_level_readings
Time-series table of DWLR observations, keyed by station_id + timestamp.

## Service Architecture

- **Ingestion Service**: Validates and loads raw DWLR readings
- **Classification Service**: Applies CGWB risk thresholds (depth-based proxy)
- **Forecasting Service**: Linear regression trend projection per station
- **Advisory Service**: LLM-generated plain-language recommendations

## API Design

RESTful JSON API with the following resource hierarchy:

```
/api/v1/
├── health
├── stations/
│   ├── {id}/
│   │   ├── forecast
│   │   └── advisory
├── districts/
│   └── {name}/stations
```
