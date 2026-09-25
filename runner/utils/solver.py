"""Solver dispatch: build a tuned linopy solver, and read MIP/duality-gap/
runtime metrics back off its result.

Each solver's behavior lives in its own module under `runner/utils/solvers/`
(see that package's docstring). Each named way of running a solver --
including algorithm-specific configurations like HiGHS's HiPO/IPX -- is
config-driven via ``runner/config/solver_configurations.yaml`` (see
`config.get_solver_configuration`). Nothing here is specific to any one
solver.

Keeps the `if __name__ == "__main__"` entrypoint so a single solver run can
still be driven directly, e.g. for debugging:
    python -m runner.utils.solver <solver_configuration> <input_file> <solver_version>
"""

import json
import sys
from pathlib import Path
from time import perf_counter
from traceback import format_exc
from typing import Any

import numpy as np
from linopy import solvers

# _names_to_labels is private API: it's the exact name->label parsing linopy
# itself uses to build Solution.primal (see get_milp_metrics's docstring for
# why this matters), so it's more correct to reuse than to re-derive our own
# guess at linopy's "x<label>" naming convention -- but it's not a public
# contract, so a future linopy release could rename or remove it.
from linopy.solvers import SolverName, _names_to_labels

from . import config
from .solvers import SOLVER_ADAPTERS

# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None


def get_solver(solver_configuration: str) -> tuple[Any, str]:
    """Build a linopy solver instance with this project's tuning options.

    Parameters
    ----------
    solver_configuration : str
        The configuration to run, as requested by a caller (e.g. ``"highs-hipo"``).

    Returns
    -------
    tuple[Any, str]
        `(solver_instance, solver_package)`. `solver_package` is the real
        solver package to use for reading result metrics afterward (e.g.
        ``"highs"`` for the configuration ``"highs-hipo"``), since a named
        configuration shares its solver's model API.
    """
    configuration = config.get_solver_configuration(solver_configuration)
    if configuration is not None:
        solver_package, kwargs = (
            configuration["solver_package"],
            configuration["options"],
        )
    else:
        solver_package = solver_configuration.lower()
        kwargs = {}

    solver_enum = SolverName(solver_package)
    solver_class = getattr(solvers, solver_enum.name)
    return solver_class(options=kwargs), solver_package


def is_mip_problem(solver_model: Any, solver_package: str) -> bool:
    """Determine whether a solved model was a Mixed Integer Programming problem.

    Parameters
    ----------
    solver_model : Any
        The solver's native model object (`solver_result.solver_model`), or
        None if unavailable.
    solver_package : str
        The underlying solver package, e.g. ``"highs"``.

    Returns
    -------
    bool
        True if the problem had integer/binary variables, per the solver's
        own reporting.

    Raises
    ------
    NotImplementedError
        If `solver_package` has no registered adapter.
    """
    if solver_model is None:
        return False
    adapter = SOLVER_ADAPTERS.get(solver_package)
    if adapter is None:
        raise NotImplementedError(f"The solver '{solver_package}' is not supported.")
    return adapter.is_mip(solver_model)


def calculate_integrality_violation(
    integer_var_labels: np.ndarray, primal_values: np.ndarray
) -> float:
    """Calculate the maximum integrality violation from primal values.

    Only Integer vars are considered, not SemiContinuous or SemiInteger,
    following the code in
    https://github.com/ERGO-Code/HiGHS/blob/fd8665394edfd096c4f847c4a6fbc187364ef474/src/mip/HighsMipSolver.cpp#L888

    Parameters
    ----------
    integer_var_labels : np.ndarray
        Linopy labels of the model's integer variables (see
        `get_milp_metrics`'s docstring for what a "label" is here).
    primal_values : np.ndarray
        Dense, label-indexed primal solution values (`primal_values[label]`
        is that variable's value), as returned by linopy's
        `Solution.primal`.

    Returns
    -------
    float
        The largest absolute distance from an integer variable's value to
        its nearest integer.

    Notes
    -----
    Not using `solver_result.solver_model.getInfo()` because it works for
    HiGHS but not for other solvers.
    """
    p = primal_values[integer_var_labels]
    return float(np.max(np.abs(p - np.round(p))))


def get_duality_gap(solver_model: Any, solver_package: str) -> float | None:
    """Retrieve the duality/MIP gap reported by the solver, if available.

    Parameters
    ----------
    solver_model : Any
        The solver's native model object, or None if unavailable.
    solver_package : str
        The underlying solver package, e.g. ``"highs"``.

    Returns
    -------
    float | None
        The relative duality gap, or None if the solver doesn't expose one.

    Raises
    ------
    NotImplementedError
        If `solver_package` has no registered adapter.
    """
    if solver_model is None:
        return None
    adapter = SOLVER_ADAPTERS.get(solver_package)
    if adapter is None:
        raise NotImplementedError(f"The solver '{solver_package}' is not supported.")
    return adapter.duality_gap(solver_model)


def get_milp_metrics(
    input_file: str, solver_result: Any, solver_package: str
) -> tuple[float | None, float | None]:
    """Use HiGHS to read the problem file and compute MILP-specific metrics.

    Parameters
    ----------
    input_file : str
        Path to the problem file, re-read via `highspy` to identify integer
        variables (independent of which solver actually solved it).
    solver_result : Any
        The linopy `Result` returned by the solve.
    solver_package : str
        The underlying solver package, used to look up its duality-gap
        adapter.

    Returns
    -------
    tuple[float | None, float | None]
        `(duality_gap, max_integrality_violation)`, or `(None, None)` if the
        problem has no integer variables, `highspy` isn't installed, or
        reading/computing metrics fails.

    Notes
    -----
    `solver_result.solution.primal` (since linopy 0.9) is a dense array
    indexed by linopy's own integer "label" for each variable, not by
    variable name -- linopy writes problem files with each variable named
    `x<label>` (see `linopy.io`), so the label is recovered by stripping
    that prefix off the same name `highspy` reports for the matching
    column, via linopy's own `_names_to_labels` (kept in sync with whatever
    naming convention linopy itself uses to build `primal`).
    """
    solver_model = solver_result.solver_model
    if solver_model is None or highspy is None:
        return None, None

    try:
        h = highspy.Highs()
        h.readModel(input_file)
        integer_var_names = [
            h.variableName(i)
            for i in range(h.numVariables)
            if h.getColIntegrality(i)[1] == highspy.HighsVarType.kInteger
        ]
        if integer_var_names:
            duality_gap = get_duality_gap(solver_model, solver_package)
            integer_var_labels = _names_to_labels(integer_var_names)
            max_integrality_violation = calculate_integrality_violation(
                integer_var_labels, solver_result.solution.primal
            )
            return duality_gap, max_integrality_violation
    except Exception:
        print(
            f"ERROR obtaining milp metrics for {input_file}: {format_exc()}",
            file=sys.stderr,
        )
    return None, None


def get_reported_runtime(solver_package: str, solver_model: Any) -> float | None:
    """Get the solving runtime as reported by the solver's own Python object.

    Parameters
    ----------
    solver_package : str
        The underlying solver package, e.g. ``"highs"``.
    solver_model : Any
        The solver's native model object, or None if unavailable.

    Returns
    -------
    float | None
        The solver-reported runtime in seconds, or None if unavailable or if
        retrieving it raised an exception.
    """
    if solver_model is None:
        return None
    adapter = SOLVER_ADAPTERS.get(solver_package)
    if adapter is None:
        print(f"WARNING: cannot obtain reported runtime for {solver_package}")
        return None
    try:
        return adapter.reported_runtime(solver_model)
    except Exception:
        print(f"ERROR obtaining reported runtime: {format_exc()}", file=sys.stderr)
        return None


def main(solver_configuration: str, input_file: str, solver_version: str) -> None:
    """Run one solver on one problem file and print the resulting metrics as JSON.

    Parameters
    ----------
    solver_configuration : str
        The solver (or named algorithm) to run, e.g. ``"highs-default"`` or
        ``"highs-hipo"``.
    input_file : str
        Path to the problem file to solve.
    solver_version : str
        The solver version, included in output filenames and the printed
        metrics (not otherwise used to select behavior).
    """
    problem_file = Path(input_file)
    # keep the requested configuration name (e.g. "highs-hipo") for filenames
    output_name = solver_configuration

    solver, solver_package = get_solver(solver_configuration)

    solution_dir = Path(__file__).resolve().parent.parent / "solutions"
    solution_dir.mkdir(parents=True, exist_ok=True)

    logs_dir = Path(__file__).resolve().parent.parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    output_filename = f"{Path(input_file).stem}-{output_name}-{solver_version}"

    solution_fn = solution_dir / f"{output_filename}.sol"
    log_fn = logs_dir / f"{output_filename}.log"

    try:
        # Measure only solver execution time, excluding import overhead
        start_time = perf_counter()
        solver_result = solver.solve_problem(
            problem_fn=problem_file,
            solution_fn=solution_fn,
            log_fn=log_fn,
        )
        runtime = perf_counter() - start_time

        solver_model = solver_result.solver_model
        raw_status = solver_result.status.status.value
        termination_condition = solver_result.status.termination_condition.value
        objective = solver_result.solution.objective

        status_value = raw_status

        # Treat unclear termination conditions as failed/invalid runs
        if termination_condition in {"unknown", "error", "failed", "aborted"}:
            status_value = "ER"
            objective = None
        elif raw_status == "warning" and objective is None:
            status_value = "ER"

        try:
            is_mip = is_mip_problem(solver_model, solver_package)
        except Exception:
            print(f"ERROR checking MIP status: {format_exc()}", file=sys.stderr)
            is_mip = False

        if is_mip:
            duality_gap, max_integrality_violation = get_milp_metrics(
                input_file, solver_result, solver_package
            )
        else:
            duality_gap = None
            max_integrality_violation = None

        results = {
            "runtime": runtime,
            "reported_runtime": get_reported_runtime(solver_package, solver_model),
            "status": status_value,
            "condition": termination_condition,
            "objective": objective,
            "duality_gap": duality_gap,
            "max_integrality_violation": max_integrality_violation,
        }
    except Exception:
        print(f"ERROR running solver: {format_exc()}", file=sys.stderr)
        results = {
            "runtime": None,
            "reported_runtime": None,
            "status": "ER",
            "condition": None,
            "objective": None,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    print(json.dumps(results))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(
            "Usage: python -m runner.utils.solver <solver_configuration> <input_file> <solver_version>"
        )
        sys.exit(1)

    main(sys.argv[1], sys.argv[2], sys.argv[3])
