"""Unit tests for the advisory engine."""

import pytest
from app.core.constants import RiskCategory
from app.services.advisory.gemini_advisor import _generate_template_advisory


class TestAdvisoryEngine:
    def test_advisory_with_null_depth(self, make_station):
        station = make_station(current_depth_m=None)
        station.current_risk_category = RiskCategory.SAFE
        advisory = _generate_template_advisory(station, context="", urgency="low")

        assert advisory is not None
        assert "no water depth readings" in advisory.summary
        assert "sensor is operational" in advisory.recommendation

    def test_advisory_over_exploited(self, make_station):
        station = make_station(current_depth_m=28.5)
        station.current_risk_category = RiskCategory.OVER_EXPLOITED
        advisory = _generate_template_advisory(station, context="", urgency="critical")

        assert advisory.risk_category == RiskCategory.OVER_EXPLOITED
        assert "Over-Exploited" in advisory.summary
        assert "Restrict new borewell permits" in advisory.recommendation

    def test_advisory_critical(self, make_station):
        station = make_station(current_depth_m=18.2)
        station.current_risk_category = RiskCategory.CRITICAL
        advisory = _generate_template_advisory(station, context="", urgency="high")

        assert advisory.risk_category == RiskCategory.CRITICAL
        assert "Critical" in advisory.summary
        assert "regulations" in advisory.recommendation.lower()

    def test_advisory_safe(self, make_station):
        station = make_station(current_depth_m=4.5)
        station.current_risk_category = RiskCategory.SAFE
        advisory = _generate_template_advisory(station, context="", urgency="low")

        assert advisory.risk_category == RiskCategory.SAFE
        assert "Safe" in advisory.summary
        assert "sustainable extraction" in advisory.recommendation
