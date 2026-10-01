"""Alert lines for failed runs, used by the cloud failure notifications.

On cloud VMs, everything the runner prints goes to Cloud Logging, where the
alert policy in `infrastructure/alerts/` emails its recipients whenever a line
contains `ALERT_MARKER`. Locally, the line is just part of the output.
"""

from __future__ import annotations

from typing import Any

ALERT_MARKER = "BENCHMARK_ALERT"

# Solver run statuses that trigger an alert: a timeout is an expected outcome,
# but an error or running out of memory usually means a bug or a misconfigured
# run worth looking into.
ALERT_STATUSES = {"ER", "OOM"}


def print_alert(status: str, **details: Any) -> None:
    """Print one alert line, e.g. `BENCHMARK_ALERT status=ER problem=... ...`.

    Parameters
    ----------
    status : str
        The failed run's status, e.g. ``"ER"`` or ``"OOM"``.
    **details : Any
        Context to include as ``key=value`` pairs, e.g. the problem, solver
        configuration, run ID and hostname.
    """
    fields = " ".join(f"{key}={value}" for key, value in details.items())
    print(f"{ALERT_MARKER} status={status} {fields}".rstrip(), flush=True)
