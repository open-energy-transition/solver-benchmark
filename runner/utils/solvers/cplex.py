"""CPLEX solver adapter: result-metric accessors."""

from pathlib import Path
from typing import Any


def is_mip(model: Any) -> bool:
    """Whether any variable is integer or binary."""
    return any(t in ("I", "B") for t in model.variables.get_types())


def duality_gap(model: Any, log_fn: Path) -> float:
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


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in CPLEX's solution.

    Returns None if CPLEX has no primal feasible solution.
    """
    if not model.solution.is_primal_feasible():
        return None
    return {
        name: value
        for name, value, var_type in zip(
            model.variables.get_names(),
            model.solution.get_values(),
            model.variables.get_types(),
        )
        if var_type in ("I", "B")
    }
