"""CPLEX solver adapter: result-metric accessors."""

from typing import Any


def is_mip(model: Any) -> bool:
    """Whether any variable is integer or binary."""
    return any(t in ("I", "B") for t in model.variables.get_types())


def duality_gap(model: Any) -> float:
    """CPLEX's own reported relative MIP gap."""
    return model.solution.MIP.get_mip_relative_gap()


def reported_runtime(model: Any) -> None:
    """Always None.

    Cplex.get_time() returns an absolute time stamp, not an elapsed
    duration -- it's only meaningful as the difference between two calls
    taken before and after an operation, and linopy gives us the Cplex
    object only after solve() has already returned, with no "before"
    reading to diff against. No released linopy version populates a real
    CPLEX solve time either (PyPSA/linopy#583, #636, #682). Revisit once
    linopy exposes one.
    """
    return None
