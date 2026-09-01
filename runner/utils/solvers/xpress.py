"""Xpress solver adapter: result-metric accessors."""

from typing import Any


def is_mip(model: Any) -> bool:
    """Whether the model has any MIP entities (integer/binary variables, SOS, etc.)."""
    return model.getAttrib("mipents") > 0


def duality_gap(model: Any) -> float:
    """The relative MIP gap tolerance Xpress was configured with."""
    return model.controls.miprelgapnotify


def reported_runtime(model: Any) -> float:
    """Xpress's own reported solve time."""
    return model.getAttrib("time")
