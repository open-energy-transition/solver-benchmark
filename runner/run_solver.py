"""
Solver Runner Script
====================

This script provides a unified interface to run various optimization solvers
(e.g., HiGHS, GLPK, Gurobi, SCIP, CBC, CPLEX, Knitro, Xpress) on a given input
problem file. It configures solver-specific options for reproducibility,
executes the solver, and collects key metrics such as runtime, duality gap,
and integrality violation.

Features
--------
- Supports multiple solvers with customizable options.
- Handles solver-specific seed and tolerance settings.
- Computes MILP metrics (duality gap, integrality violation) when applicable.
- Outputs results in JSON format.

Example Usage
-------------
Run the script from the command line:

    python runner/run_solver.py \
        --solver_name highs \
        --solver_version 1.6.0 \
        --input_file path/to/problem.mps \
        --highs_solver_variant hipo \
        --hipo_block_size 128

Arguments
---------
--solver_name           Name of the solver to run (e.g., highs, glpk, gurobi, scip, cbc, cplex, knitro, xpress).
--solver_version        Version of the solver to use.
--input_file            Path to the input problem file (e.g., .mps, .lp).
--highs_solver_variant  Variant of HiGHS to run (hipo, ipm, ipx, pdlp, simplex). Only for HiGHS.
--hipo_block_size       Block size for HiPO variant of HiGHS (default: 128).

See the function `parse_args()` for more details on arguments.
"""

import argparse
import json
import logging
from enum import Enum
from pathlib import Path
from time import perf_counter
from traceback import format_exc
from typing import Any

import linopy
import pandas as pd
from linopy.solvers import SolverName

logger = logging.getLogger(__name__)

# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None

SUPPORTED_SOLVERS = [
    "highs",
    "glpk",
    "gurobi",
    "scip",
    "cbc",
    "cplex",
    "knitro",
    "xpress",
]


class HighsSolverVariant(str, Enum):
    """
    Enumeration of supported HiGHS solver variants.
    The solver variants are available at
    https://ergo-code.github.io/HiGHS/stable/options/definitions/#option-solver.

    Attributes
    ----------
    HIPO : str
        HiPO variant of HiGHS.
    IPM : str
       IPM variant of HiGHS.
    IPX : str
       IPX variant of HiGHS.
    PDLP : str
        PDLP variant of HiGHS.
    SIMPLEX : str
        SIMPLEX variant of HiGHS.
    """

    HIPO = "hipo"
    IPM = "ipm"
    IPX = "ipx"
    PDLP = "pdlp"
    SIMPLEX = "simplex"


def set_seed_options(solver_name_val: str) -> dict[str, int | float]:
    """
    Sets solver-specific seed and tolerance options for reproducibility.

    This function returns a dictionary of solver configuration parameters that
    control random seed initialization and MIP (Mixed-Integer Programming) gap
    tolerance.

    Parameters
    ----------
    solver_name_val : str
        Name of the optimization solver. Supported solvers include: "highs",
        "glpk", "gurobi", "scip", "cbc", "cplex", "knitro", and "xpress".

    Returns
    -------
    dict[str, int | float]
        A dictionary mapping solver-specific parameter names to their values.
        Returns an empty dictionary if the solver name is not recognized.
    """
    mip_gap = 1e-4  # Tolerance for the relative duality gap for MILPs
    seed_options = {
        "highs": {"random_seed": 0, "mip_rel_gap": mip_gap},
        "glpk": {"seed": 0, "mipgap": mip_gap},
        "gurobi": {"seed": 0, "MIPGap": mip_gap, "Crossover": 0},
        "scip": {"randomization/randomseedshift": 0, "limits/gap": mip_gap},
        "cbc": {
            "randomCbcSeed": 1,  # 0 indicates time of day
            "ratioGap": mip_gap,
        },
        "cplex": {
            "randomseed": 0,
            "mip.tolerances.mipgap": mip_gap,
            "solutiontype": 2,
        },
        "knitro": {
            "ms_seed": 1066,
            "bar_maxcrossit": 0,
        },
        "xpress": {
            "miprelgapnotify": mip_gap,
            "randomseed": 0,
            "crossover": 0,
        },
    }
    if solver_name_val in seed_options.keys():
        return seed_options[solver_name_val]
    else:
        logger.info(
            "No seed options found for solver '%s'. Returning empty options.",
            solver_name_val,
        )
        return dict()


def set_solver_options(
    solver_name_val: str, variant_highs: str, hipo_block_size_val: int
) -> dict[str, int | str]:
    """
    Sets solver-specific options for reproducibility.

    This function returns a dictionary of solver configuration parameters that
    control specific solver behaviors, such as the block size for HiGHS variants.

    Parameters
    ----------
    solver_name_val : str
        Name of the optimization solver. Supported solvers include: "highs",
        "glpk", "gurobi", "scip", "cbc", "cplex", "knitro", and "xpress".
    variant_highs : str
        Solver type, used to determine specific options for HiGHS variants.
    hipo_block_size_val : int
        Block size value for HiPO variant of HiGHS.
        This parameter is only relevant if the solver is HiGHS
        and the variant is a HiPO variant.

    Returns
    -------
    dict[str, int | str]
        A dictionary mapping solver-specific parameter names to their values.
        Returns an empty dictionary if the solver name is not recognized.
    """

    if solver_name_val == "highs":
        if variant_highs == HighsSolverVariant.HIPO:
            return {
                "hipo_block_size": hipo_block_size_val,
                "solver": "hipo",
                "run_crossover": "choose",
            }
        elif (
            variant_highs == HighsSolverVariant.IPM
            or variant_highs == HighsSolverVariant.IPX
            or variant_highs == HighsSolverVariant.PDLP
            or variant_highs == HighsSolverVariant.SIMPLEX
        ):
            return {"solver": variant_highs}
    else:
        logger.info(
            "No specific options found for solver '%s'. Returning empty options.",
            solver_name_val,
        )
        return dict()


def get_solver(
    name_solver: str, variant_highs: str, hipo_block_size_val: int
) -> linopy.solvers:
    """
    Instantiate and configure a solver object based on the specified solver name and options.

    Parameters
    ----------
    name_solver : str
        Name of the optimization solver (e.g., "highs", "glpk", "gurobi").
    variant_highs : str
        Variant of HiGHS to use. Only relevant if `name_solver` is "highs".
    hipo_block_size_val : int
        Block size for the HiPO variant of HiGHS. Only relevant if `variant_highs` is "hipo".

    Returns
    -------
    Any
        An instance of the solver class, configured with the appropriate options.
    """
    solver_enum = SolverName(name_solver)

    solver_class = getattr(linopy.solvers, solver_enum.name)

    # Get seed options
    seed_options = set_seed_options(name_solver)

    # Get other solver options if needed (e.g., for HiGHS variants)
    solver_options = set_solver_options(name_solver, variant_highs, hipo_block_size_val)

    kwargs = {}
    if seed_options:
        kwargs.update(seed_options)
    if solver_options:
        kwargs.update(solver_options)

    return solver_class(**kwargs)


def is_mip_problem(solver_model: Any, solver_name_val: str) -> bool:
    """
    Determine if the given solver model is a Mixed Integer Programming (MIP) problem.

    Parameters
    ----------
    solver_model : Any
        The solver's Python object or model instance.
    solver_name_val : str
        Name of the solver (e.g., "highs", "scip", "cbc", "gurobi", "cplex", "xpress", "glpk", "knitro").

    Returns
    -------
    bool
        True if the problem is a MIP, False otherwise.
    """
    if solver_name_val == "scip":
        if solver_model.getNIntVars() > 0 or solver_model.getNBinVars() > 0:
            return True
        return False
    elif solver_name_val == "gurobi":
        return solver_model.IsMIP
    elif solver_name_val == "highs":
        info = solver_model.getInfo()
        return info.mip_node_count >= 0
    elif solver_name_val == "cplex":
        # Check if any variables are integer or binary
        var_types = solver_model.variables.get_types()
        return any(t in ("I", "B") for t in var_types)
    elif solver_name_val == "xpress":
        return solver_model.getAttrib("mipents") > 0
    elif solver_name_val in {"glpk", "cbc"}:
        # These solvers do not provide a solver model in the solver result,
        # so MIP problem detection is not possible.
        # TODO preprocess benchmarks and add this info to metadata
        return False
    elif solver_name_val == "knitro":
        # Knitro is not designed for MILP problems
        return False
    else:
        raise NotImplementedError(f"The solver '{solver_name_val}' is not supported.")


def calculate_integrality_violation(
    integer_vars: set, primal_values: pd.Series
) -> float:
    """Calculate the maximum integrality violation from primal values.
    We only care about Integer vars, not SemiContinuous or SemiInteger, following the code in
    https://github.com/ERGO-Code/HiGHS/blob/fd8665394edfd096c4f847c4a6fbc187364ef474/src/mip/HighsMipSolver.cpp#L888
    Note:
        We are not using solver_result.solver_model.getInfo() because it works for HiGHS but not for other solvers
    """
    p = primal_values.loc[primal_values.index.intersection(integer_vars)]
    return max((p - p.round()).abs())


def get_duality_gap(solver_model: Any, solver_name_val: str) -> float | None:
    """
    Retrieve the duality gap for the given solver model, if available.

    Parameters
    ----------
    solver_model : Any
        The solver's Python object or model instance.
    solver_name_val : str
        Name of the solver (e.g., "highs", "scip", "cbc", "gurobi", "cplex", "xpress", "glpk", "knitro").

    Returns
    -------
    float or None
        The duality gap if available, otherwise None.
    """
    if solver_name_val == "scip":
        return solver_model.getGap()
    elif solver_name_val == "gurobi":
        return solver_model.MIPGap
    elif solver_name_val == "highs":
        return getattr(solver_model.getInfo(), "mip_gap", None)
    elif solver_name_val == "cbc":
        return getattr(solver_model, "mip_gap", None)
    elif solver_name_val == "glpk":
        # GLPK does not have a way to retrieve the duality gap from python
        return None
    elif solver_name_val == "cplex":
        return solver_model.solution.MIP.get_mip_relative_gap()
    elif solver_name_val == "xpress":
        return solver_model.controls.miprelgapnotify
    elif solver_name_val == "knitro":
        # Knitro duality gap retrieval not implemented yet
        return None
    else:
        logger.info(f"The solver '{solver_name_val}' is not supported.")
        return None


def get_milp_metrics(
    input_file_path: Path, solver_name_val: str, solver_result: Any
) -> tuple[float | None, float | None]:
    """
    Compute MILP metrics (duality gap and max integrality violation) using HiGHS.

    Parameters
    ----------
    input_file_path : Path
        Path to the input problem file.
    solver_name_val : str
        Name of the solver (e.g., "highs", "scip", "cbc", "gurobi", "cplex", "xpress", "glpk", "knitro").
    solver_result : Any
        The solver result object containing the solver model and solution.

    Returns
    -------
    tuple[float or None, float or None]
        A tuple containing the duality gap and the maximum integrality violation.
        Returns (None, None) if metrics cannot be computed.
    """
    try:
        if highspy is not None:
            h = highspy.Highs()
            h.readModel(input_file_path.as_posix())
            integer_vars = {
                h.variableName(i)
                for i in range(h.numVariables)
                if h.getColIntegrality(i)[1] == highspy.HighsVarType.kInteger
            }
            if integer_vars:
                duality_gap = get_duality_gap(
                    solver_result.solver_model, solver_name_val
                )
                max_integrality_violation = calculate_integrality_violation(
                    integer_vars, solver_result.solution.primal
                )
                return duality_gap, max_integrality_violation
    except ValueError:
        raise ValueError(
            f"ERROR obtaining milp metrics for {input_file_path}: {format_exc()}",
        )
    return None, None


def get_reported_runtime(solver_name_val: str, solver_model: Any) -> float | None:
    """
    Get the solving runtime as reported by the solver from the solver's Python object.

    Parameters
    ----------
    solver_name_val : str
        Name of the solver (e.g., "highs", "scip", "cbc", "gurobi", "cplex", "xpress", "knitro").
    solver_model : Any
        The linopy Model instance containing runtime information.

    Returns
    -------
    float or None
        The reported runtime in seconds, or None if not available.
    """
    match solver_name_val:
        case "highs":
            return solver_model.getRunTime()
        case "scip":
            return solver_model.getSolvingTime()
        case "cbc":
            return solver_model.runtime
        case "gurobi":
            return solver_model.Runtime
        case "cplex":
            return None
        case "xpress":
            return solver_model.getAttrib("time")
        case "knitro":
            return solver_model.reported_runtime
        case _:
            logger.info(
                f"WARNING: cannot obtain reported runtime for {solver_name_val}"
            )
            return None


def main(
    solver_name_val: str,
    input_file_name: str,
    solver_version_val: str,
    highs_solver_variant_val: str,
    hipo_block_size_val: int,
) -> None:
    """
    Run the specified solver on the given input file and collect results.

    Parameters
    ----------
    solver_name_val : str
        Name of the solver to run (e.g., "highs", "glpk", "gurobi").
    input_file_name : str
        Name to the input problem file.
    solver_version_val : str
        Version of the solver to use.
    highs_solver_variant_val : str
        Variant of HiGHS to run (only applicable if solver_name_val is "highs").
    hipo_block_size_val : int
        Block size for HiPO variant of HiGHS
        (only applicable if solver_name_val is "highs"
         and highs_solver_variant_val is "hipo").

    Returns
    -------
    None
    """
    problem_file = Path(input_file_name)

    solver = get_solver(solver_name_val, highs_solver_variant_val, hipo_block_size_val)

    solution_dir = Path(__file__).parent / "solutions"
    solution_dir.mkdir(parents=True, exist_ok=True)

    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    output_filename = (
        f"{Path(input_file_name).stem}-{solver_name_val}-{solver_version_val}"
    )

    solution_fn = solution_dir / f"{output_filename}.sol"
    log_fn = logs_dir / f"{output_filename}.log"

    results = {
        "runtime": None,
        "reported_runtime": None,
        "status": "ER",
        "condition": None,
        "objective": None,
        "duality_gap": None,
        "max_integrality_violation": None,
    }

    # We measure runtime here and not of this entire script because lines like
    # `import linopy` take a long (and varying) amount of time
    start_time = perf_counter()
    solver_result = solver.solve_problem(
        problem_fn=problem_file, solution_fn=solution_fn, log_fn=log_fn
    )
    runtime = perf_counter() - start_time
    duality_gap, max_integrality_violation = get_milp_metrics(
        problem_file, solver_name_val, solver_result
    )
    results.update(
        {
            "runtime": runtime,
            "reported_runtime": get_reported_runtime(
                solver_name_val, solver_result.solver_model
            ),
            "status": solver_result.status.status.value,
            "condition": solver_result.status.termination_condition.value,
            "objective": solver_result.solution.objective,
            "duality_gap": duality_gap,
            "max_integrality_violation": max_integrality_violation,
        }
    )
    print(json.dumps(results))


def parse_args() -> argparse.Namespace:
    """
    Parse command-line arguments for the solver runner script.

    Returns
    -------
    argparse.Namespace
        Namespace containing the parsed command-line arguments:
        - solver_name (str): Name of the solver to run.
        - solver_version (str): Version of the solver to run.
        - input_file (str): Path to the input problem file.
        - highs_solver_variant (str): Variant of HiGHS to run (only applicable if solver_name is 'highs').
        - hipo_block_size (int): Block size for HiPO variant of HiGHS
        (only applicable if solver_name is 'highs' and
         highs_solver_variant is 'hipo').
    """
    p = argparse.ArgumentParser()
    p.add_argument(
        "--solver_name",
        type=str,
        choices=SUPPORTED_SOLVERS,
        required=True,
        help="Name of the solver to run.",
    )
    p.add_argument(
        "--solver_version",
        type=str,
        required=True,
        help="Version of the solver to run.",
    )
    p.add_argument(
        "--input_file", type=str, required=True, help="Path to the input problem file."
    )
    p.add_argument(
        "--highs_solver_variant",
        type=str,
        choices=[v.value for v in HighsSolverVariant],
        help="Variant of HiGHS to run (only applicable if solver_name is 'highs').",
        default="simplex",
    )
    p.add_argument(
        "--hipo_block_size",
        type=int,
        help="Block size for HiPO variant of HiGHS "
        "(only applicable if solver_name is 'highs' and "
        "highs_solver_variant is 'hipo').",
        default=128,
    )
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    solver_name = args.solver_name
    input_file = args.input_file
    solver_version = args.solver_version
    highs_solver_variant = args.highs_solver_variant
    hipo_block_size = args.hipo_block_size
    main(solver_name, input_file, solver_version, highs_solver_variant, hipo_block_size)
