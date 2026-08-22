"""
Groundwater risk classification engine.

Classifies stations into CGWB standard categories based on:
  1. Stage of Groundwater Development (%) — official metric, when available
  2. Water-level depth proxy — fallback when Stage data is unavailable

The dual-mode approach is documented honestly: most DWLR stations only
have depth data, so the depth proxy is the primary path. When Stage of
Development data becomes available (e.g., from CGWB district reports),
it takes precedence automatically.
"""

from typing import Optional, Tuple

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


def classify_station(station: Station) -> Tuple[RiskCategory, str]:
    """
    Classify a station using the best available data.

    Returns:
        (risk_category, method) where method is 'stage' or 'depth_proxy'.

    Priority:
      1. Stage of Development (if available on the station)
      2. Latest depth reading (current_depth_m or most recent reading)
    """
    # Priority 1: Official CGWB Stage of Development metric
    if station.stage_of_development is not None:
        return classify_by_stage(station.stage_of_development), "stage"

    # Priority 2: Depth-based proxy
    if station.current_depth_m is not None:
        return classify_by_depth(station.current_depth_m), "depth_proxy"

    # Priority 3: Fall back to readings list
    if station.readings:
        latest = max(station.readings, key=lambda r: r.timestamp)
        return classify_by_depth(latest.depth_below_ground_m), "depth_proxy"

    # No data at all — default safe with explicit method
    return RiskCategory.SAFE, "depth_proxy"
