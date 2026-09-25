"""HiGHS solver adapter: result-metric accessors.

HiGHS's HiPO/IPX algorithm configurations are handled generically -- see
``runner/config/solver_configurations.yaml`` and
`config.get_solver_configuration` -- not by anything in this module. Every
configuration that runs through HiGHS ("highs-default", "highs-hipo",
"highs-ipm", ...) shares these same result-metric accessors.
"""

from pathlib import Path
from typing import Any

# highspy is only installed in the HiGHS, CBC and tests solver environments
try:
    import highspy as _highspy
except ModuleNotFoundError:
    _highspy = None


def is_mip(model: Any) -> bool:
    """Whether HiGHS solved the model as a MIP.

    `mip_node_count` is -1 for a pure LP solve and >= 0 for a MIP solve.
    """
    return model.getInfo().mip_node_count >= 0


def duality_gap(model: Any, log_fn: Path) -> float | None:
    """HiGHS's own reported MIP gap, if present."""
    return getattr(model.getInfo(), "mip_gap", None)


def reported_runtime(model: Any) -> float:
    """HiGHS's own reported solve time."""
    return model.getRunTime()


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in HiGHS's solution.

    HiGHS has no separate binary type, so binaries are ``kInteger`` too.
    Returns None if HiGHS has no valid primal solution.
    """
    solution = model.getSolution()
    if not solution.value_valid:
        return None
    lp = model.getLp()
    return {
        name: value
        for name, value, var_type in zip(
            lp.col_names_, solution.col_value, lp.integrality_
        )
        if var_type == _highspy.HighsVarType.kInteger
    }
