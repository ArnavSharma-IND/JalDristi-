import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import get_sync_db as get_db
from app.models.station import Station, RiskLevel, TelemetryReading

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str


@router.post("")
async def ask_jaldrishti(request: ChatRequest, db: Session = Depends(get_db)):
    """Natural Language Interface for the DWLR Database."""
    api_key = os.getenv("GEMINI_API_KEY")

    # Gather live DB context to ground the AI (No hallucinations)
    total_stations = db.query(Station).filter(Station.is_active == True).count()
    critical = db.query(Station).filter(
        Station.is_active == True,
        Station.telemetry_risk_indicator.in_([RiskLevel.CRITICAL, RiskLevel.OVER_EXPLOITED])
    ).all()
    all_stations = db.query(Station).filter(Station.is_active == True).all()

    station_summaries = []
    for s in all_stations:
        latest = db.query(TelemetryReading).filter(TelemetryReading.station_id == s.id).order_by(TelemetryReading.timestamp.desc()).first()
        level_str = f"{latest.water_level_m_bgl:.2f}m bgl" if latest and latest.water_level_m_bgl is not None else "No data"
        risk_str = s.telemetry_risk_indicator.value if hasattr(s.telemetry_risk_indicator, "value") else str(s.telemetry_risk_indicator)
        cgwb_str = s.official_cgwb_status.value if hasattr(s.official_cgwb_status, "value") else str(s.official_cgwb_status)
        station_summaries.append(f"- {s.station_id} ({s.name}, {s.district}, {s.state}): Depth {level_str}, Telemetry Risk: {risk_str}, CGWB Benchmark: {cgwb_str}")

    stations_list_text = "\n".join(station_summaries)

    context_summary = f"""
Current System State:
- Total Monitored DWLR Stations: {total_stations}
- Critical / Over-Exploited Stations Count: {len(critical)}
- Active Stations Inventory:
{stations_list_text}
"""

    if not api_key:
        # Grounded rule-based response when GEMINI_API_KEY is not set
        q = request.message.lower()
        if "critical" in q or "over-exploited" in q or "risk" in q:
            crit_names = [f"{s.name} in {s.district} ({s.state})" for s in critical]
            if crit_names:
                return {
                    "reply": f"Currently, {len(critical)} stations are in critical/over-exploited operational risk: {', '.join(crit_names)}. Recommend immediate abstraction monitoring."
                }
            else:
                return {"reply": "All currently monitored stations are operating within safe and semi-critical limits."}
        elif "punjab" in q:
            pb = [s for s in all_stations if "punjab" in s.state.lower() or "patiala" in s.district.lower()]
            return {"reply": f"Found {len(pb)} station(s) in Punjab: {', '.join([f'{s.name} (Risk: {s.telemetry_risk_indicator.value if hasattr(s.telemetry_risk_indicator, 'value') else s.telemetry_risk_indicator})' for s in pb])}."}
        elif "total" in q or "how many" in q or "stations" in q:
            return {"reply": f"JalDrishti is currently monitoring {total_stations} active DWLR stations across the network, with {len(critical)} flagged for critical review."}
        else:
            return {
                "reply": f"JalDrishti Knowledge Core: Monitoring {total_stations} stations. {len(critical)} are in Critical/Over-Exploited status ({', '.join([s.district for s in critical])}). Ask me about specific states, critical levels, or station statistics."
            }

    prompt = f"""
You are the JalDrishti AI, a professional hydrological assistant for India's Central Ground Water Board (CGWB) Decision Support System.
Use the following live database context to answer the official's question accurately. Be concise, authoritative, and do not invent or fabricate data.

SYSTEM CONTEXT:
{context_summary}

OFFICIAL'S QUERY:
{request.message}
"""

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {"reply": response.text}
    except Exception as e:
        return {
            "reply": f"JalDrishti Core: System monitoring {total_stations} stations ({len(critical)} Critical/Over-Exploited: {', '.join([s.name for s in critical])}). Network query limit reached; metrics remain live on your dashboard."
        }
