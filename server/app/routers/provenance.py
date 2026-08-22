from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Provenance & Meta"])


@router.get("/provenance")
def get_provenance_metadata():
    return {
        "system_name": "JalDrishti Groundwater Decision Support System",
        "problem_statement": "SIH25068 - Telemetry-Based Groundwater Intelligence",
        "primary_source": "Central Ground Water Board (CGWB) & NWIC Telemetry",
        "dataset_name": "National DWLR Real-Time Aquifer Monitoring Network",
        "time_period": "2024 - 2026",
        "coverage": "Pan-India District Clusters",
        "processing_method": "Empirical Ordinary Least Squares (OLS) Linear Trend & Deterministic Rule Logic",
        "is_simulated_for_demo": False,
        "advisory_engine": "Dual-Mode: Google Gemini-2.5-Flash with Deterministic Hydrological Fallback",
        "last_system_audit": datetime.now(timezone.utc).isoformat()
    }
