"""Solver adapter registry: one plain Python module per solver, discovered
automatically from this package's own directory.

Each sibling module exports `is_mip(model)`, `duality_gap(model)`, and
`reported_runtime(model)` for one solver (any existing module is a template).
`SOLVER_ADAPTERS` is built by scanning this package's directory with
`pkgutil.iter_modules` and importing each submodule -- a well-established
stdlib idiom for exactly this "one adapter per plugin file" shape (the same
one Django/pytest use for command/plugin discovery), scoped to just this
directory, not an arbitrary path. Adding a solver with linopy support already
means: write a new module here, and add its tuning options to
``runner/config/solver_configurations.yaml`` -- nothing here, and nothing in
`runner/utils/solver.py`'s `get_solver`/`is_mip_problem`/`get_duality_gap`/
`get_reported_runtime`, needs to change.
"""

import importlib
import pkgutil
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

_REQUIRED_ATTRS = ("is_mip", "duality_gap", "reported_runtime")


@dataclass(frozen=True)
class SolverAdapter:
    """A solver's behavior beyond linopy's own `Solver` class.

    Attributes
    ----------
    is_mip : Callable[[Any], bool]
        Given the solver's native model object, return whether the problem
        it solved was a MIP.
    duality_gap : Callable[[Any], float | None]
        Given the native model object, return the reported duality/MIP gap,
        or None if unavailable.
    reported_runtime : Callable[[Any], float | None]
        Given the native model object, return the solver's own reported
        solving time in seconds, or None if unavailable.
    """

    is_mip: Callable[[Any], bool]
    duality_gap: Callable[[Any], float | None]
    reported_runtime: Callable[[Any], float | None]


def _discover_adapters() -> dict[str, SolverAdapter]:
    """Import every sibling module in this package and wrap it as a SolverAdapter.

    Returns
    -------
    dict[str, SolverAdapter]
        Solver name (the module's own name) to its adapter.

    Raises
    ------
    AttributeError
        If a discovered module is missing one of `is_mip`, `duality_gap`, or
        `reported_runtime` -- fails at import time with a clear message,
        rather than a cryptic error deep in a benchmark run.
    """
    adapters = {}
    for module_info in pkgutil.iter_modules(__path__):
        module = importlib.import_module(f".{module_info.name}", __name__)
        missing = [a for a in _REQUIRED_ATTRS if not hasattr(module, a)]
        if missing:
            raise AttributeError(
                f"Solver adapter module '{module_info.name}' is missing "
                f"required function(s): {', '.join(missing)}"
            )
        adapters[module_info.name] = SolverAdapter(
            *(getattr(module, a) for a in _REQUIRED_ATTRS)
        )
    return adapters


SOLVER_ADAPTERS: dict[str, SolverAdapter] = _discover_adapters()
