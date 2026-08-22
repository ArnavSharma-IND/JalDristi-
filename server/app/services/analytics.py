"""
Risk Classification & Forecasting Engine.
Enforces the mathematical separation between real-time telemetry proxies and statutory benchmarks,
and calculates forecasting metrics (R², slope, confidence) without fabricating accuracy.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.models.station import RiskLevel

# Configurable Telemetry Depth Thresholds (in meters below ground level: m bgl)
TELEMETRY_THRESHOLDS = {
    "SAFE": 5.0,           # < 5.0m bgl
    "SEMI_CRITICAL": 10.0,  # 5.0m - 10.0m bgl
    "CRITICAL": 20.0,       # 10.0m - 20.0m bgl
    "OVER_EXPLOITED": 20.0  # > 20.0m bgl
}


def evaluate_telemetry_risk(water_level_m_bgl: Optional[float]) -> RiskLevel:
    """Calculates operational depth-based risk proxy from telemetry."""
    if water_level_m_bgl is None or water_level_m_bgl < 0:
        return RiskLevel.INSUFFICIENT_DATA
    if water_level_m_bgl < TELEMETRY_THRESHOLDS["SAFE"]:
        return RiskLevel.SAFE
    elif water_level_m_bgl < TELEMETRY_THRESHOLDS["SEMI_CRITICAL"]:
        return RiskLevel.SEMI_CRITICAL
    elif water_level_m_bgl <= TELEMETRY_THRESHOLDS["CRITICAL"]:
        return RiskLevel.CRITICAL
    else:
        return RiskLevel.OVER_EXPLOITED


def compute_linear_forecast(readings: List[Dict[str, Any]], horizon_days: int = 30) -> Dict[str, Any]:
    """
    Computes an empirical linear trend forecast over available historical observations.
    Exposes slope, R², and strict data confidence levels.
    """
    if not readings or len(readings) < 5:
        return {
            "model_type": "Linear Regression Trend",
            "observation_count": len(readings) if readings else 0,
            "forecast_horizon_days": horizon_days,
            "slope_m_per_day": 0.0,
            "r_squared": None,
            "trend_direction": "UNKNOWN",
            "confidence": "INSUFFICIENT_DATA",
            "projected_water_level": None,
            "reason": "Minimum 5 valid sequential telemetry records required for regression analysis."
        }

    # Sort chronological
    sorted_readings = sorted(readings, key=lambda x: x["timestamp"])
    base_time = sorted_readings[0]["timestamp"]
    
    # Extract relative days (X) and water level in m bgl (Y)
    x = np.array([(r["timestamp"] - base_time).total_seconds() / 86400.0 for r in sorted_readings])
    y = np.array([r["water_level_m_bgl"] for r in sorted_readings])

    # Check for zero variance in time
    if np.all(x == x[0]):
        return {
            "model_type": "Linear Regression Trend",
            "observation_count": len(readings),
            "forecast_horizon_days": horizon_days,
            "slope_m_per_day": 0.0,
            "r_squared": None,
            "trend_direction": "STABLE",
            "confidence": "LOW",
            "projected_water_level": float(y[-1]),
            "reason": "Zero time variance across observations."
        }

    # Linear Regression: Y = slope * X + intercept
    n = len(x)
    slope, intercept = np.polyfit(x, y, 1)
    
    # Calculate R-squared
    y_pred = slope * x + intercept
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r_squared = float(1 - (ss_res / ss_tot)) if ss_tot != 0 else 0.0

    # Trend categorization
    if abs(slope) < 0.005:
        trend_direction = "STABLE"
    elif slope > 0:
        trend_direction = "DEPLETING"  # Deeper water level = depletion
    else:
        trend_direction = "RECHARGING"  # Shallower level = recharge

    # Confidence grading
    time_span_days = x[-1] - x[0]
    if n >= 30 and r_squared >= 0.70 and time_span_days >= 30:
        confidence = "HIGH"
    elif n >= 10 and r_squared >= 0.40 and time_span_days >= 14:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    # Future Projection
    last_x = x[-1]
    future_x = last_x + horizon_days
    projected_level = max(0.0, float(slope * future_x + intercept))

    return {
        "model_type": "Linear Ordinary Least Squares (OLS)",
        "observation_count": n,
        "historical_duration_days": round(float(time_span_days), 1),
        "forecast_horizon_days": horizon_days,
        "slope_m_per_day": round(float(slope), 5),
        "r_squared": round(float(r_squared), 4),
        "trend_direction": trend_direction,
        "confidence": confidence,
        "projected_water_level": round(projected_level, 2),
        "reason": "Computed from continuous station observations."
    }


def check_predictive_risk(forecast_data: Dict[str, Any], current_risk: RiskLevel) -> Optional[Dict[str, Any]]:
    """
    Analyzes the 30-day forecast. If a safe/semi-critical station is projected 
    to cross the CRITICAL threshold (10.0m bgl), it generates a predictive warning.
    """
    if not forecast_data or forecast_data.get("confidence") in ["LOW", "INSUFFICIENT_DATA"]:
        return None
        
    projected_level = forecast_data.get("projected_water_level")
    if projected_level is None:
        return None

    # If currently not critical, but projected to cross the 10m threshold
    if current_risk in [RiskLevel.SAFE, RiskLevel.SEMI_CRITICAL] and projected_level >= 10.0:
        return {
            "type": "PREDICTIVE_WARNING",
            "message": f"Forecast indicates threshold breach. Projected to reach {projected_level:.2f}m bgl within 30 days due to a depletion rate of {forecast_data.get('slope_m_per_day')} m/day.",
            "urgency": "HIGH",
            "projected_level": projected_level
        }
    
    return None
