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
    python -m runner.utils.solver <solver_configuration> <input_file> <solver_version> [--seed N]
"""

import json
import sys
from pathlib import Path
from time import perf_counter
from traceback import format_exc
from typing import Any

from linopy import solvers
from linopy.solvers import SolverName

from . import config
from .solvers import SOLVER_ADAPTERS


def get_solver(solver_configuration: str, seed: int | None = None) -> tuple[Any, str]:
    """Build a linopy solver instance with this project's tuning options.

    Parameters
    ----------
    solver_configuration : str
        The configuration to run, as requested by a caller (e.g. ``"highs-hipo"``).
    seed : int, optional
        If given, overrides the configuration's own fixed seed (e.g. for
        running the same configuration under several different seeds to
        gauge a solver's sensitivity to it -- see `solvers.yaml`'s
        `seed_options` map for which options key holds a solver package's
        seed). Ignored (with a warning) if `solver_package` has no entry in
        `seed_options`.

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

    if seed is not None:
        seed_key = config.get_seed_option(solver_package)
        if seed_key is None:
            print(
                f"WARNING: '{solver_package}' has no seed_options entry in "
                "solvers.yaml; --seed ignored",
                file=sys.stderr,
            )
        else:
            kwargs[seed_key] = seed

    solver_enum = SolverName(solver_package)
    solver_class = getattr(solvers, solver_enum.name)
    return solver_class(options=kwargs), solver_package


def is_mip_problem(solver_model: Any, solver_package: str) -> bool | None:
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
    bool | None
        True if the problem had integer/binary variables, per the solver's
        own reporting, or None if that can't be told from the model (no
        model, or a command-line solver such as CBC or GLPK).

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
    return adapter.is_mip(solver_model)


def calculate_integrality_violation(integer_values: dict[str, float]) -> float:
    """Calculate the maximum integrality violation from primal values.

    Only Integer (and binary) vars are considered, not SemiContinuous or
    SemiInteger, following the code in
    https://github.com/ERGO-Code/HiGHS/blob/fd8665394edfd096c4f847c4a6fbc187364ef474/src/mip/HighsMipSolver.cpp#L888

    Parameters
    ----------
    integer_values : dict[str, float]
        Solved value of every integer variable, keyed by name, as returned
        by the solver adapter's `integer_values`.

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
    return max(abs(value - round(value)) for value in integer_values.values())


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
    solver_model: Any,
    solver_package: str,
    problem_fn: Path,
    solution_fn: Path,
    is_mip: bool | None,
) -> tuple[float | None, float | None]:
    """Compute the duality gap and max integrality violation of a MILP solve.

    Variable values come from the solver's own adapter (native model or
    solution file, see `runner/utils/solvers/`), not from linopy's
    `Solution.primal`, whose layout changes between linopy versions.

    Parameters
    ----------
    solver_model : Any
        The solver's native model object, or None if unavailable.
    solver_package : str
        The underlying solver package, used to look up its adapter.
    problem_fn : Path
        The problem file that was solved.
    solution_fn : Path
        The solution file linopy asked the solver to write.
    is_mip : bool | None
        `is_mip_problem`'s answer; None means the adapter's
        `integer_values` decides.

    Returns
    -------
    tuple[float | None, float | None]
        `(duality_gap, max_integrality_violation)`, or `(None, None)` if the
        problem has no integer variables. The integrality violation is None
        unless the value of every integer variable could be read.
    """
    adapter = SOLVER_ADAPTERS.get(solver_package)
    if adapter is None:
        raise NotImplementedError(f"The solver '{solver_package}' is not supported.")

    try:
        integer_values = adapter.integer_values(solver_model, problem_fn, solution_fn)
    except Exception:
        print(
            f"ERROR obtaining integer variable values for {problem_fn}: {format_exc()}",
            file=sys.stderr,
        )
        integer_values = None

    if integer_values == {} or (is_mip is None and integer_values is None):
        return None, None

    try:
        duality_gap = get_duality_gap(solver_model, solver_package)
    except Exception:
        print(f"ERROR obtaining duality gap: {format_exc()}", file=sys.stderr)
        duality_gap = None

    max_integrality_violation = (
        calculate_integrality_violation(integer_values) if integer_values else None
    )
    return duality_gap, max_integrality_violation


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


def main(
    solver_configuration: str,
    input_file: str,
    solver_version: str,
    seed: int | None = None,
) -> None:
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
    seed : int, optional
        If given, overrides the configuration's own fixed seed (see
        `get_solver`).
    """
    problem_file = Path(input_file)
    # keep the requested configuration name (e.g. "highs-hipo") for filenames
    output_name = solver_configuration

    solver, solver_package = get_solver(solver_configuration, seed=seed)

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

        if is_mip is not False:
            duality_gap, max_integrality_violation = get_milp_metrics(
                solver_model, solver_package, problem_file, solution_fn, is_mip
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
    argv = sys.argv[1:]
    cli_seed = None
    if "--seed" in argv:
        seed_index = argv.index("--seed")
        cli_seed = int(argv[seed_index + 1])
        del argv[seed_index : seed_index + 2]

    if len(argv) != 3:
        print(
            "Usage: python -m runner.utils.solver <solver_configuration> "
            "<input_file> <solver_version> [--seed N]"
        )
        sys.exit(1)

    main(argv[0], argv[1], argv[2], seed=cli_seed)
