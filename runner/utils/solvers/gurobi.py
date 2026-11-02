"""Gurobi solver adapter: result-metric accessors."""

from pathlib import Path
from typing import Any

# gurobipy is only installed in the Gurobi solver environments
try:
    import gurobipy as _gurobipy
except ModuleNotFoundError:
    _gurobipy = None


def solver_version() -> str:
    """Return the version of the Gurobi library this env loads."""
    return ".".join(str(part) for part in _gurobipy.gurobi.version())


def is_mip(model: Any) -> bool:
    """Whether Gurobi classified the model as a MIP."""
    return model.IsMIP


def duality_gap(model: Any, log_fn: Path) -> float:
    """Gurobi's own reported MIP gap."""
    return model.MIPGap


def reported_runtime(model: Any) -> float:
    """Gurobi's own reported solve time."""
    return model.Runtime


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in Gurobi's best solution.

    Returns None if Gurobi found no feasible solution.
    """
    if model.SolCount == 0:
        return None
    integer_vars = [v for v in model.getVars() if v.VType in ("I", "B")]
    return dict(
        zip(
            model.getAttr("VarName", integer_vars),
            model.getAttr("X", integer_vars),
            strict=True,
        )
    )
