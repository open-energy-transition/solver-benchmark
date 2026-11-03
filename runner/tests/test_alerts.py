"""Tests for runner/utils/alerts.py: the alert lines the cloud failure
notifications look for.
"""

from runner.utils import alerts


def test_alert_line_has_the_marker_status_and_details(capsys):
    alerts.print_alert("OOM", problem="p", solver="highs-default")
    assert (
        capsys.readouterr().out.strip()
        == "BENCHMARK_ALERT status=OOM problem=p solver=highs-default"
    )


def test_timeouts_dont_alert():
    assert "TO" not in alerts.ALERT_STATUSES
    assert {"ER", "OOM"} <= alerts.ALERT_STATUSES
