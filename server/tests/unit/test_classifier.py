"""Unit tests for the classification engine."""

import pytest
from app.core.constants import RiskCategory
from app.services.classification.classifier import (
    classify_by_depth,
    classify_by_stage,
    classify_station,
)


class TestClassifyByDepth:
    def test_safe_shallow(self):
        assert classify_by_depth(3.0) == RiskCategory.SAFE

    def test_safe_boundary(self):
        assert classify_by_depth(7.9) == RiskCategory.SAFE

    def test_semi_critical(self):
        assert classify_by_depth(10.0) == RiskCategory.SEMI_CRITICAL

    def test_critical(self):
        assert classify_by_depth(20.0) == RiskCategory.CRITICAL

    def test_over_exploited(self):
        assert classify_by_depth(30.0) == RiskCategory.OVER_EXPLOITED

    def test_over_exploited_extreme(self):
        assert classify_by_depth(100.0) == RiskCategory.OVER_EXPLOITED

    def test_zero_depth(self):
        assert classify_by_depth(0.0) == RiskCategory.SAFE


class TestClassifyByStage:
    def test_safe(self):
        assert classify_by_stage(50.0) == RiskCategory.SAFE

    def test_semi_critical(self):
        assert classify_by_stage(80.0) == RiskCategory.SEMI_CRITICAL

    def test_critical(self):
        assert classify_by_stage(95.0) == RiskCategory.CRITICAL

    def test_over_exploited(self):
        assert classify_by_stage(120.0) == RiskCategory.OVER_EXPLOITED


class TestClassifyStation:
    def test_classify_with_stage_of_development(self, make_station):
        # Stage is available -> takes precedence
        station = make_station(
            stage_of_development=115.0,
            current_depth_m=5.0, # Would be safe by depth, but OE by stage
        )
        category, method = classify_station(station)
        assert category == RiskCategory.OVER_EXPLOITED
        assert method == "stage"

    def test_classify_with_current_depth(self, make_station):
        station = make_station(
            stage_of_development=None,
            current_depth_m=18.5,
        )
        category, method = classify_station(station)
        assert category == RiskCategory.CRITICAL
        assert method == "depth_proxy"

    def test_classify_with_readings_fallback(self, make_station):
        from datetime import datetime, timezone
        station = make_station(
            stage_of_development=None,
            current_depth_m=None,
            readings_data=[
                {"timestamp": datetime(2025, 1, 1, tzinfo=timezone.utc), "depth": 6.0},
                {"timestamp": datetime(2025, 6, 1, tzinfo=timezone.utc), "depth": 28.0},
            ],
        )
        category, method = classify_station(station)
        assert category == RiskCategory.OVER_EXPLOITED
        assert method == "depth_proxy"

    def test_classify_empty_station(self, make_station):
        station = make_station(
            stage_of_development=None,
            current_depth_m=None,
            readings_data=[],
        )
        category, method = classify_station(station)
        assert category == RiskCategory.SAFE
        assert method == "depth_proxy"
