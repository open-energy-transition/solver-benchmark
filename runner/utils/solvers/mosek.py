"""MOSEK solver adapter: result-metric accessors."""

from typing import Any

# mosek is only installed in the mosek solver environment
try:
    import mosek as _mosek
except ModuleNotFoundError:
    _mosek = None


def is_mip(model: Any) -> bool:
    """Whether the model has any integer variables."""
    return model.getnumintvar() > 0


def duality_gap(model: Any) -> float | None:
    """MOSEK's own reported relative MIP gap, if the model is a MIP."""
    if is_mip(model):
        return model.getdouinf(_mosek.dinfitem.mio_obj_rel_gap)
    return None


def reported_runtime(model: Any) -> float:
    """MOSEK's own reported optimizer time."""
    return model.getdouinf(_mosek.dinfitem.optimizer_time)
