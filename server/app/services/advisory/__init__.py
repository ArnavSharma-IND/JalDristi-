"""
Resilient AI Advisory Service with Deterministic Hydrological Rule Fallback.
Uses Google Gemini when credentials and network connections are active,
and seamlessly switches to the deterministic hydrology rule engine during limits/outages.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def generate_rule_based_advisory(context: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic fallback hydrological decision tree."""
    risk = context.get("telemetry_risk", "INSUFFICIENT_DATA")
    trend = context.get("trend_direction", "STABLE")
    level = context.get("latest_water_level", "N/A")
    station_id = context.get("station_id", "Unknown Station")
    district = context.get("district", "Unknown District")

    actions = []
    priority = "NORMAL"

    if risk in ["CRITICAL", "OVER_EXPLOITED"]:
        priority = "URGENT"
        actions.append("Issue immediate groundwater extraction quota notices to commercial users in block.")
        actions.append("Inspect nearby DWLR telemetry unit for calibration check within 48 hours.")
        actions.append("Activate emergency artificial recharge and check bund status in catchment area.")
    elif risk == "SEMI_CRITICAL":
        priority = "HIGH"
        actions.append("Increase DWLR monitoring interval and track weekly drawdowns.")
        actions.append("Encourage micro-irrigation systems (drip/sprinkler) in command agricultural plots.")
    else:
        actions.append("Maintain baseline observation protocol.")
        actions.append("Verify pre-monsoon baseline records against regional aquifer atlas.")

    if trend == "DEPLETING":
        actions.append("Assess local abstraction stress; rapid downward gradient detected.")

    return {
        "situation": f"Station {station_id} in {district} displays a current depth of {level} m bgl with a {trend.lower()} trend.",
        "risk_explanation": f"Categorized as {risk} under operational telemetry depth guidelines.",
        "trend": f"Telemetry vector indicates water table is currently {trend.lower()}.",
        "recommended_actions": actions,
        "priority": priority,
        "data_confidence": context.get("confidence", "LOW"),
        "source": "RULE-BASED FALLBACK"
    }


async def generate_advisory(context: Dict[str, Any]) -> Dict[str, Any]:
    """Generates LLM advisory via Gemini with guaranteed deterministic fallback."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.info("GEMINI_API_KEY missing. Using deterministic rule-based advisory.")
        return generate_rule_based_advisory(context)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are a senior hydrological advisor for India's Central Ground Water Board (CGWB) Decision Support System.
Analyze the following validated telemetry record and produce a structured advisory.

STATION DATA:
- Station ID: {context.get('station_id')}
- District: {context.get('district')}, State: {context.get('state')}
- Latest Level: {context.get('latest_water_level')} m bgl
- Telemetry Risk Proxy: {context.get('telemetry_risk')}
- Statutory CGWB Status: {context.get('official_cgwb_status')}
- 30-Day Trend: {context.get('trend_direction')} (Slope: {context.get('slope_m_per_day')} m/day)
- Projected Level (30d): {context.get('projected_water_level')} m bgl
- Data Confidence: {context.get('confidence')}

REQUIREMENTS:
1. Ground every recommendation in verifiable hydrology practices.
2. Return ONLY valid JSON matching this schema:
{{
  "situation": "string",
  "risk_explanation": "string",
  "trend": "string",
  "recommended_actions": ["string", "string"],
  "priority": "LOW | NORMAL | HIGH | URGENT",
  "data_confidence": "HIGH | MEDIUM | LOW | INSUFFICIENT_DATA",
  "source": "AI-GENERATED"
}}
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )

        result = json.loads(response.text)
        result["source"] = "AI-GENERATED"
        return result

    except Exception as exc:
        logger.warning("Gemini Advisory generation failed (%s). Falling back to rule engine.", str(exc))
        return generate_rule_based_advisory(context)


# Also import legacy gemini_advisor helper if needed
try:
    from app.services.advisory.gemini_advisor import generate_station_advisory
except ImportError:
    pass

__all__ = ["generate_rule_based_advisory", "generate_advisory"]
