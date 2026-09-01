"""Knitro solver adapter: result-metric accessors."""

from typing import Any


def is_mip(model: Any) -> bool:
    """Always False: Knitro is not designed for MILP problems."""
    return False


def duality_gap(model: Any) -> None:
    """Always None: Knitro duality gap retrieval not implemented yet."""
    return None


def reported_runtime(model: Any) -> float:
    """Knitro's own reported solve time."""
    return model.reported_runtime
