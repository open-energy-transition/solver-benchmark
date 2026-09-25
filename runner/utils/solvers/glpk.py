"""GLPK solver adapter: result-metric accessors.

GLPK doesn't return a solver model, so MIP detection and duality gap
retrieval aren't possible.
"""

from typing import Any

# TODO preprocess problems and add this info to metadata


def is_mip(model: Any) -> bool:
    """Always False: GLPK doesn't expose enough info to tell."""
    return False


def duality_gap(model: Any) -> float | None:
    """Always None: GLPK doesn't expose a duality gap from Python."""
    return None


def reported_runtime(model: Any) -> float | None:
    """Always None: GLPK doesn't return a solver model to read a runtime from."""
    return None
