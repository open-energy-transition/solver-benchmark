import collections.abc
import json
import tempfile
import sys
from enum import Enum
from pathlib import Path
from time import perf_counter
from traceback import format_exc

import linopy
import pandas as pd
from linopy.solvers import SolverName, Highs
import logging

logger = logging.getLogger(__name__)

# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None


class HighsVariant(str, Enum):
    IPX = "ipx"
    SIMPLEX = "simplex"
    HIPO_32 = "hipo-32"
    HIPO_64 = "hipo-64"
    HIPO_128 = "hipo-128"

    # cli args returns a list of command line arguments for the HiGHS binary.
    def cli_args(self) -> collections.abc.Iterable[str]:
        args = {
            "solver": "hipo",
            "run_crossover": "choose",
        }
        if self == HighsVariant.HIPO_IPM:
            args["solver"] = "ipx"

        return [f"--{k}={v}" for k, v in args.items()]

    # options returns the contents for the HiGHS options file.
    # passed to the HiGHS binary via --options_file=<file>
    def options(self) -> str:
        options = {}
        match self:
            case HighsVariant.HIPO_32:
                options["hipo_block_size"] = 32
            case HighsVariant.HIPO_64:
                options["hipo_block_size"] = 64
            case HighsVariant.HIPO_128:
                options["hipo_block_size"] = 128
            case HighsVariant.HIPO:
                options["hipo_block_size"] = 64
                options["hipo_metis_no2hop"] = "true"
        return "\n".join(f"{k} = {v}" for k, v in options.items())


def set_seed_options(name_of_solver: str) -> dict[str, int | float]:
    """
    Sets solver-specific seed and tolerance options for reproducibility.

    This function returns a dictionary of solver configuration parameters that
    control random seed initialization and MIP (Mixed-Integer Programming) gap
    tolerance.

    Parameters
    ----------
    name_of_solver : str
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
        "gurobi": {"seed": 0, "MIPGap": mip_gap},
        "scip": {"randomization/randomseedshift": 0, "limits/gap": mip_gap},
        "cbc": {
            "randomCbcSeed": 1,  # 0 indicates time of day
            "ratioGap": mip_gap,
        },
        "cplex": {
            "randomseed": 0,
            "mip.tolerances.mipgap": mip_gap,
        },
        "knitro": {
            "KN_PARAM_MS_SEED": 1066,
        },
        "xpress": {"miprelgapnotify": mip_gap, "randomseed": 0},
    }
    if name_of_solver in seed_options.keys():
        return seed_options[name_of_solver]
    else:
        logger.info("No seed options found for solver '%s'. Returning empty options.", name_of_solver)
        return dict()


def set_solver_options(name_solver: str, variant_highs: str | None) -> dict[str, int | str]:
    """
    Sets solver-specific options for reproducibility.

    This function returns a dictionary of solver configuration parameters that
    control specific solver behaviors, such as the block size for HiGHS variants.

    Parameters
    ----------
    name_solver : str
        Name of the optimization solver. Supported solvers include: "highs",
        "glpk", "gurobi", "scip", "cbc", "cplex", "knitro", and "xpress".
    variant_highs : str | None
        Additional information about the solver type, used to determine specific options for HiGHS variants.

    Returns
    -------
    dict[str, int | str]
        A dictionary mapping solver-specific parameter names to their values.
        Returns an empty dictionary if the solver name is not recognized.
    """

    if name_solver == "highs":
        if "hipo" in variant_highs:
            if variant_highs == HighsVariant.HIPO_32:
                return {"hipo_block_size": 64, "solver": "hipo"}
            elif variant_highs == HighsVariant.HIPO_64:
                return {"hipo_block_size": 64, "solver": "hipo"}
            elif variant_highs == HighsVariant.HIPO_128:
                return {"hipo_block_size": 128, "solver": "hipo"}
            else:
                logger.info("No specific options found for HiGHS variant '%s'. Returning default options.")
                return {"hipo_block_size": 64, "solver": "hipo"}
        elif variant_highs == HighsVariant.IPX or variant_highs == HighsVariant.SIMPLEX:
            return {"solver": variant_highs}
        else:
            logger.info("No specific options found for HiGHS variant '%s'. Returning empty options.", variant_highs)
            return dict()
    else:
        logger.info("No specific options found for solver '%s'. Returning empty options.", name_solver)
        return dict()


def get_solver(name_solver: str, variant_highs: str) -> linopy.solvers:
    solver_enum = SolverName(name_solver)

    solver_class = getattr(linopy.solvers, solver_enum.name)

    # Get seed options
    seed_options = set_seed_options(name_solver)

    # Get other solver options if needed (e.g., for HiGHS variants)
    solver_options = set_solver_options(name_solver, variant_highs)

    return solver_class(**seed_options, **solver_options)


def is_mip_problem(solver_model, name_solver: str) -> bool:
    """
    Determines if a given solver model is a Mixed Integer Programming (MIP) problem.
    """
    if name_solver == "scip":
        if solver_model.getNIntVars() > 0 or solver_model.getNBinVars() > 0:
            return True
        return False
    elif name_solver == "gurobi":
        return solver_model.IsMIP
    elif name_solver == "highs":
        info = solver_model.getInfo()
        return info.mip_node_count >= 0
    elif name_solver == "cplex":
        # Check if any variables are integer or binary
        var_types = solver_model.variables.get_types()
        return any(t in ("I", "B") for t in var_types)
    elif name_solver == "xpress":
        return solver_model.getAttrib("mipents") > 0
    elif name_solver in {"glpk", "cbc"}:
        # These solvers do not provide a solver model in the solver result,
        # so MIP problem detection is not possible.
        # TODO preprocess benchmarks and add this info to metadata
        return False
    elif name_solver == "knitro":
        # Knitro is not designed for MILP problems
        return False
    else:
        raise NotImplementedError(f"The solver '{name_solver}' is not supported.")


def calculate_integrality_violation(
    integer_vars: pd.Series, primal_values: pd.Series
) -> float:
    """Calculate the maximum integrality violation from primal values.
    We only care about Integer vars, not SemiContinuous or SemiInteger, following the code in
    https://github.com/ERGO-Code/HiGHS/blob/fd8665394edfd096c4f847c4a6fbc187364ef474/src/mip/HighsMipSolver.cpp#L888
    Note:
        We are not using solver_result.solver_model.getInfo() because it works for HiGHS but not for other solvers
    """
    p = primal_values.loc[primal_values.index.intersection(integer_vars)]
    return max((p - p.round()).abs())


def get_duality_gap(solver_model, name_solver: str):
    """Retrieve the duality gap for the given solver model, if available."""
    if name_solver == "scip":
        return solver_model.getGap()
    elif name_solver == "gurobi":
        return solver_model.MIPGap
    elif name_solver == "highs":
        return getattr(solver_model.getInfo(), "mip_gap", None)
    elif name_solver == "cbc":
        return getattr(solver_model, "mip_gap", None)
    elif name_solver == "glpk":
        # GLPK does not have a way to retrieve the duality gap from python
        return None
    elif name_solver == "cplex":
        return solver_model.solution.MIP.get_mip_relative_gap()
    elif name_solver == "xpress":
        return solver_model.controls.miprelgapnotify
    elif name_solver == "knitro":
        # Knitro duality gap retrieval not implemented yet
        return None
    else:
        raise NotImplementedError(f"The solver '{name_solver}' is not supported.")


def get_milp_metrics(input_file, solver_result):
    """Uses HiGHS to read the problem file and compute max integrality violation and
    duality gap.
    """
    try:
        if highspy is not None:
            h = highspy.Highs()
            h.readModel(input_file)
            integer_vars = {
                h.variableName(i)
                for i in range(h.numVariables)
                if h.getColIntegrality(i)[1] == highspy.HighsVarType.kInteger
            }
            if integer_vars:
                duality_gap = get_duality_gap(solver_result.solver_model, solver_name)
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


def get_reported_runtime(solver_name, solver_model) -> float | None:
    """Get the solving runtime as reported by the solver from the solver's Python object."""
    try:
        match solver_name:
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
                print(f"WARNING: cannot obtain reported runtime for {solver_name}")
                return None
    except Exception:
        print(f"ERROR obtaining reported runtime: {format_exc()}", file=sys.stderr)
    return None


def run_highs_solver(input_fn: str, solution_fn: Path, highs_variant: HighsVariant) -> None:
    """
    Run the HiGHS solver, differentiating between IPX and HiPO
    """

    if "hipo" in highs_variant.value.casefold():
        # Running HiPO variant of HiGHS
        with tempfile.NamedTemporaryFile(
                mode="w",
                prefix=highs_variant.value,
                suffix=".options",
                delete=False,
                delete_on_close=False,
        ) as options_file:
            options_file.write(highs_variant.options())
            options_file.flush()

        solver_args = list(highs_variant.cli_args())
        solver_args.append(f"--options_file={options_file.name}")
        solver_args.append(f"--solution_file={solution_fn}")

    solver = Highs()


def main(solver_name, input_file, solver_version, highs_solver_variant: str) -> None:
    problem_file = Path(input_file)

    solver = get_solver(solver_name, highs_solver_variant)

    solution_dir = Path(__file__).parent / "solutions"
    solution_dir.mkdir(parents=True, exist_ok=True)

    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    output_filename = f"{Path(input_file).stem}-{solver_name}-{solver_version}"

    solution_fn = solution_dir / f"{output_filename}.sol"
    log_fn = logs_dir / f"{output_filename}.log"

    try:
        # We measure runtime here and not of this entire script because lines like
        # `import linopy` take a long (and varying) amount of time
        start_time = perf_counter()
        solver_result = solver.solve_problem(
            problem_fn=problem_file, solution_fn=solution_fn, log_fn=log_fn
        )
        runtime = perf_counter() - start_time

        duality_gap, max_integrality_violation = get_milp_metrics(
            input_file, solver_result
        )

        results = {
            "runtime": runtime,
            "reported_runtime": get_reported_runtime(
                solver_name, solver_result.solver_model
            ),
            "status": solver_result.status.status.value,
            "condition": solver_result.status.termination_condition.value,
            "objective": solver_result.solution.objective,
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
        print("Usage: python run_solver.py <solver_name> <input_file> <solver_version>")
        sys.exit(1)

    solver_name = sys.argv[1].casefold()
    input_file = sys.argv[2]
    solver_version = sys.argv[3]

    # If the solver is HiGHS, we need to ask the user for the variant they want to run
    highs_solver_variant: str = ""
    if solver_name == "highs":
        print("Available HiGHS variants:", ", ".join([v.value for v in HighsVariant]))
        highs_solver_variant = input("Please enter a HiGHS variant: ").strip().casefold()
        if highs_solver_variant not in [v.value for v in HighsVariant]:
            print(f"Invalid HiGHS variant: {highs_solver_variant}")
            sys.exit(1)

    main(solver_name, input_file, solver_version, highs_solver_variant)
