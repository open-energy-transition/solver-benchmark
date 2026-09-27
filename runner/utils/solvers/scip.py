"""SCIP solver adapter: result-metric accessors."""

from pathlib import Path
from typing import Any


def is_mip(model: Any) -> bool:
    """Whether the original (not presolved) model has integer or binary variables."""
    return any(var.vtype() in ("INTEGER", "BINARY") for var in model.getVars())


def duality_gap(model: Any, log_fn: Path) -> float:
    """SCIP's own reported gap."""
    return model.getGap()


def reported_runtime(model: Any) -> float:
    """SCIP's own reported solving time."""
    return model.getSolvingTime()


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in SCIP's best solution.

    Returns None if SCIP found no feasible solution.
    """
    if model.getNSols() == 0:
        return None
    solution = model.getBestSol()
    return {
        var.name: model.getSolVal(solution, var)
        for var in model.getVars()
        if var.vtype() in ("INTEGER", "BINARY")
    }
