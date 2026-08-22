"""
Transition-Based Alert Engine.
Tracks actual risk boundary transitions and persistent critical states to prevent alert spam.
Dispatches mock SMS/webhook notifications to field officers upon severe escalation.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.models.station import RiskLevel

logger = logging.getLogger(__name__)

SEVERITY_MAP = {
    RiskLevel.SAFE: "INFO",
    RiskLevel.SEMI_CRITICAL: "WARNING",
    RiskLevel.CRITICAL: "HIGH",
    RiskLevel.OVER_EXPLOITED: "CRITICAL",
    RiskLevel.INSUFFICIENT_DATA: "LOW"
}


def dispatch_sms_notification(phone: str, message: str):
    """Mock SMS Dispatcher for SIH Demo - normally hooks into Twilio/Fast2SMS/NIC Gateway."""
    print(f"📱 [SMS DISPATCHED to {phone}]: {message}")
    logger.info(f"SMS Alert sent to {phone}: {message}")


def process_risk_transition(
    station_id: str,
    district: str,
    previous_risk: RiskLevel,
    current_risk: RiskLevel,
    current_water_level: float
) -> Optional[Dict[str, Any]]:
    """
    Emits an alert payload ONLY when a state transition occurs or high-risk thresholds persist.
    """
    if previous_risk == current_risk and current_risk not in [RiskLevel.CRITICAL, RiskLevel.OVER_EXPLOITED]:
        return None

    # Determine alert categorization
    if previous_risk != current_risk:
        if current_risk in [RiskLevel.CRITICAL, RiskLevel.OVER_EXPLOITED]:
            event_type = "ESCALATION"
            reason = f"Water level depleted to {current_water_level:.2f} m bgl. Risk transitioned from {previous_risk.value} to {current_risk.value}."
        elif previous_risk in [RiskLevel.CRITICAL, RiskLevel.OVER_EXPLOITED] and current_risk in [RiskLevel.SAFE, RiskLevel.SEMI_CRITICAL]:
            event_type = "RECOVERY"
            reason = f"Water level recharged to {current_water_level:.2f} m bgl. State improved from {previous_risk.value} to {current_risk.value}."
        else:
            event_type = "STATUS_CHANGE"
            reason = f"Risk reclassified from {previous_risk.value} to {current_risk.value}."
    else:
        event_type = "PERSISTENT_CRITICAL"
        reason = f"Station remains at critical level ({current_water_level:.2f} m bgl)."

    # Trigger SMS on severe escalation
    if event_type == "ESCALATION" and current_risk in [RiskLevel.CRITICAL, RiskLevel.OVER_EXPLOITED]:
        sms_msg = f"URGENT: DWLR {station_id} ({district}) has reached {current_risk.value} at {current_water_level:.2f}m bgl. Immediate review required."
        dispatch_sms_notification("+91-9999999999", sms_msg)

    return {
        "station_id": station_id,
        "district": district,
        "event_type": event_type,
        "severity": SEVERITY_MAP.get(current_risk, "INFO"),
        "previous_state": previous_risk.value if hasattr(previous_risk, "value") else str(previous_risk),
        "new_state": current_risk.value if hasattr(current_risk, "value") else str(current_risk),
        "current_water_level_m_bgl": current_water_level,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE"
    }
