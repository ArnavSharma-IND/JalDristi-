"""
Celery application configuration for background task processing.

Tasks:
- Periodic reclassification of all stations
- Forecast recalculation
- Advisory cache invalidation
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "jaldrishti",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "reclassify-all-stations": {
            "task": "app.workers.tasks.reclassify_all_stations",
            "schedule": 3600.0,  # Every hour
        },
    },
)
