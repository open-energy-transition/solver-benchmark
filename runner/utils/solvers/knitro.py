"""Knitro solver adapter: result-metric accessors.

`model` is linopy's `KnitroResult` summary, not a live Knitro context
(linopy frees that before returning), so only the fields it copies out are
available.
"""

from pathlib import Path
from typing import Any


def is_mip(model: Any) -> bool | None:
    """Whether the model has integer variables, or None if not reported."""
    n_integer_vars = getattr(model, "n_integer_vars", None)
    return None if n_integer_vars is None else n_integer_vars > 0


def duality_gap(model: Any, log_fn: Path) -> float | None:
    """Knitro's own reported relative MIP gap, if present."""
    return getattr(model, "mip_rel_gap", None)


def reported_runtime(model: Any) -> float:
    """Knitro's own reported solve time."""
    return model.reported_runtime


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Always None: linopy's `KnitroResult` carries no variable values."""
    return None
