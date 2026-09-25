"""Knitro solver adapter: result-metric accessors."""

from pathlib import Path
from typing import Any


def is_mip(model: Any) -> bool:
    """Always False: Knitro is not designed for MILP problems."""
    return False


def duality_gap(model: Any, log_fn: Path) -> None:
    """Always None: Knitro duality gap retrieval not implemented yet."""
    return None


def reported_runtime(model: Any) -> float:
    """Knitro's own reported solve time."""
    return model.reported_runtime


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Always None: linopy's Knitro result object carries no variable values."""
    return None
