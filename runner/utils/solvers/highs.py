"""HiGHS solver adapter: result-metric accessors.

HiGHS's HiPO/IPX algorithm configurations are handled generically -- see
``runner/config/solver_configurations.yaml`` and
`config.get_solver_configuration` -- not by anything in this module. Every
configuration that runs through HiGHS (plain "highs", "highs-hipo",
"highs-ipm", ...) shares these same result-metric accessors.
"""

from typing import Any


def is_mip(model: Any) -> bool:
    """Whether HiGHS solved the model as a MIP.

    `mip_node_count` is -1 for a pure LP solve and >= 0 for a MIP solve.
    """
    return model.getInfo().mip_node_count >= 0


def duality_gap(model: Any) -> float | None:
    """HiGHS's own reported MIP gap, if present."""
    return getattr(model.getInfo(), "mip_gap", None)


def reported_runtime(model: Any) -> float:
    """HiGHS's own reported solve time."""
    return model.getRunTime()
