"""Xpress solver adapter: result-metric accessors."""

from pathlib import Path
from typing import Any

# xpress is only installed in the Xpress solver environment
try:
    import xpress as _xpress
except ModuleNotFoundError:
    _xpress = None


def is_mip(model: Any) -> bool:
    """Whether the model has any MIP entities (integer/binary variables, SOS, etc.)."""
    return model.getAttrib("mipents") > 0


def mip_gap(model: Any, log_fn: Path) -> float | None:
    """Return Xpress's final relative MIP gap.

    Xpress exposes the incumbent objective and global best bound separately.
    Compute the relative gap from those values rather than returning a gap
    control/tolerance.
    """
    objective = model.getAttrib("mipobjval")
    bound = model.getAttrib("bestbound")

    if objective == 0:
        return 0.0 if bound == 0 else None

    return abs(objective - bound) / abs(objective)


def reported_runtime(model: Any) -> float:
    """Xpress's own reported solve time."""
    return model.getAttrib("time")


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in Xpress's MIP solution.

    Returns None if Xpress found no MIP solution.
    """
    if model.getAttrib("mipsols") == 0:
        return None
    variables = model.getVariable()
    return {
        var.name: value
        for var, value in zip(variables, model.getSolution())
        if var.vartype in (_xpress.integer, _xpress.binary)
    }
