"""
Real-World Sensor Health & Anomaly Detection.
Evaluates telemetry quality, detects dead/stale sensors (>48h) and impossible daily fluctuations (>3m/day).
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

STALE_DATA_THRESHOLD_HOURS = 48
MAX_DAILY_FLUCTUATION_METERS = 3.0  # Groundwater rarely moves >3m in 24h naturally


def evaluate_sensor_health(station_id: str, recent_readings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates real-world telemetry quality: detects dead sensors and impossible fluctuations.
    """
    if not recent_readings:
        return {
            "status": "OFFLINE",
            "reason": "No telemetry records found.",
            "is_stale": True
        }

    # Sort chronological
    sorted_readings = sorted(recent_readings, key=lambda x: x["timestamp"])
    latest = sorted_readings[-1]
    
    # 1. Staleness Check (Dead Battery / Network Failure)
    latest_ts = latest["timestamp"]
    if isinstance(latest_ts, str):
        latest_ts = datetime.fromisoformat(latest_ts.replace("Z", "+00:00"))
    if latest_ts.tzinfo is None:
        latest_ts = latest_ts.replace(tzinfo=timezone.utc)

    time_since_last_reading = datetime.now(timezone.utc) - latest_ts
    is_stale = time_since_last_reading > timedelta(hours=STALE_DATA_THRESHOLD_HOURS)
    
    # 2. Anomaly Detection (Hardware Glitch Check)
    has_anomaly = False
    anomaly_reason = None
    
    if len(sorted_readings) >= 2:
        previous = sorted_readings[-2]
        prev_ts = previous["timestamp"]
        if isinstance(prev_ts, str):
            prev_ts = datetime.fromisoformat(prev_ts.replace("Z", "+00:00"))
        if prev_ts.tzinfo is None:
            prev_ts = prev_ts.replace(tzinfo=timezone.utc)

        time_diff_days = (latest_ts - prev_ts).total_seconds() / 86400.0
        
        if time_diff_days > 0 and latest.get("water_level_m_bgl") is not None and previous.get("water_level_m_bgl") is not None:
            rate_of_change = abs(latest["water_level_m_bgl"] - previous["water_level_m_bgl"]) / time_diff_days
            if rate_of_change > MAX_DAILY_FLUCTUATION_METERS:
                has_anomaly = True
                anomaly_reason = f"Impossible fluctuation detected: {rate_of_change:.2f} m/day. Potential sensor calibration failure."

    status = "MAINTENANCE_REQUIRED" if has_anomaly else ("STALE" if is_stale else "HEALTHY")

    return {
        "status": status,
        "is_stale": is_stale,
        "last_ping_hours_ago": round(time_since_last_reading.total_seconds() / 3600, 1),
        "has_anomaly": has_anomaly,
        "anomaly_reason": anomaly_reason
    }
