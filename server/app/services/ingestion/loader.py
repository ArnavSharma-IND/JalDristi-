"""
Data ingestion service — loads and validates DWLR readings.

In the hackathon version, this reads from pre-sourced CSV files.
In a production deployment, this would poll the CGWB/India-WRIS API
on a schedule.
"""

import csv
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from loguru import logger


class DataValidationError(Exception):
    """Raised when a data row fails validation."""
    pass


def validate_reading(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate a single DWLR reading row.
    
    Checks for:
    - Required fields present
    - Depth is a positive number
    - Timestamp is parseable
    - Depth is within plausible range (0-500m)
    """
    required_fields = ["station_code", "timestamp", "depth_below_ground_m"]
    
    for field in required_fields:
        if field not in row or not row[field]:
            raise DataValidationError(f"Missing required field: {field}")
    
    try:
        depth = float(row["depth_below_ground_m"])
    except (ValueError, TypeError):
        raise DataValidationError(f"Invalid depth value: {row['depth_below_ground_m']}")
    
    if depth < 0 or depth > 500:
        raise DataValidationError(f"Depth out of plausible range: {depth}m")
    
    try:
        if isinstance(row["timestamp"], str):
            datetime.fromisoformat(row["timestamp"])
    except ValueError:
        raise DataValidationError(f"Invalid timestamp: {row['timestamp']}")
    
    row["depth_below_ground_m"] = depth
    row["quality_flag"] = "valid"
    return row


def load_csv_readings(filepath: Path) -> List[Dict[str, Any]]:
    """
    Load and validate readings from a CSV file.
    
    Returns list of validated reading dicts, logging any invalid rows.
    """
    validated = []
    errors = 0
    
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            try:
                validated.append(validate_reading(row))
            except DataValidationError as e:
                errors += 1
                logger.warning(f"Row {i} skipped: {e}")
    
    logger.info(
        f"Loaded {len(validated)} valid readings from {filepath.name} "
        f"({errors} invalid rows skipped)"
    )
    return validated
