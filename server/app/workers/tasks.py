"""Background tasks for station processing."""

from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.reclassify_all_stations")
def reclassify_all_stations():
    """
    Recalculate risk classification for all stations.
    
    Runs periodically to keep classifications up-to-date
    as new readings arrive.
    """
    # TODO: Implement with sync database session
    # 1. Fetch all stations with their latest reading
    # 2. Run classification on each
    # 3. Update station.current_risk_category
    # 4. Run forecast on reclassified stations
    # 5. Cache results in Redis
    pass


@celery_app.task(name="app.workers.tasks.process_new_readings")
def process_new_readings(station_id: str):
    """
    Process newly ingested readings for a specific station.
    
    Triggered when new data arrives for a station:
    1. Validate readings
    2. Reclassify station
    3. Recalculate forecast
    4. Invalidate advisory cache
    """
    # TODO: Implement
    pass
