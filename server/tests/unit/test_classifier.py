"""Unit tests for the classification engine."""

import pytest

from app.core.constants import RiskCategory
from app.services.classification.classifier import classify_by_depth, classify_by_stage


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
