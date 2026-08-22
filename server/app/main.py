"""
JalDrishti — FastAPI Application Entry Point

Real-time Groundwater Resource Evaluation using DWLR Data.
Ministry of Jal Shakti | SIH 2025 - Problem Statement 068
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import stations, districts, health, advisory, provenance, classification, alerts
from app.db.session import engine
from app.models import base  # noqa: F401 — registers models with SQLAlchemy


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: create tables (dev only — use Alembic in production)
    if settings.APP_ENV == "development":
        async with engine.begin() as conn:
            from app.models.base import Base
            await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: dispose engine
    await engine.dispose()


app = FastAPI(
    title="JalDrishti API",
    description=(
        "Real-time groundwater resource evaluation and forecasting. "
        "Classifies DWLR monitoring stations into CGWB risk categories "
        "and projects trend-based risk transitions."
    ),
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(provenance.router, prefix="/api/v1", tags=["Data Provenance"])
app.include_router(stations.router, prefix="/api/v1", tags=["Stations"])
app.include_router(classification.router, prefix="/api/v1", tags=["Classification"])
app.include_router(districts.router, prefix="/api/v1", tags=["Districts"])
app.include_router(advisory.router, prefix="/api/v1", tags=["Advisory"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
