"""
Advisory layer - Tier 2 LLM-generated explanations and recommendations.

Uses Google Gemini to produce plain-language, station-specific advisories
based on classification data, forecast trends, and recent readings.

Design principle: a well-prompted single LLM call is far more reliable
in a time crunch than a complex multi-agent system.
"""

from datetime import datetime, timezone
from typing import Optional

from app.core.config import settings
from app.core.constants import RiskCategory
from app.models.station import Station
from app.services.forecasting.trend import compute_forecast
from app.schemas.station import AdvisoryResponse


SYSTEM_PROMPT = """You are JalDrishti, an expert groundwater advisory system for Indian 
groundwater monitoring stations. You produce clear, actionable advisories for 
government officials, district water managers, and gram panchayats.

Your advisories must:
1. Be specific to the station's actual numbers - never generic
2. Use plain language a district official can understand
3. Include a clear urgency level
4. Provide actionable recommendations (not just "monitor more")
5. Reference the CGWB risk classification framework
6. Be concise - one paragraph summary, one paragraph recommendation

Do NOT:
- Use technical jargon without explanation
- Give vague advice like "take appropriate measures"
- Hallucinate data - only reference the numbers provided
"""


def _fmt_depth(depth_m: Optional[float]) -> str:
    """Safely format depth value, returning 'N/A' for None."""
    if depth_m is None:
        return "N/A"
    return f"{depth_m:.1f}"


def _build_station_context(station: Station) -> str:
    """Build a structured context string for the LLM from station data."""
    forecast = compute_forecast(station)
    
    recent_readings = []
    if station.readings:
        sorted_readings = sorted(station.readings, key=lambda r: r.timestamp, reverse=True)
        for r in sorted_readings[:6]:
            recent_readings.append(f"  - {r.timestamp.strftime('%Y-%m-%d')}: {r.depth_below_ground_m:.2f}m bgl")

    depth_str = _fmt_depth(station.current_depth_m)
    classification_note = ""
    if hasattr(station, 'classification_method') and station.classification_method:
        if station.classification_method == "stage":
            classification_note = f" (based on Stage of Development: {station.stage_of_development:.1f}%)"
        else:
            classification_note = " (based on depth proxy - Stage of Development data unavailable)"

    context = f"""
STATION DATA:
- Station Code: {station.station_code}
- Name: {station.name}
- District: {station.district}, {station.state}
- Block: {station.block or 'N/A'}
- Aquifer Type: {station.aquifer_type or 'Not specified'}
- Well Depth: {station.well_depth_m or 'Not specified'}m

CURRENT STATUS:
- Latest Water Depth: {depth_str}m below ground level
- Risk Classification: {station.current_risk_category.value if station.current_risk_category else 'Unclassified'}{classification_note}
  (CGWB categories: Safe < 8m, Semi-Critical 8-15m, Critical 15-25m, Over-Exploited > 25m)

TREND ANALYSIS:
- Trend Direction: {forecast.trend_direction}
- Rate of Change: {forecast.rate_of_change_m_per_year} meters/year
- Data Points Used: {forecast.data_points_used}
- Confidence: {forecast.confidence}

FORECAST:
- Projected Next Risk Tier: {forecast.forecast_risk_category.value if forecast.forecast_risk_category else 'None (stable or already at worst)'}
- Months to Next Tier: {forecast.months_to_next_risk_tier or 'N/A'}

RECENT READINGS (newest first):
{chr(10).join(recent_readings) if recent_readings else '  No readings available'}
"""
    return context


async def generate_advisory(station: Station) -> AdvisoryResponse:
    """
    Generate an LLM-powered advisory for a station.
    
    Falls back to a structured template if the LLM is unavailable.
    """
    context = _build_station_context(station)
    
    # Determine urgency from risk category
    urgency_map = {
        RiskCategory.SAFE: "low",
        RiskCategory.SEMI_CRITICAL: "moderate",
        RiskCategory.CRITICAL: "high",
        RiskCategory.OVER_EXPLOITED: "critical",
    }
    urgency = urgency_map.get(station.current_risk_category, "moderate")
    
    if settings.GEMINI_API_KEY:
        try:
            return await _generate_with_gemini(station, context, urgency)
        except Exception as e:
            # Log error and fall back to template
            from loguru import logger
            logger.warning(f"Gemini advisory generation failed: {e}. Using template fallback.")
    
    return _generate_template_advisory(station, context, urgency)


async def _generate_with_gemini(
    station: Station, context: str, urgency: str
) -> AdvisoryResponse:
    """Generate advisory using Google Gemini."""
    from google import genai
    
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    user_prompt = f"""Based on the following station data, provide:
1. A SUMMARY: One paragraph describing the current groundwater situation at this station.
2. A RECOMMENDATION: One paragraph of specific, actionable steps for the local water authority.

Format your response as:
SUMMARY: <your summary>
RECOMMENDATION: <your recommendation>

{context}"""

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=user_prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=500,
        ),
    )
    
    text = response.text
    
    # Parse response
    summary = ""
    recommendation = ""
    
    if "SUMMARY:" in text and "RECOMMENDATION:" in text:
        parts = text.split("RECOMMENDATION:")
        summary = parts[0].replace("SUMMARY:", "").strip()
        recommendation = parts[1].strip()
    else:
        summary = text[:len(text)//2].strip()
        recommendation = text[len(text)//2:].strip()
    
    return AdvisoryResponse(
        station_id=station.id,
        station_code=station.station_code,
        risk_category=station.current_risk_category,
        summary=summary,
        recommendation=recommendation,
        urgency=urgency,
        advisory_source="gemini",
        generated_at=datetime.now(timezone.utc),
    )


def _generate_template_advisory(
    station: Station, context: str, urgency: str
) -> AdvisoryResponse:
    """Fallback template-based advisory when LLM is unavailable."""
    risk = station.current_risk_category or RiskCategory.SAFE
    depth = station.current_depth_m
    depth_str = _fmt_depth(depth)
    
    forecast = compute_forecast(station)
    
    if depth is None:
        summary = (
            f"Station {station.station_code} ({station.name}) in {station.district}, "
            f"{station.state} has no water depth readings recorded yet. "
            f"Classification and trend analysis are unavailable until telemetry data arrives."
        )
        recommendation = (
            "Verify that the DWLR sensor is operational and transmitting data. "
            "Check physical connectivity and ensure the station is included in the "
            "next scheduled data collection cycle."
        )
    elif risk == RiskCategory.OVER_EXPLOITED:
        summary = (
            f"Station {station.station_code} ({station.name}) in {station.district}, "
            f"{station.state} is classified as Over-Exploited with a current water depth "
            f"of {depth_str}m below ground level. The water table is {forecast.trend_direction} "
            f"at a rate of {abs(forecast.rate_of_change_m_per_year):.2f} meters per year. "
            f"Immediate intervention is required."
        )
        recommendation = (
            "Urgent: Restrict new borewell permits in this block. Implement mandatory "
            "rainwater harvesting for all new constructions. Initiate managed aquifer recharge "
            "(MAR) programs in the catchment area. Review existing extraction permits. "
            "Coordinate with the District Disaster Management Authority for contingency planning."
        )
    elif risk == RiskCategory.CRITICAL:
        summary = (
            f"Station {station.station_code} ({station.name}) in {station.district}, "
            f"{station.state} is classified as Critical with a water depth of {depth_str}m bgl. "
            f"The trend is {forecast.trend_direction} at {abs(forecast.rate_of_change_m_per_year):.2f}m/year."
        )
        if forecast.months_to_next_risk_tier:
            summary += (
                f" At this rate, the station is projected to reach Over-Exploited status "
                f"within approximately {forecast.months_to_next_risk_tier} months."
            )
        recommendation = (
            "Priority action: Tighten groundwater extraction regulations. Promote crop "
            "diversification away from water-intensive crops. Accelerate watershed development "
            "works. Install micro-irrigation systems. Begin monthly monitoring reviews."
        )
    elif risk == RiskCategory.SEMI_CRITICAL:
        summary = (
            f"Station {station.station_code} ({station.name}) in {station.district}, "
            f"{station.state} is Semi-Critical at {depth_str}m bgl. "
            f"Trend: {forecast.trend_direction} ({abs(forecast.rate_of_change_m_per_year):.2f}m/year)."
        )
        recommendation = (
            "Increase monitoring frequency. Promote awareness among farmers about sustainable "
            "extraction practices. Evaluate feasibility of artificial recharge structures. "
            "Consider seasonal restrictions during pre-monsoon months."
        )
    else:
        summary = (
            f"Station {station.station_code} ({station.name}) in {station.district}, "
            f"{station.state} is currently Safe at {depth_str}m bgl. "
            f"Trend: {forecast.trend_direction}."
        )
        recommendation = (
            "Maintain current monitoring schedule. Continue sustainable extraction practices. "
            "Document baseline conditions for future reference."
        )
    
    return AdvisoryResponse(
        station_id=station.id,
        station_code=station.station_code,
        risk_category=risk,
        summary=summary,
        recommendation=recommendation,
        urgency=urgency,
        advisory_source="template",
        generated_at=datetime.now(timezone.utc),
    )
