"""CBC solver adapter: result-metric accessors.

CBC doesn't return a solver model, so MIP detection isn't possible.
"""

from typing import Any

# TODO preprocess problems and add this info to metadata


def is_mip(model: Any) -> bool:
    """Always False: CBC doesn't expose enough info to tell."""
    return False


def duality_gap(model: Any) -> float | None:
    """CBC's reported MIP gap, if present on the result object."""
    return getattr(model, "mip_gap", None)


def reported_runtime(model: Any) -> float:
    """CBC's own reported solve time."""
    return model.runtime
