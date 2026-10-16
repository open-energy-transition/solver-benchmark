"""SCIP solver adapter: result-metric accessors."""

from pathlib import Path
from typing import Any


def is_mip(model: Any) -> bool:
    """Whether the original (not presolved) model has integer or binary variables."""
    return any(var.vtype() in ("INTEGER", "BINARY") for var in model.getVars())


def duality_gap(model: Any, log_fn: Path) -> float:
    """SCIP's own reported gap."""
    return model.getGap()


def reported_runtime(model: Any) -> float:
    """SCIP's own reported solving time."""
    return model.getSolvingTime()


def use_pyscipopt_4_compatible_model() -> None:
    """Let linopy read results from PySCIPOpt 4.x.

    Temporary workaround, to remove once linopy supports PySCIPOpt 4.x: see
    https://github.com/open-energy-transition/solver-benchmark/issues/622.

    After solving, linopy (as of 0.9.1) reads the original constraints with
    `Model.getConss(False)`, but PySCIPOpt 4.x (the last release for SCIP 8)
    only has `getConss()`, so every SCIP 8 run ended in an error. This swaps
    in a `Model` whose `getConss(False)` returns no constraints, so linopy
    skips the dual values, which the runner doesn't use. It does nothing if
    PySCIPOpt already accepts the argument.
    """
    import pyscipopt

    try:
        pyscipopt.Model().getConss(False)
        return
    except TypeError:
        pass

    class Pyscipopt4Model(pyscipopt.Model):
        def getConss(self, transformed: bool = True) -> list:
            # PySCIPOpt 4.x can't return the original constraints
            return super().getConss() if transformed else []

    # linopy looks up `pyscipopt.Model` when it builds the model
    pyscipopt.Model = Pyscipopt4Model


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
