"""
Trend forecasting engine.

Fits a linear (or optionally exponential) model to a station's water-level
time series and projects forward to estimate when the station will cross
into the next, more severe risk category.

Design philosophy: a clear, defensible linear trend beats an unexplainable
black-box model. This is a hackathon — the forecast must be explainable
in 30 seconds to a judge.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

import numpy as np

from app.core.constants import (
    RiskCategory,
    DEPTH_THRESHOLDS_DEFAULT,
    DEFAULT_FORECAST_HORIZON_MONTHS,
    MIN_DATA_POINTS_FOR_TREND,
)
from app.models.station import Station
from app.models.reading import WaterLevelReading
from app.schemas.station import StationForecast, ForecastPoint


# Risk category severity ordering (for "next tier" logic)
_SEVERITY_ORDER = [
    RiskCategory.SAFE,
    RiskCategory.SEMI_CRITICAL,
    RiskCategory.CRITICAL,
    RiskCategory.OVER_EXPLOITED,
]


def _next_risk_tier(current: RiskCategory) -> Optional[RiskCategory]:
    """Return the next more severe risk tier, or None if already worst."""
    idx = _SEVERITY_ORDER.index(current)
    if idx < len(_SEVERITY_ORDER) - 1:
        return _SEVERITY_ORDER[idx + 1]
    return None


def _threshold_for_tier(tier: RiskCategory) -> float:
    """Return the lower depth threshold (m) for a risk tier."""
    return DEPTH_THRESHOLDS_DEFAULT[tier][0]


def compute_forecast(
    station: Station,
    horizon_months: int = DEFAULT_FORECAST_HORIZON_MONTHS,
) -> StationForecast:
    """
    Compute a linear trend forecast for a station.

    Returns:
        StationForecast with projected depths, rate of change,
        and estimated months to next risk tier.
    """
    readings: List[WaterLevelReading] = sorted(
        station.readings, key=lambda r: r.timestamp
    )

    # Filter to valid readings only
    valid_readings = [r for r in readings if r.quality_flag == "valid"]

    if len(valid_readings) < MIN_DATA_POINTS_FOR_TREND:
        return StationForecast(
            station_id=station.id,
            station_code=station.station_code,
            current_risk_category=station.current_risk_category,
            current_depth_m=station.current_depth_m,
            forecast_risk_category=None,
            months_to_next_risk_tier=None,
            trend_direction="stable",
            rate_of_change_m_per_year=0.0,
            forecast_points=[],
            confidence="low",
            data_points_used=len(valid_readings),
        )

    # Convert timestamps to days since first reading (numeric x-axis)
    t0 = valid_readings[0].timestamp
    x = np.array([(r.timestamp - t0).total_seconds() / 86400 for r in valid_readings])
    y = np.array([r.depth_below_ground_m for r in valid_readings])

    # Linear regression: depth = slope * days + intercept
    slope, intercept = np.polyfit(x, y, 1)

    # Rate of change in meters per year
    rate_m_per_year = slope * 365.25

    # Determine trend direction
    if rate_m_per_year > 0.1:
        trend_direction = "declining"   # Water table going deeper = bad
    elif rate_m_per_year < -0.1:
        trend_direction = "recovering"  # Water table rising = good
    else:
        trend_direction = "stable"

    # Current risk and next tier
    from app.services.classification.classifier import classify_by_depth
    current_depth = valid_readings[-1].depth_below_ground_m
    current_risk = classify_by_depth(current_depth)
    next_tier = _next_risk_tier(current_risk)

    # Estimate months to next risk tier
    months_to_next: Optional[int] = None
    forecast_risk: Optional[RiskCategory] = None

    if next_tier and slope > 0:
        threshold = _threshold_for_tier(next_tier)
        if current_depth < threshold:
            days_to_threshold = (threshold - current_depth) / slope
            months_to_next = max(1, int(days_to_threshold / 30.44))
            forecast_risk = next_tier

    # Generate forecast points (monthly)
    last_day = x[-1]
    last_date = valid_readings[-1].timestamp
    forecast_points = []

    for m in range(1, horizon_months + 1):
        future_day = last_day + m * 30.44
        projected_depth = slope * future_day + intercept
        future_date = last_date + timedelta(days=m * 30.44)
        forecast_points.append(
            ForecastPoint(
                date=future_date,
                projected_depth_m=round(max(0, projected_depth), 2),
            )
        )

    # Confidence based on data quantity and R-squared
    y_pred = slope * x + intercept
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

    if len(valid_readings) >= 24 and r_squared > 0.7:
        confidence = "high"
    elif len(valid_readings) >= 12 and r_squared > 0.4:
        confidence = "moderate"
    else:
        confidence = "low"

    return StationForecast(
        station_id=station.id,
        station_code=station.station_code,
        current_risk_category=current_risk,
        current_depth_m=round(current_depth, 2),
        forecast_risk_category=forecast_risk,
        months_to_next_risk_tier=months_to_next,
        trend_direction=trend_direction,
        rate_of_change_m_per_year=round(rate_m_per_year, 3),
        forecast_points=forecast_points,
        confidence=confidence,
        data_points_used=len(valid_readings),
    )
