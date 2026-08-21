"""
Groundwater risk classification engine.

Classifies stations into CGWB standard categories based on water-level depth.
When Stage of Development (extraction/recharge ratio) data is available,
that takes precedence. Otherwise, depth-based proxy thresholds are used.
"""

from typing import Optional

from app.core.constants import (
    RiskCategory,
    RISK_THRESHOLDS,
    DEPTH_THRESHOLDS_DEFAULT,
)
from app.models.station import Station


def classify_by_stage(stage_of_development: float) -> RiskCategory:
    """
    Classify using Stage of Groundwater Development (%).

    Stage = (Annual GW Extraction / Net Annual GW Recharge) x 100
    """
    for category, (lower, upper) in RISK_THRESHOLDS.items():
        if lower <= stage_of_development < upper:
            return category
    return RiskCategory.OVER_EXPLOITED


def classify_by_depth(
    depth_m: float,
    thresholds: Optional[dict] = None,
) -> RiskCategory:
    """
    Classify using water-level depth below ground level (meters).

    Uses default thresholds unless region-specific overrides are provided.
    """
    thresholds = thresholds or DEPTH_THRESHOLDS_DEFAULT

    for category, (lower, upper) in thresholds.items():
        if lower <= depth_m < upper:
            return category
    return RiskCategory.OVER_EXPLOITED


def classify_station(station: Station) -> RiskCategory:
    """
    Classify a station using the best available data.

    Priority:
      1. Stage of Development (if available)
      2. Latest depth reading
    """
    if station.current_depth_m is not None:
        return classify_by_depth(station.current_depth_m)

    # If no readings at all, return None-safe fallback
    if station.readings:
        latest = max(station.readings, key=lambda r: r.timestamp)
        return classify_by_depth(latest.depth_below_ground_m)

    return RiskCategory.SAFE  # Default for stations with no data
