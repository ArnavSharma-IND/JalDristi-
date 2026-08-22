"""Shared test fixtures for unit tests."""

import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.core.constants import RiskCategory
from app.models.station import Station
from app.models.reading import WaterLevelReading


@pytest.fixture
def make_station():
    """Factory to create in-memory Station instances for testing."""
    def _factory(
        station_code: str = "TEST001",
        name: str = "Test Station",
        district: str = "Mehsana",
        state: str = "Gujarat",
        current_depth_m: float = None,
        stage_of_development: float = None,
        readings_data: list = None,
    ) -> Station:
        st = Station(
            id=uuid4(),
            station_code=station_code,
            name=name,
            latitude=23.5,
            longitude=72.3,
            district=district,
            state=state,
            block="Mehsana",
            current_depth_m=current_depth_m,
            stage_of_development=stage_of_development,
            current_risk_category=None,
        )
        st.readings = []
        if readings_data:
            for item in readings_data:
                ts = item.get("timestamp")
                if isinstance(ts, str):
                    ts = datetime.fromisoformat(ts)
                st.readings.append(
                    WaterLevelReading(
                        id=uuid4(),
                        station_id=st.id,
                        timestamp=ts,
                        depth_below_ground_m=item["depth"],
                        quality_flag=item.get("quality_flag", "valid"),
                    )
                )
        return st
    return _factory
