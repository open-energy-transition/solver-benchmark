"""SCIP solver adapter: result-metric accessors."""

from typing import Any


def is_mip(model: Any) -> bool:
    """Whether the model has any integer or binary variables."""
    return model.getNIntVars() > 0 or model.getNBinVars() > 0


def duality_gap(model: Any) -> float:
    """SCIP's own reported gap."""
    return model.getGap()


def reported_runtime(model: Any) -> float:
    """SCIP's own reported solving time."""
    return model.getSolvingTime()
