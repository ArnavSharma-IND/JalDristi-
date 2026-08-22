"""
JalDrishti — FastAPI Application Entry Point
Telemetry-Driven Hydrogeological Intelligence for SIH25068.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.routers import stations, provenance, export, import_data, chat, live
from app.api.routes import districts, classification, alerts
from app.core.config import settings

app = FastAPI(
    title="JalDrishti Groundwater Decision Support System API",
    description="Telemetry-Driven Hydrogeological Intelligence for SIH25068",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Root & Utility Endpoints ──────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "service": "JalDrishti Groundwater Decision Support System API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/api/docs",
        "redoc": "/api/redoc",
        "openapi": "/api/openapi.json",
        "health": "/api/v1/health",
    }


@app.get("/docs", include_in_schema=False)
def redirect_docs():
    return RedirectResponse(url="/api/docs")


@app.get("/redoc", include_in_schema=False)
def redirect_redoc():
    return RedirectResponse(url="/api/redoc")


# ── Mount Routers under /api/v1 ───────────────────────────────────────────────
app.include_router(stations.router, prefix="/api/v1")
app.include_router(provenance.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(import_data.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(districts.router, prefix="/api/v1", tags=["Districts"])
app.include_router(classification.router, prefix="/api/v1", tags=["Classification"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])

# Also mount direct & live WebSocket
app.include_router(stations.router)
app.include_router(provenance.router)
app.include_router(export.router)
app.include_router(import_data.router)
app.include_router(chat.router)
app.include_router(live.router)


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {"status": "HEALTHY", "service": "JalDrishti Backend Core"}
