"""
Database session and Base bridge module.
Provides compatibility for both sync and async SQLAlchemy operations.
"""

from app.models.base import Base
from app.db.session import engine, async_session_factory, get_db

# Also provide sync engine / session for sync endpoints if needed
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Construct sync URL for standard Session if used
sync_db_url = settings.database_url
if "postgresql+asyncpg://" in sync_db_url:
    sync_db_url = sync_db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
elif "sqlite+aiosqlite://" in sync_db_url:
    sync_db_url = sync_db_url.replace("sqlite+aiosqlite://", "sqlite://")

sync_engine = create_engine(
    sync_db_url,
    connect_args={"check_same_thread": False} if "sqlite" in sync_db_url else {},
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


def get_sync_db():
    """Yield a synchronous DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = ["Base", "engine", "async_session_factory", "get_db", "get_sync_db", "SessionLocal", "sync_engine"]
