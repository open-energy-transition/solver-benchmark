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
    python -m runner.utils.solver <solver_name> <input_file> <solver_version>
"""

import json
import sys
from pathlib import Path
from time import perf_counter
from traceback import format_exc
from typing import Any

import pandas as pd
from linopy import solvers
from linopy.solvers import SolverName

from . import config
from .solvers import SOLVER_ADAPTERS

# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None


def get_solver(solver_name: str) -> tuple[Any, str]:
    """Build a linopy solver instance with this project's tuning options.

    Parameters
    ----------
    solver_name : str
        The configuration to run, as requested by a caller -- either a
        solver's default configuration (e.g. ``"highs"``) or a named
        algorithm configuration (e.g. ``"highs-hipo"``), per
        `config.get_solver_configuration`.

    Returns
    -------
    tuple[Any, str]
        `(solver_instance, resolved_solver_name)`. `resolved_solver_name` is
        the real solver package to use for reading result metrics afterward
        (e.g. ``"highs"`` for the configuration ``"highs-hipo"``), since a
        named configuration shares its solver's model API.
    """
    configuration = config.get_solver_configuration(solver_name)
    if configuration is not None:
        resolved_name, kwargs = configuration["solver"], configuration["options"]
    else:
        resolved_name = solver_name.lower()
        kwargs = {}

    solver_enum = SolverName(resolved_name)
    solver_class = getattr(solvers, solver_enum.name)
    return solver_class(options=kwargs), resolved_name


def is_mip_problem(solver_model: Any, solver_name: str) -> bool:
    """Determine whether a solved model was a Mixed Integer Programming problem.

    Parameters
    ----------
    solver_model : Any
        The solver's native model object (`solver_result.solver_model`), or
        None if unavailable.
    solver_name : str
        The solver's name.

    Returns
    -------
    bool
        True if the problem had integer/binary variables, per the solver's
        own reporting.

    Raises
    ------
    NotImplementedError
        If `solver_name` has no registered adapter.
    """
    if solver_model is None:
        return False
    adapter = SOLVER_ADAPTERS.get(solver_name)
    if adapter is None:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")
    return adapter.is_mip(solver_model)


def calculate_integrality_violation(
    integer_vars: pd.Series, primal_values: pd.Series
) -> float:
    """Calculate the maximum integrality violation from primal values.

    Only Integer vars are considered, not SemiContinuous or SemiInteger,
    following the code in
    https://github.com/ERGO-Code/HiGHS/blob/fd8665394edfd096c4f847c4a6fbc187364ef474/src/mip/HighsMipSolver.cpp#L888

    Parameters
    ----------
    integer_vars : pd.Series
        Names/index of the model's integer variables.
    primal_values : pd.Series
        Primal solution values, indexed by variable name.

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
    p = primal_values.loc[primal_values.index.intersection(integer_vars)]
    return max((p - p.round()).abs())


def get_duality_gap(solver_model: Any, solver_name: str) -> float | None:
    """Retrieve the duality/MIP gap reported by the solver, if available.

    Parameters
    ----------
    solver_model : Any
        The solver's native model object, or None if unavailable.
    solver_name : str
        The solver's name.

    Returns
    -------
    float | None
        The relative duality gap, or None if the solver doesn't expose one.

    Raises
    ------
    NotImplementedError
        If `solver_name` has no registered adapter.
    """
    if solver_model is None:
        return None
    adapter = SOLVER_ADAPTERS.get(solver_name)
    if adapter is None:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")
    return adapter.duality_gap(solver_model)


def get_milp_metrics(
    input_file: str, solver_result: Any, solver_name: str
) -> tuple[float | None, float | None]:
    """Use HiGHS to read the problem file and compute MILP-specific metrics.

    Parameters
    ----------
    input_file : str
        Path to the problem file, re-read via `highspy` to identify integer
        variables (independent of which solver actually solved it).
    solver_result : Any
        The linopy `Result` returned by the solve.
    solver_name : str
        The solver's name, used to look up its duality-gap adapter.

    Returns
    -------
    tuple[float | None, float | None]
        `(duality_gap, max_integrality_violation)`, or `(None, None)` if the
        problem has no integer variables, `highspy` isn't installed, or
        reading/computing metrics fails.
    """
    solver_model = solver_result.solver_model
    if solver_model is None or highspy is None:
        return None, None

    try:
        h = highspy.Highs()
        h.readModel(input_file)
        integer_vars = {
            h.variableName(i)
            for i in range(h.numVariables)
            if h.getColIntegrality(i)[1] == highspy.HighsVarType.kInteger
        }
        if integer_vars:
            duality_gap = get_duality_gap(solver_model, solver_name)
            max_integrality_violation = calculate_integrality_violation(
                integer_vars, solver_result.solution.primal
            )
            return duality_gap, max_integrality_violation
    except Exception:
        print(
            f"ERROR obtaining milp metrics for {input_file}: {format_exc()}",
            file=sys.stderr,
        )
    return None, None


def get_reported_runtime(solver_name: str, solver_model: Any) -> float | None:
    """Get the solving runtime as reported by the solver's own Python object.

    Parameters
    ----------
    solver_name : str
        The solver's name.
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
    adapter = SOLVER_ADAPTERS.get(solver_name)
    if adapter is None:
        print(f"WARNING: cannot obtain reported runtime for {solver_name}")
        return None
    try:
        return adapter.reported_runtime(solver_model)
    except Exception:
        print(f"ERROR obtaining reported runtime: {format_exc()}", file=sys.stderr)
        return None


def main(solver_name: str, input_file: str, solver_version: str) -> None:
    """Run one solver on one problem file and print the resulting metrics as JSON.

    Parameters
    ----------
    solver_name : str
        The solver (or named algorithm) to run, e.g. ``"highs"`` or
        ``"highs-hipo"``.
    input_file : str
        Path to the problem file to solve.
    solver_version : str
        The solver version, included in output filenames and the printed
        metrics (not otherwise used to select behavior).
    """
    problem_file = Path(input_file)
    output_name = (
        solver_name  # keep the requested name (e.g. "highs-hipo") for filenames
    )

    solver, solver_name = get_solver(solver_name)

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
            is_mip = is_mip_problem(solver_model, solver_name)
        except Exception:
            print(f"ERROR checking MIP status: {format_exc()}", file=sys.stderr)
            is_mip = False

        if is_mip:
            duality_gap, max_integrality_violation = get_milp_metrics(
                input_file, solver_result, solver_name
            )
        else:
            duality_gap = None
            max_integrality_violation = None

        results = {
            "runtime": runtime,
            "reported_runtime": get_reported_runtime(solver_name, solver_model),
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
            "Usage: python -m runner.utils.solver <solver_name> <input_file> <solver_version>"
        )
        sys.exit(1)

    main(sys.argv[1], sys.argv[2], sys.argv[3])
