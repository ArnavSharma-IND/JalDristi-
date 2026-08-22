"""Unit tests for the trend forecasting engine."""

import pytest
from datetime import datetime, timedelta, timezone

from app.core.constants import RiskCategory
from app.services.forecasting.trend import compute_forecast


class TestComputeForecast:
    def test_insufficient_data(self, make_station):
        # Fewer than MIN_DATA_POINTS_FOR_TREND (6)
        station = make_station(
            readings_data=[
                {"timestamp": datetime(2025, 1, 1, tzinfo=timezone.utc), "depth": 10.0},
                {"timestamp": datetime(2025, 2, 1, tzinfo=timezone.utc), "depth": 11.0},
            ]
        )
        forecast = compute_forecast(station)
        assert forecast.confidence == "low"
        assert forecast.trend_direction == "stable"
        assert len(forecast.forecast_points) == 0
        assert forecast.data_points_used == 2

    def test_declining_trend_calculation(self, make_station):
        # Depth increasing over 18 months (water table dropping)
        base_date = datetime(2024, 1, 1, tzinfo=timezone.utc)
        readings = [
            {"timestamp": base_date + timedelta(days=i * 30), "depth": 5.0 + (i * 0.5)}
            for i in range(18)
        ]
        station = make_station(current_depth_m=13.5, readings_data=readings)
        forecast = compute_forecast(station)

        assert forecast.trend_direction == "declining"
        assert forecast.rate_of_change_m_per_year > 0
        assert forecast.confidence == "high" # 18 months, perfect linear fit
        assert len(forecast.forecast_points) == 24
        assert forecast.data_points_used == 18

    def test_recovering_trend_calculation(self, make_station):
        # Depth decreasing over 15 months (water table rising)
        base_date = datetime(2024, 1, 1, tzinfo=timezone.utc)
        readings = [
            {"timestamp": base_date + timedelta(days=i * 30), "depth": 25.0 - (i * 0.4)}
            for i in range(15)
        ]
        station = make_station(current_depth_m=19.4, readings_data=readings)
        forecast = compute_forecast(station)

        assert forecast.trend_direction == "recovering"
        assert forecast.rate_of_change_m_per_year < 0
        assert forecast.confidence in ("high", "moderate")

    def test_dense_readings_short_timespan_gives_low_confidence(self, make_station):
        # 30 readings crammed into only 10 days
        base_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
        readings = [
            {"timestamp": base_date + timedelta(hours=i * 8), "depth": 10.0 + (i * 0.05)}
            for i in range(30)
        ]
        station = make_station(current_depth_m=11.5, readings_data=readings)
        forecast = compute_forecast(station)

        # Even with 30 data points, date span is < 1 month -> confidence MUST be low
        assert forecast.confidence == "low"
