"""MOSEK solver adapter: result-metric accessors."""

from pathlib import Path
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


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer variables in MOSEK's integer solution.

    MOSEK has no separate binary type, so binaries are ``type_int`` too.
    Returns None if the model is a MIP but no integer solution is defined.
    """
    if not is_mip(model):
        return {}
    if not model.solutiondef(_mosek.soltype.itg):
        return None
    values = model.getxx(_mosek.soltype.itg)
    return {
        model.getvarname(j): values[j]
        for j in range(model.getnumvar())
        if model.getvartype(j) == _mosek.variabletype.type_int
    }
