"""SCIP solver adapter: result-metric accessors."""

import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any

# pyscipopt is only installed in the SCIP and tests solver environments
try:
    import pyscipopt as _pyscipopt
except ModuleNotFoundError:
    _pyscipopt = None


def solver_version() -> str:
    """Return the version of the SCIP library this env loads.

    PySCIPOpt's `Model.version()` only gives major.minor, so this reads the
    full version from the banner `printVersion` writes to stdout from C.
    """
    sys.stdout.flush()
    with tempfile.TemporaryFile(mode="w+") as banner:
        stdout_fd = os.dup(1)
        os.dup2(banner.fileno(), 1)
        try:
            _pyscipopt.Model().printVersion()
        finally:
            sys.stdout.flush()
            os.dup2(stdout_fd, 1)
            os.close(stdout_fd)
        banner.seek(0)
        return re.search(r"SCIP version (\S+)", banner.read()).group(1)


def is_mip(model: Any) -> bool:
    """Whether the original (not presolved) model has integer or binary variables."""
    return any(var.vtype() in ("INTEGER", "BINARY") for var in model.getVars())


def duality_gap(model: Any, log_fn: Path) -> float:
    """SCIP's own reported gap."""
    return model.getGap()


def reported_runtime(model: Any) -> float:
    """SCIP's own reported solving time."""
    return model.getSolvingTime()


def integer_values(
    model: Any, problem_fn: Path, solution_fn: Path
) -> dict[str, float] | None:
    """Values of the integer and binary variables in SCIP's best solution.

    Returns None if SCIP found no feasible solution.
    """
    if model.getNSols() == 0:
        return None
    solution = model.getBestSol()
    return {
        var.name: model.getSolVal(solution, var)
        for var in model.getVars()
        if var.vtype() in ("INTEGER", "BINARY")
    }
