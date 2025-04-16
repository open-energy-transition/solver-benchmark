import json
import sys
from pathlib import Path
from time import perf_counter

import pandas as pd
from linopy import solvers
from linopy.solvers import SolverName

# HiGHS is not available in the 2020 environment that we use to run GLPK
try:
    import highspy
except ModuleNotFoundError:
    highspy = None


def get_solver(solver_name):
    try:
        solver_enum = SolverName(solver_name.lower())
    except ValueError:
        raise ValueError(f"Solver '{solver_name}' is not recognized")

    solver_class = getattr(solvers, solver_enum.name)

    seed_options = {
        "highs": {"random_seed": 0},
        "glpk": {"seed": 0},
        "gurobi": {"seed": 0},
        "scip": {
            "randomization/randomseedshift": 0,
        },
        "cbc": {"randomCbcSeed": 1},  # 0 indicates time of day
    }

    if solver_name.lower() in seed_options:
        return solver_class(**seed_options[solver_name.lower()])
    else:
        return solver_class()


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
    elif solver_name == "gurobi" and solver_model.IsMIP:
        return solver_model.MIPGap
    elif solver_name == "highs" and solver_model:
        info = solver_model.getInfo()
        return info.mip_gap if hasattr(info, "mip_gap") else None
    elif solver_name in {"glpk", "cbc"}:
        # These solvers do not have a way to retrieve the duality gap from python
        return None
    else:
        raise NotImplementedError(f"The solver '{solver_name}' is not supported.")


def get_milp_metrics(input_file, solver_result):
    """Uses HiGHS to read the problem file and compute max integrality violation and
    duality gap.
    """
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
    return None, None


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

    # We measure runtime here and not of this entire script because lines like
    # `import linopy` take a long (and varying) amount of time
    start_time = perf_counter()
    solver_result = solver.solve_problem(
        problem_fn=problem_file, solution_fn=solution_fn, log_fn=log_fn
    )
    runtime = perf_counter() - start_time

    duality_gap, max_integrality_violation = get_milp_metrics(input_file, solver_result)

    results = {
        "runtime": runtime,
        "status": solver_result.status.status.value,
        "condition": solver_result.status.termination_condition.value,
        "objective": solver_result.solution.objective,
        "duality_gap": duality_gap,
        "max_integrality_violation": max_integrality_violation,
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
