"""Gurobi solver adapter: result-metric accessors."""

from typing import Any


def is_mip(model: Any) -> bool:
    """Whether Gurobi classified the model as a MIP."""
    return model.IsMIP


def duality_gap(model: Any) -> float:
    """Gurobi's own reported MIP gap."""
    return model.MIPGap


def reported_runtime(model: Any) -> float:
    """Gurobi's own reported solve time."""
    return model.Runtime
