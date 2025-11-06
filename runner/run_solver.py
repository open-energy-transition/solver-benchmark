import collections
import collections.abc
import json
import os
import subprocess
import sys
import time
from enum import Enum
from pathlib import Path
from time import perf_counter
from traceback import format_exc

import pandas as pd
from linopy import solvers
from linopy.solvers import SolverName

# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None


def get_solver(solver_name):
    solver_name = solver_name.lower()
    solver_enum = SolverName(solver_name)

    solver_class = getattr(solvers, solver_enum.name)

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
    }

    return solver_class(**seed_options.get(solver_name, {}))


def is_mip_problem(solver_model, solver_name):
    """
    Determines if a given solver model is a Mixed Integer Programming (MIP) problem.
    """
    if solver_name == "scip":
        if solver_model.getNIntVars() > 0 or solver_model.getNBinVars() > 0:
            return True
        return False
    elif solver_name == "gurobi":
        return solver_model.IsMIP
    elif solver_name == "highs":
        info = solver_model.getInfo()
        return info.mip_node_count >= 0
    elif solver_name in {"glpk", "cbc"}:
        # These solvers do not provide a solver model in the solver result,
        # so MIP problem detection is not possible.
        # TODO preprocess benchmarks and add this info to metadata
        return False
    else:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")


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


def get_duality_gap(solver_model, solver_name: str):
    """Retrieve the duality gap for the given solver model, if available."""
    if solver_name == "scip":
        return solver_model.getGap()
    elif solver_name == "gurobi":
        return solver_model.MIPGap
    elif solver_name == "highs":
        return getattr(solver_model.getInfo(), "mip_gap", None)
    elif solver_name == "cbc":
        return getattr(solver_model, "mip_gap", None)
    elif solver_name == "glpk":
        # GLPK does not have a way to retrieve the duality gap from python
        return None
    else:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")


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
            case _:
                print(f"WARNING: cannot obtain reported runtime for {solver_name}")
                return None
    except Exception:
        print(f"ERROR obtaining reported runtime: {format_exc()}", file=sys.stderr)
    return None


def main(solver_name, input_file, solver_version):
    problem_file = Path(input_file)
    solver = get_solver(solver_name)

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

    solver_name = sys.argv[1]
    input_file = sys.argv[2]
    solver_version = sys.argv[3]
    main(solver_name, input_file, solver_version)
