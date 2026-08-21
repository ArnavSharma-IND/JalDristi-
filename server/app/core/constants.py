"""
Domain constants — CGWB groundwater classification thresholds and enums.

Based on: Central Ground Water Board (CGWB) categorization norms.
The classification uses the ratio of groundwater extraction to net annual
recharge, known as the Stage of Groundwater Development (%).

Reference:
  CGWB, "Dynamic Ground Water Resources of India", 2023
  http://cgwb.gov.in/
"""

from enum import Enum


class RiskCategory(str, Enum):
    """
    CGWB standard four-tier risk classification based on
    Stage of Groundwater Development (%).

    Stage = (Annual GW Extraction / Net Annual GW Recharge) x 100
    """
    SAFE = "Safe"                       # Stage < 70%
    SEMI_CRITICAL = "Semi-Critical"     # 70% <= Stage < 90%
    CRITICAL = "Critical"               # 90% <= Stage < 100%
    OVER_EXPLOITED = "Over-Exploited"   # Stage >= 100%


# Stage of Development thresholds (percentage)
RISK_THRESHOLDS = {
    RiskCategory.SAFE: (0, 70),
    RiskCategory.SEMI_CRITICAL: (70, 90),
    RiskCategory.CRITICAL: (90, 100),
    RiskCategory.OVER_EXPLOITED: (100, float("inf")),
}

# Depth-based proxy thresholds (meters below ground level)
# Used when Stage of Development data is unavailable and only water-level
# depth readings are available. These are approximate and region-dependent.
DEPTH_THRESHOLDS_DEFAULT = {
    RiskCategory.SAFE: (0, 8),              # < 8m bgl
    RiskCategory.SEMI_CRITICAL: (8, 15),    # 8–15m bgl
    RiskCategory.CRITICAL: (15, 25),        # 15–25m bgl
    RiskCategory.OVER_EXPLOITED: (25, float("inf")),  # > 25m bgl
}

# Forecast horizon (months)
DEFAULT_FORECAST_HORIZON_MONTHS = 24

# Minimum data points required for trend calculation
MIN_DATA_POINTS_FOR_TREND = 6

# Colors for dashboard rendering
RISK_COLORS = {
    RiskCategory.SAFE: "#22c55e",            # Green
    RiskCategory.SEMI_CRITICAL: "#f59e0b",   # Amber
    RiskCategory.CRITICAL: "#f97316",         # Orange
    RiskCategory.OVER_EXPLOITED: "#ef4444",   # Red
}
